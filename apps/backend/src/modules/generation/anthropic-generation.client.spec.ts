import { ConfigService } from "@nestjs/config";
import { DocumentType, ThematiqueType } from "@sama-emi/contracts";
import { AnthropicGenerationError } from "./anthropic-generation.error";
import { CreateGenerationDto } from "./dto/create-generation.dto";

// L'appel réel à l'API Anthropic (streaming) n'est pas testé ici — seule
// la classification des erreurs et le calcul des tokens le sont, sans
// mock du SDK, pour rester robuste aux évolutions internes du client
// HTTP. Un mock du module @anthropic-ai/sdk simule les classes d'erreur
// et le flux de réponse pour les scénarios ci-dessous.
jest.mock("@anthropic-ai/sdk", () => {
  class RateLimitError extends Error {}
  class InternalServerError extends Error {}
  class APIConnectionError extends Error {}
  class APIError extends Error {}

  const finalMessageMock = jest.fn();
  const streamMock = { finalMessage: finalMessageMock };
  const streamFnMock = jest.fn(() => streamMock);

  const AnthropicMock: any = jest.fn().mockImplementation(() => ({
    messages: { stream: streamFnMock },
  }));
  AnthropicMock.RateLimitError = RateLimitError;
  AnthropicMock.InternalServerError = InternalServerError;
  AnthropicMock.APIConnectionError = APIConnectionError;
  AnthropicMock.APIError = APIError;
  AnthropicMock.__finalMessageMock = finalMessageMock;

  return { __esModule: true, default: AnthropicMock };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
import Anthropic from "@anthropic-ai/sdk";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { AnthropicGenerationClient } from "./anthropic-generation.client";

const finalMessageMock = (Anthropic as any).__finalMessageMock as jest.Mock;

function dtoScenario(): CreateGenerationDto {
  const dto = new CreateGenerationDto();
  dto.type = DocumentType.SCENARIO;
  dto.pays = "SN";
  dto.thematiqueType = ThematiqueType.PERSONNALISEE;
  dto.thematiqueLibre = "Test";
  dto.objectifsLibres = "Test";
  dto.public = "Adultes";
  dto.duree = "2h";
  dto.modalite = "PRESENTIEL" as any;
  dto.profilFormateur = "Formateur test";
  dto.langue = "fr";
  return dto;
}

function dtoParcours(nombreJours?: number): CreateGenerationDto {
  const dto = dtoScenario();
  dto.type = DocumentType.PARCOURS;
  dto.nombreJours = nombreJours;
  return dto;
}

function creerConfigService(valeurs: Record<string, string> = {}) {
  return {
    get: jest.fn((cle: string, defaut?: unknown) => valeurs[cle] ?? defaut),
  };
}

describe("AnthropicGenerationClient", () => {
  beforeEach(() => {
    finalMessageMock.mockReset();
    (Anthropic as unknown as jest.Mock).mockClear();
  });

  describe("clé API absente", () => {
    it("échoue immédiatement, de façon non transitoire, sans jamais appeler le SDK", async () => {
      const client = new AnthropicGenerationClient(creerConfigService({ ANTHROPIC_API_KEY: "" }) as unknown as ConfigService);

      await expect(client.genererContenu(dtoScenario(), "Titre")).rejects.toMatchObject({
        retryable: false,
        message: expect.stringContaining("ANTHROPIC_API_KEY"),
      });
      expect(Anthropic).not.toHaveBeenCalled();
    });
  });

  describe("calculerMaxTokens", () => {
    it("alloue 16000 tokens pour un scénario, quel que soit nombreJours", () => {
      const client = new AnthropicGenerationClient(creerConfigService() as unknown as ConfigService);
      expect((client as any).calculerMaxTokens(dtoScenario())).toBe(16000);
    });

    it("alloue davantage de tokens à un parcours plus long, avec un défaut de 2 jours", () => {
      const client = new AnthropicGenerationClient(creerConfigService() as unknown as ConfigService);
      expect((client as any).calculerMaxTokens(dtoParcours())).toBe(16000 + 2 * 6000);
      expect((client as any).calculerMaxTokens(dtoParcours(1))).toBe(16000 + 1 * 6000);
    });

    it("plafonne à 64000 tokens pour un parcours très long", () => {
      const client = new AnthropicGenerationClient(creerConfigService() as unknown as ConfigService);
      expect((client as any).calculerMaxTokens(dtoParcours(10))).toBe(64000);
    });
  });

  describe("réponse du modèle", () => {
    function creerClient(): AnthropicGenerationClient {
      return new AnthropicGenerationClient(creerConfigService({ ANTHROPIC_API_KEY: "sk-ant-test" }) as unknown as ConfigService);
    }

    it("retourne l'input du bloc tool_use en cas de succès", async () => {
      finalMessageMock.mockResolvedValue({
        stop_reason: "tool_use",
        content: [{ type: "tool_use", name: "rediger_scenario", input: { objectifGeneral: "Test" } }],
      });

      const resultat = await creerClient().genererContenu(dtoScenario(), "Titre");
      expect(resultat).toEqual({ objectifGeneral: "Test" });
    });

    it("échoue de façon non transitoire si le modèle refuse la génération", async () => {
      finalMessageMock.mockResolvedValue({ stop_reason: "refusal", content: [] });
      await expect(creerClient().genererContenu(dtoScenario(), "Titre")).rejects.toMatchObject({ retryable: false });
    });

    it("échoue de façon transitoire si aucun bloc tool_use n'est présent (retentable)", async () => {
      finalMessageMock.mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text: "..." }] });
      await expect(creerClient().genererContenu(dtoScenario(), "Titre")).rejects.toMatchObject({ retryable: true });
    });

    it("classe une RateLimitError comme transitoire", async () => {
      finalMessageMock.mockRejectedValue(new (Anthropic as any).RateLimitError("429"));
      await expect(creerClient().genererContenu(dtoScenario(), "Titre")).rejects.toMatchObject({ retryable: true });
    });

    it("classe une InternalServerError comme transitoire", async () => {
      finalMessageMock.mockRejectedValue(new (Anthropic as any).InternalServerError("500"));
      await expect(creerClient().genererContenu(dtoScenario(), "Titre")).rejects.toMatchObject({ retryable: true });
    });

    it("classe une APIError générique (ex. 400/401/403) comme non transitoire", async () => {
      finalMessageMock.mockRejectedValue(new (Anthropic as any).APIError("400 requête invalide"));
      await expect(creerClient().genererContenu(dtoScenario(), "Titre")).rejects.toMatchObject({ retryable: false });
    });

    it("classe une erreur totalement inattendue comme transitoire par prudence", async () => {
      finalMessageMock.mockRejectedValue(new Error("Panne inconnue"));
      await expect(creerClient().genererContenu(dtoScenario(), "Titre")).rejects.toMatchObject({ retryable: true });
    });

    it("ne construit le client Anthropic qu'une seule fois (mise en cache)", async () => {
      finalMessageMock.mockResolvedValue({ stop_reason: "tool_use", content: [{ type: "tool_use", name: "x", input: {} }] });
      const client = creerClient();
      await client.genererContenu(dtoScenario(), "Titre 1");
      await client.genererContenu(dtoScenario(), "Titre 2");
      expect(Anthropic).toHaveBeenCalledTimes(1);
    });
  });
});
