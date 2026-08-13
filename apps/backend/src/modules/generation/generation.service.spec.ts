import { DocumentType, GenerationJobStatut, Modalite, ThematiqueType } from "@sama-emi/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { DocumentsService } from "../documents/documents.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { CreateGenerationDto } from "./dto/create-generation.dto";
import { GenerationService } from "./generation.service";
import { JOB_GENERER_DOCUMENT, OPTIONS_JOB_GENERATION } from "./generation.types";

function dtoScenarioPersonnalise(): CreateGenerationDto {
  const dto = new CreateGenerationDto();
  dto.type = DocumentType.SCENARIO;
  dto.pays = "sn";
  dto.thematiqueType = ThematiqueType.PERSONNALISEE;
  dto.thematiqueLibre = "Vérifier une source avant de la partager";
  dto.objectifsLibres = "Objectifs de test";
  dto.public = "Adultes";
  dto.duree = "2h";
  dto.modalite = Modalite.PRESENTIEL;
  dto.profilFormateur = "Formateur test";
  dto.langue = "fr";
  return dto;
}

describe("GenerationService", () => {
  let prisma: { generationJob: { create: jest.Mock; findUnique: jest.Mock } };
  let documentsService: { create: jest.Mock };
  let subscriptionsService: { consommerQuota: jest.Mock };
  let file: { add: jest.Mock };
  let service: GenerationService;

  beforeEach(() => {
    prisma = { generationJob: { create: jest.fn(), findUnique: jest.fn() } };
    documentsService = { create: jest.fn() };
    subscriptionsService = { consommerQuota: jest.fn() };
    file = { add: jest.fn() };
    service = new GenerationService(
      prisma as unknown as PrismaService,
      documentsService as unknown as DocumentsService,
      subscriptionsService as unknown as SubscriptionsService,
      file as any,
    );
  });

  describe("lancerGeneration", () => {
    it("consomme le quota avant de créer le document et le job, puis met le job en file avec toutes les données nécessaires au remboursement", async () => {
      subscriptionsService.consommerQuota.mockResolvedValue({ subscriptionId: "sub-1", type: "ESSAI" });
      documentsService.create.mockResolvedValue({ id: "doc-1" });
      prisma.generationJob.create.mockResolvedValue({ id: "job-1", statut: GenerationJobStatut.EN_FILE });

      const dto = dtoScenarioPersonnalise();
      const resultat = await service.lancerGeneration(dto, "user-1");

      expect(subscriptionsService.consommerQuota).toHaveBeenCalledWith("user-1");
      expect(documentsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: DocumentType.SCENARIO, userId: "user-1", pays: "SN" }),
      );
      expect(prisma.generationJob.create).toHaveBeenCalledWith({
        data: { documentId: "doc-1", statut: GenerationJobStatut.EN_FILE },
      });
      expect(file.add).toHaveBeenCalledWith(
        JOB_GENERER_DOCUMENT,
        expect.objectContaining({
          jobId: "job-1",
          documentId: "doc-1",
          userId: "user-1",
          subscriptionId: "sub-1",
          typeConsommationQuota: "ESSAI",
        }),
        { ...OPTIONS_JOB_GENERATION, jobId: "job-1" },
      );
      expect(resultat).toEqual({ jobId: "job-1", documentId: "doc-1", statut: GenerationJobStatut.EN_FILE });
    });

    it("ne crée ni document ni job si le quota est refusé", async () => {
      subscriptionsService.consommerQuota.mockRejectedValue(new Error("quota épuisé"));

      await expect(service.lancerGeneration(dtoScenarioPersonnalise(), "user-1")).rejects.toThrow("quota épuisé");

      expect(documentsService.create).not.toHaveBeenCalled();
      expect(prisma.generationJob.create).not.toHaveBeenCalled();
      expect(file.add).not.toHaveBeenCalled();
    });
  });
});
