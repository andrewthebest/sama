import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { CreateGenerationResponseDto, DocumentType, GenerationJobStatut, ThematiqueType } from "@sama-emi/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { DocumentsService } from "../documents/documents.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { CreateGenerationDto } from "./dto/create-generation.dto";
import { DonneesJobGeneration, FILE_GENERATION, JOB_GENERER_DOCUMENT, OPTIONS_JOB_GENERATION } from "./generation.types";

/**
 * Service central du module `generation`.
 *
 * `lancerGeneration` réserve le quota (`SubscriptionsService`), crée le
 * document et son job, puis délègue le travail réel (appel Anthropic,
 * assemblage, persistance) à `GenerationProcessor` via la file BullMQ
 * `generation` — voir ce processor pour l'appel au moteur réel, sa
 * politique de nouvelle tentative sur erreur transitoire, et le
 * remboursement de quota sur échec définitif.
 */
@Injectable()
export class GenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
    private readonly subscriptionsService: SubscriptionsService,
    @InjectQueue(FILE_GENERATION) private readonly file: Queue<DonneesJobGeneration>,
  ) {}

  async lancerGeneration(dto: CreateGenerationDto, userId: string): Promise<CreateGenerationResponseDto> {
    const { subscriptionId, type: typeConsommationQuota } = await this.subscriptionsService.consommerQuota(userId);

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
      { jobId: job.id, documentId: document.id, titre, dto, userId, subscriptionId, typeConsommationQuota },
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

  private deriverTitre(dto: CreateGenerationDto): string {
    const sujet = dto.thematiqueType === ThematiqueType.PERSONNALISEE ? dto.thematiqueLibre! : dto.referentielRefemi!.thematique;
    const prefixe = dto.type === DocumentType.PARCOURS ? "Parcours" : "Scénario";
    return `${prefixe} — ${sujet}`;
  }
}
