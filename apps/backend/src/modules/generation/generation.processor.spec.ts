import { GenerationEtape, GenerationJobStatut } from "@sama-emi/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { DocumentsService } from "../documents/documents.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { AnthropicGenerationClient } from "./anthropic-generation.client";
import { AnthropicGenerationError } from "./anthropic-generation.error";
import { ContentComposerService } from "./content-composer.service";
import { GenerationGateway } from "./gateway/generation.gateway";
import { GenerationProcessor } from "./generation.processor";
import { DonneesJobGeneration } from "./generation.types";

function creerJob(donnees: Partial<DonneesJobGeneration> = {}, attemptsMade = 0, attempts = 3) {
  return {
    data: {
      jobId: "job-1",
      documentId: "doc-1",
      titre: "Titre de test",
      dto: {} as any,
      userId: "user-1",
      subscriptionId: "sub-1",
      typeConsommationQuota: "ESSAI",
      ...donnees,
    },
    attemptsMade,
    opts: { attempts },
  } as any;
}

describe("GenerationProcessor", () => {
  let prisma: { generationJob: { update: jest.Mock } };
  let documentsService: { ajouterVersion: jest.Mock };
  let subscriptionsService: { rembourserQuota: jest.Mock };
  let gateway: { emettreProgression: jest.Mock };
  let anthropicClient: { genererContenu: jest.Mock };
  let contentComposer: { composer: jest.Mock };
  let processor: GenerationProcessor;

  beforeEach(() => {
    prisma = { generationJob: { update: jest.fn().mockResolvedValue({}) } };
    documentsService = { ajouterVersion: jest.fn().mockResolvedValue({}) };
    subscriptionsService = { rembourserQuota: jest.fn().mockResolvedValue(undefined) };
    gateway = { emettreProgression: jest.fn() };
    anthropicClient = { genererContenu: jest.fn() };
    contentComposer = { composer: jest.fn() };
    processor = new GenerationProcessor(
      prisma as unknown as PrismaService,
      documentsService as unknown as DocumentsService,
      subscriptionsService as unknown as SubscriptionsService,
      gateway as unknown as GenerationGateway,
      anthropicClient as unknown as AnthropicGenerationClient,
      contentComposer as unknown as ContentComposerService,
    );
  });

  it("chemin de succès : compose le contenu, persiste la version, marque TERMINE et ne rembourse rien", async () => {
    anthropicClient.genererContenu.mockResolvedValue({ sortie: "brute" });
    contentComposer.composer.mockReturnValue({ contenu: "final" });

    await processor.process(creerJob());

    expect(documentsService.ajouterVersion).toHaveBeenCalledWith("doc-1", { contenu: "final" }, expect.any(String));
    expect(prisma.generationJob.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: expect.objectContaining({ statut: GenerationJobStatut.TERMINE, etape: GenerationEtape.FINALISATION, progression: 100 }),
    });
    expect(gateway.emettreProgression).toHaveBeenLastCalledWith(
      expect.objectContaining({ statut: GenerationJobStatut.TERMINE, progression: 100 }),
    );
    expect(subscriptionsService.rembourserQuota).not.toHaveBeenCalled();
  });

  it("erreur transitoire, tentatives restantes : relance l'erreur (BullMQ retente) sans rembourser ni marquer ECHOUE", async () => {
    const erreur = new AnthropicGenerationError("Limite de débit atteinte", true);
    anthropicClient.genererContenu.mockRejectedValue(erreur);

    await expect(processor.process(creerJob({}, 0, 3))).rejects.toThrow(erreur);

    expect(subscriptionsService.rembourserQuota).not.toHaveBeenCalled();
    expect(prisma.generationJob.update).not.toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ statut: GenerationJobStatut.ECHOUE }) }));
  });

  it("erreur non transitoire : marque ECHOUE, rembourse la quota exacte, et n'entrave pas BullMQ (pas de rethrow)", async () => {
    const erreur = new AnthropicGenerationError("Clé API invalide", false);
    anthropicClient.genererContenu.mockRejectedValue(erreur);

    await expect(processor.process(creerJob({ subscriptionId: "sub-42", typeConsommationQuota: "ABONNEMENT" }, 0, 3))).resolves.toBeUndefined();

    expect(subscriptionsService.rembourserQuota).toHaveBeenCalledWith("sub-42", "ABONNEMENT");
    expect(prisma.generationJob.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: { statut: GenerationJobStatut.ECHOUE, erreur: "Clé API invalide" },
    });
    expect(gateway.emettreProgression).toHaveBeenLastCalledWith(
      expect.objectContaining({ statut: GenerationJobStatut.ECHOUE, erreur: "Clé API invalide" }),
    );
  });

  it("erreur transitoire à la dernière tentative : traitée comme définitive (remboursement, ECHOUE, pas de rethrow)", async () => {
    const erreur = new AnthropicGenerationError("Erreur 500 transitoire", true);
    anthropicClient.genererContenu.mockRejectedValue(erreur);

    // attemptsMade=2, attempts=3 -> attemptsMade + 1 >= attempts -> dernier essai.
    await expect(processor.process(creerJob({}, 2, 3))).resolves.toBeUndefined();

    expect(subscriptionsService.rembourserQuota).toHaveBeenCalledWith("sub-1", "ESSAI");
    expect(prisma.generationJob.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: { statut: GenerationJobStatut.ECHOUE, erreur: "Erreur 500 transitoire" },
    });
  });

  it("une erreur générique (non AnthropicGenerationError) est traitée comme transitoire par défaut", async () => {
    const erreur = new Error("Panne réseau inattendue");
    anthropicClient.genererContenu.mockRejectedValue(erreur);

    await expect(processor.process(creerJob({}, 0, 3))).rejects.toThrow(erreur);
    expect(subscriptionsService.rembourserQuota).not.toHaveBeenCalled();
  });
});
