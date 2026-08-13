import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { CreateGenerationResponseDto, DocumentType, GenerationJobStatut, ThematiqueType } from "@sama-emi/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { DocumentsService } from "../documents/documents.service";
import { CreateGenerationDto } from "./dto/create-generation.dto";
import { DonneesJobGeneration, FILE_GENERATION, JOB_GENERER_DOCUMENT, OPTIONS_JOB_GENERATION } from "./generation.types";

/**
 * Service central du module `generation`.
 *
 * `lancerGeneration` crée le document et son job, puis délègue le
 * travail réel (appel Anthropic, assemblage, persistance) à
 * `GenerationProcessor` via la file BullMQ `generation` — voir ce
 * processor pour l'appel au moteur réel et sa politique de nouvelle
 * tentative sur erreur transitoire.
 */
@Injectable()
export class GenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
    @InjectQueue(FILE_GENERATION) private readonly file: Queue<DonneesJobGeneration>,
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

    // L'identifiant du job BullMQ est calé sur celui du GenerationJob
    // pour que GenerationProcessor puisse mettre à jour la bonne ligne
    // sans indirection supplémentaire.
    await this.file.add(
      JOB_GENERER_DOCUMENT,
      { jobId: job.id, documentId: document.id, titre, dto },
      { ...OPTIONS_JOB_GENERATION, jobId: job.id },
    );

    return { jobId: job.id, documentId: document.id, statut: job.statut as GenerationJobStatut };
  }

  async trouverJob(jobId: string) {
    const job = await this.prisma.generationJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException("Génération introuvable.");
    }
    return job;
  }

  /**
   * Vérifie le quota disponible avant de lancer une génération, comme
   * l'exige le flux utilisateur (cahier des charges, section 3.2,
   * étape 3). Implémentation minimale : seul l'essai gratuit est
   * vérifié et décompté. La grille de quotas par palier d'abonnement,
   * la distinction par type de génération (scénario/parcours/ressource)
   * et la politique de blocage complète appartiennent au futur module
   * `subscriptions` (Lot 2) — cette méthode sera alors déplacée vers
   * `SubscriptionsService.consumeQuota()` sans changer l'appelant.
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
    // (pas de report au mois suivant, pas d'achat à l'unité).
    throw new ForbiddenException("Quota de générations épuisé. Un abonnement actif est requis pour continuer.");
  }

  private deriverTitre(dto: CreateGenerationDto): string {
    const sujet = dto.thematiqueType === ThematiqueType.PERSONNALISEE ? dto.thematiqueLibre! : dto.referentielRefemi!.thematique;
    const prefixe = dto.type === DocumentType.PARCOURS ? "Parcours" : "Scénario";
    return `${prefixe} — ${sujet}`;
  }
}
