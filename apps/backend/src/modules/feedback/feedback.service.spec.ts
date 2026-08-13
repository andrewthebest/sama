import { PrismaService } from "../../prisma/prisma.service";
import { DocumentsService } from "../documents/documents.service";
import { FeedbackService } from "./feedback.service";

function creerPrismaMock() {
  return {
    feedback: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
}

describe("FeedbackService", () => {
  let prisma: ReturnType<typeof creerPrismaMock>;
  let documentsService: { findOneForUser: jest.Mock };
  let service: FeedbackService;

  beforeEach(() => {
    prisma = creerPrismaMock();
    documentsService = { findOneForUser: jest.fn() };
    service = new FeedbackService(prisma as unknown as PrismaService, documentsService as unknown as DocumentsService);
  });

  describe("creerFeedback", () => {
    it("vérifie la propriété du document avant de créer le retour", async () => {
      documentsService.findOneForUser.mockResolvedValue({ document: {}, versionCourante: null });
      prisma.feedback.create.mockResolvedValue({ id: "fb-1" });

      await service.creerFeedback("doc-1", "user-1", { note: 4, commentaire: "Bien" });

      expect(documentsService.findOneForUser).toHaveBeenCalledWith("doc-1", "user-1");
      expect(prisma.feedback.create).toHaveBeenCalledWith({
        data: { documentId: "doc-1", userId: "user-1", note: 4, commentaire: "Bien", dureeReellePrevue: undefined, champsStructures: undefined },
      });
    });

    it("propage le refus si le document n'appartient pas à l'utilisateur (403/404 de DocumentsService)", async () => {
      const erreur = new Error("Ce document ne vous appartient pas.");
      documentsService.findOneForUser.mockRejectedValue(erreur);

      await expect(service.creerFeedback("doc-1", "intrus", { note: 1 })).rejects.toThrow(erreur);
      expect(prisma.feedback.create).not.toHaveBeenCalled();
    });
  });

  describe("listerParDocument", () => {
    it("vérifie la propriété du document avant de lister ses retours", async () => {
      documentsService.findOneForUser.mockResolvedValue({ document: {}, versionCourante: null });
      prisma.feedback.findMany.mockResolvedValue([]);

      await service.listerParDocument("doc-1", "user-1");

      expect(documentsService.findOneForUser).toHaveBeenCalledWith("doc-1", "user-1");
      expect(prisma.feedback.findMany).toHaveBeenCalledWith({ where: { documentId: "doc-1" }, orderBy: { createdAt: "desc" } });
    });
  });

  describe("resumeParUtilisateur", () => {
    it("calcule la note moyenne sur l'ensemble des retours de l'utilisateur", async () => {
      prisma.feedback.findMany.mockResolvedValue([{ note: 4 }, { note: 5 }, { note: 3 }]);

      const resultat = await service.resumeParUtilisateur("user-1");

      expect(resultat).toEqual({ nombreFeedbacks: 3, noteMoyenne: 4, feedbacks: [{ note: 4 }, { note: 5 }, { note: 3 }] });
    });

    it("retourne une moyenne nulle plutôt qu'une division par zéro quand l'utilisateur n'a laissé aucun retour", async () => {
      prisma.feedback.findMany.mockResolvedValue([]);

      const resultat = await service.resumeParUtilisateur("user-1");

      expect(resultat).toEqual({ nombreFeedbacks: 0, noteMoyenne: null, feedbacks: [] });
    });
  });
});
