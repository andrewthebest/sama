import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import {
  CreateGenerationResponseDto,
  DocumentType,
  GenerationJobStatut,
  ThematiqueType,
} from "@sama-emi/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { DocumentsService } from "../documents/documents.service";
import { CreateGenerationDto } from "./dto/create-generation.dto";
import { GenerationGateway } from "./gateway/generation.gateway";
import { ETAPES_SIMULEES } from "./generation.types";
import { MockContentBuilder } from "./mock-content.builder";

/**
 * Service central du module `generation`.
 *
 * En Session A, `demarrerSimulation` remplace l'appel réel à l'API
 * Anthropic (prévu en Session B avec `@anthropic-ai/sdk` et le tool use
 * en cascade) : il fait avancer un `GenerationJob` à travers les 4
 * étapes du cahier des charges, diffuse chaque changement d'étape sur le
 * WebSocket, puis persiste un contenu simulé via `DocumentsService`.
 * Remplacer cette méthode par l'appel réel est le seul changement
 * nécessaire pour brancher le vrai moteur : le reste du flux (contrôleur,
 * gateway, persistance) ne bouge pas.
 */
@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
    private readonly gateway: GenerationGateway,
    private readonly mockContentBuilder: MockContentBuilder,
  ) {}

  async lancerGeneration(dto: CreateGenerationDto, userId: string): Promise<CreateGenerationResponseDto> {
    await this.verifierEtReserverQuota(userId);

    const titre = this.deriverTitre(dto);

    const document = await this.documentsService.create({
      type: dto.type,
      userId,
      titre,
      pays: dto.pays.toUpperCase(),
      thematiqueType: dto.thematiqueType,
      referentielRefemi: dto.referentielRefemi as object | undefined,
      thematiqueLibre: dto.thematiqueLibre,
      objectifsLibres: dto.objectifsLibres,
      parametresGeneration: {
        public: dto.public,
        duree: dto.duree,
        modalite: dto.modalite,
        profilFormateur: dto.profilFormateur,
        niveau: dto.niveau ?? null,
        langue: dto.langue,
        nombreJours: dto.nombreJours ?? null,
        formatGlobal: dto.formatGlobal ?? null,
      },
    });

    const job = await this.prisma.generationJob.create({
      data: { documentId: document.id, statut: GenerationJobStatut.EN_FILE },
    });

    // Fire-and-forget : la requête HTTP répond immédiatement avec le jobId,
    // la progression est ensuite suivie via le WebSocket (cahier des
    // charges, section 3.2, étape 2 : « la demande est mise en file
    // d'attente »). Les erreurs de la simulation sont capturées et
    // reflétées dans le statut du job, jamais laissées non gérées.
    this.demarrerSimulation(job.id, document.id, dto, titre).catch((erreur: unknown) => {
      this.logger.error(`Échec de la simulation de génération pour le job ${job.id}`, erreur);
    });

    return { jobId: job.id, documentId: document.id, statut: job.statut as GenerationJobStatut };
  }

  async trouverJob(jobId: string) {
    const job = await this.prisma.generationJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException("Génération introuvable.");
    }
    return job;
  }

  private async demarrerSimulation(
    jobId: string,
    documentId: string,
    dto: CreateGenerationDto,
    titre: string,
  ): Promise<void> {
    await this.prisma.generationJob.update({
      where: { id: jobId },
      data: { statut: GenerationJobStatut.EN_COURS, demarreLe: new Date() },
    });

    for (const { etape, progression, delaiMs } of ETAPES_SIMULEES) {
      await this.attendre(delaiMs);
      await this.prisma.generationJob.update({ where: { id: jobId }, data: { etape, progression } });
      this.gateway.emettreProgression({
        jobId,
        documentId,
        statut: GenerationJobStatut.EN_COURS,
        etape,
        progression,
      });
    }

    const contenuSimule = this.mockContentBuilder.construire(dto, titre);
    await this.documentsService.ajouterVersion(documentId, contenuSimule, "Version initiale (mock Session A)");

    await this.prisma.generationJob.update({
      where: { id: jobId },
      data: { statut: GenerationJobStatut.TERMINE, termineLe: new Date() },
    });

    this.gateway.emettreProgression({
      jobId,
      documentId,
      statut: GenerationJobStatut.TERMINE,
      etape: null,
      progression: 100,
    });
  }

  /**
   * Vérifie le quota disponible avant de lancer une génération, comme
   * l'exige le flux utilisateur (cahier des charges, section 3.2,
   * étape 3). Implémentation minimale pour la Session A : seul l'essai
   * gratuit est vérifié et décompté. La grille de quotas par palier
   * d'abonnement, la distinction par type de génération
   * (scénario/parcours/ressource) et la politique de blocage complète
   * appartiennent au futur module `subscriptions` (Lot 2) — cette
   * méthode sera alors déplacée vers `SubscriptionsService.consumeQuota()`
   * sans changer l'appelant.
   */
  private async verifierEtReserverQuota(userId: string): Promise<void> {
    const abonnement = await this.prisma.userSubscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!abonnement) {
      throw new ForbiddenException("Aucun abonnement ou essai associé à ce compte.");
    }

    if (abonnement.statut === "ACTIF") {
      await this.prisma.userSubscription.update({
        where: { id: abonnement.id },
        data: { generationsUtilisees: { increment: 1 } },
      });
      return;
    }

    if (abonnement.essaisGratuitsRestants > 0) {
      await this.prisma.userSubscription.update({
        where: { id: abonnement.id },
        data: { essaisGratuitsRestants: { decrement: 1 } },
      });
      return;
    }

    // Politique de dépassement de quota validée en cadrage : blocage
    // (pas de report au mois suivant, pas d'achat à l'unité en Session A).
    throw new ForbiddenException("Quota de générations épuisé. Un abonnement actif est requis pour continuer.");
  }

  private deriverTitre(dto: CreateGenerationDto): string {
    const sujet = dto.thematiqueType === ThematiqueType.PERSONNALISEE ? dto.thematiqueLibre! : dto.referentielRefemi!.thematique;
    const prefixe = dto.type === DocumentType.PARCOURS ? "Parcours" : "Scénario";
    return `${prefixe} — ${sujet}`;
  }

  private attendre(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
