import { Injectable } from "@nestjs/common";
import { Feedback } from "@prisma/client";
import { CreateFeedbackRequestDto, FeedbackEntity } from "@sama-emi/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { DocumentsService } from "../documents/documents.service";

/**
 * Service du module `feedback` — retours de session rattachés à un
 * document généré, traçables par document et par utilisateur.
 */
@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
  ) {}

  /**
   * Crée un retour de session pour un document. Vérifie au passage,
   * via `DocumentsService.findOneForUser`, que le document appartient
   * bien à l'utilisateur (mêmes exceptions 404/403 qu'un accès direct au
   * document) — un retour de session ne peut être laissé que par la
   * personne qui a généré le document.
   */
  async creerFeedback(documentId: string, userId: string, dto: CreateFeedbackRequestDto): Promise<Feedback> {
    await this.documentsService.findOneForUser(documentId, userId);
    return this.prisma.feedback.create({
      data: {
        documentId,
        userId,
        note: dto.note,
        commentaire: dto.commentaire,
        dureeReellePrevue: dto.dureeReellePrevue,
        champsStructures: dto.champsStructures as object | undefined,
      },
    });
  }

  /** Retours de session d'un document, du plus récent au plus ancien. Même vérification de propriété que `creerFeedback`. */
  async listerParDocument(documentId: string, userId: string): Promise<Feedback[]> {
    await this.documentsService.findOneForUser(documentId, userId);
    return this.prisma.feedback.findMany({ where: { documentId }, orderBy: { createdAt: "desc" } });
  }

  /** Vue agrégée des retours donnés par l'utilisateur, tous documents confondus. */
  async resumeParUtilisateur(userId: string): Promise<{ nombreFeedbacks: number; noteMoyenne: number | null; feedbacks: Feedback[] }> {
    const feedbacks = await this.prisma.feedback.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    const noteMoyenne = feedbacks.length > 0 ? feedbacks.reduce((somme, f) => somme + f.note, 0) / feedbacks.length : null;
    return { nombreFeedbacks: feedbacks.length, noteMoyenne, feedbacks };
  }

  toPublicEntity(feedback: Feedback): FeedbackEntity {
    return {
      id: feedback.id,
      documentId: feedback.documentId,
      userId: feedback.userId,
      note: feedback.note,
      commentaire: feedback.commentaire,
      dureeReellePrevue: feedback.dureeReellePrevue,
      champsStructures: feedback.champsStructures as Record<string, unknown> | null,
      createdAt: feedback.createdAt.toISOString(),
    };
  }
}
