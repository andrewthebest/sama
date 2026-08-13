import { Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { GenerationEtape, GenerationJobStatut } from "@sama-emi/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { DocumentsService } from "../documents/documents.service";
import { AnthropicGenerationClient } from "./anthropic-generation.client";
import { AnthropicGenerationError } from "./anthropic-generation.error";
import { ContentComposerService } from "./content-composer.service";
import { GenerationGateway } from "./gateway/generation.gateway";
import { DonneesJobGeneration, FILE_GENERATION } from "./generation.types";

/**
 * Traite les jobs de la file `generation` : appelle le moteur réel
 * (Anthropic, tool use), compose le contenu final avec les blocs
 * fixes, le persiste, et diffuse la progression sur le WebSocket.
 *
 * La politique de nouvelle tentative (voir `OPTIONS_JOB_GENERATION`)
 * est gérée par BullMQ lui-même : ce processor n'a qu'à faire la
 * distinction entre une erreur transitoire (il la relance — `throw`
 * pour déclencher le backoff de BullMQ) et une erreur définitive
 * (il marque le job `ECHOUE` en base et absorbe l'erreur, pour ne pas
 * gaspiller les tentatives restantes sur une requête vouée à échouer
 * de la même façon).
 */
@Processor(FILE_GENERATION)
export class GenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(GenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
    private readonly gateway: GenerationGateway,
    private readonly anthropicClient: AnthropicGenerationClient,
    private readonly contentComposer: ContentComposerService,
  ) {
    super();
  }

  async process(job: Job<DonneesJobGeneration>): Promise<void> {
    const { jobId, documentId, dto, titre } = job.data;

    try {
      await this.avancerEtape(jobId, documentId, GenerationJobStatut.EN_COURS, GenerationEtape.CADRAGE_RECU, 10);

      const sortieBrute = await this.anthropicClient.genererContenu(dto, titre);

      await this.avancerEtape(jobId, documentId, GenerationJobStatut.EN_COURS, GenerationEtape.GENERATION_CONTENU, 60);

      const contenu = this.contentComposer.composer(sortieBrute, dto, titre);

      await this.avancerEtape(jobId, documentId, GenerationJobStatut.EN_COURS, GenerationEtape.MISE_EN_FORME, 85);

      await this.documentsService.ajouterVersion(documentId, contenu, "Version générée par l'API Anthropic");

      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: { statut: GenerationJobStatut.TERMINE, etape: GenerationEtape.FINALISATION, progression: 100, termineLe: new Date() },
      });
      this.gateway.emettreProgression({
        jobId,
        documentId,
        statut: GenerationJobStatut.TERMINE,
        etape: GenerationEtape.FINALISATION,
        progression: 100,
      });
    } catch (erreur) {
      await this.gererErreur(job, erreur);
    }
  }

  private async avancerEtape(
    jobId: string,
    documentId: string,
    statut: GenerationJobStatut,
    etape: GenerationEtape,
    progression: number,
  ): Promise<void> {
    await this.prisma.generationJob.update({ where: { id: jobId }, data: { statut, etape, progression, demarreLe: new Date() } });
    this.gateway.emettreProgression({ jobId, documentId, statut, etape, progression });
  }

  private async gererErreur(job: Job<DonneesJobGeneration>, erreur: unknown): Promise<void> {
    const { jobId, documentId } = job.data;
    const estTransitoire = erreur instanceof AnthropicGenerationError ? erreur.retryable : true;
    const dernierEssai = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
    const message = erreur instanceof Error ? erreur.message : "Erreur inconnue lors de la génération.";

    if (estTransitoire && !dernierEssai) {
      this.logger.warn(`Erreur transitoire pour le job ${jobId} (tentative ${job.attemptsMade + 1}) : ${message}`);
      throw erreur; // BullMQ retente avec le backoff configuré.
    }

    this.logger.error(`Échec définitif du job ${jobId} : ${message}`);
    await this.prisma.generationJob.update({
      where: { id: jobId },
      data: { statut: GenerationJobStatut.ECHOUE, erreur: message },
    });
    this.gateway.emettreProgression({
      jobId,
      documentId,
      statut: GenerationJobStatut.ECHOUE,
      etape: null,
      progression: 0,
      erreur: message,
    });
    // Ne pas relancer : le job est déjà marqué en échec de façon
    // définitive, laisser BullMQ retenter n'y changerait rien.
  }
}
