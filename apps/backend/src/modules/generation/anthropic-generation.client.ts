import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";
import { DocumentType, ThematiqueType } from "@sama-emi/contracts";
import { CreateGenerationDto } from "./dto/create-generation.dto";
import { AnthropicGenerationError } from "./anthropic-generation.error";
import { OUTIL_REDIGER_PARCOURS, OUTIL_REDIGER_SCENARIO } from "./anthropic-tool-schema";

/**
 * Client du moteur de génération réel.
 *
 * Point clé de l'architecture : Claude ne rédige jamais le document
 * librement. Un seul outil est déclaré et son appel est forcé
 * (`tool_choice`), ce qui garantit que la réponse est exactement la
 * structure attendue par `DocxAssembler` — aucun parsing de texte
 * libre, aucun risque de dérive de format.
 *
 * `thinking` est explicitement désactivé (`{type: "disabled"}`) : cette
 * génération est un remplissage de schéma en un seul appel, pas un
 * raisonnement agentique multi-étapes — le raisonnement n'apporterait
 * rien ici et ralentirait la réponse. Sur Claude Opus 5, `disabled`
 * n'est valide qu'à l'effort `high` ou moins (400 au-delà) ; sur Claude
 * Sonnet 5, `disabled` est accepté à tout niveau d'effort.
 *
 * `model` (`ANTHROPIC_MODEL`, défaut `claude-opus-5`) et `effort`
 * (`ANTHROPIC_EFFORT`, défaut `high`) sont configurables par variable
 * d'environnement.
 */
@Injectable()
export class AnthropicGenerationClient {
  private readonly logger = new Logger(AnthropicGenerationClient.name);
  private client: Anthropic | null = null;

  constructor(private readonly configService: ConfigService) {}

  private obtenirClient(): Anthropic {
    if (!this.client) {
      const apiKey = this.configService.get<string>("ANTHROPIC_API_KEY");
      if (!apiKey) {
        throw new AnthropicGenerationError(
          "ANTHROPIC_API_KEY n'est pas configurée. Le moteur de génération réel ne peut pas être appelé.",
          false,
        );
      }
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  /**
   * Appelle Claude pour produire le contenu structuré d'un document,
   * conforme au schéma d'outil du type demandé (scénario ou parcours).
   *
   * @returns L'objet JSON validé par le schéma d'outil (voir
   * `anthropic-tool-schema.ts`) — jamais du texte libre.
   */
  async genererContenu(dto: CreateGenerationDto, titre: string): Promise<unknown> {
    const client = this.obtenirClient();
    const outil = dto.type === DocumentType.PARCOURS ? OUTIL_REDIGER_PARCOURS : OUTIL_REDIGER_SCENARIO;
    const model = this.configService.get<string>("ANTHROPIC_MODEL", "claude-opus-5");
    const effort = this.configService.get<"low" | "medium" | "high" | "xhigh" | "max">("ANTHROPIC_EFFORT", "high");
    const maxTokens = this.calculerMaxTokens(dto);

    try {
      const stream = client.messages.stream({
        model,
        max_tokens: maxTokens,
        system: this.construireSystemPrompt(),
        thinking: { type: "disabled" },
        output_config: { effort },
        tools: [outil],
        tool_choice: { type: "tool", name: outil.name },
        messages: [{ role: "user", content: this.construireMessageUtilisateur(dto, titre) }],
      });

      const message = await stream.finalMessage();

      if (message.stop_reason === "refusal") {
        throw new AnthropicGenerationError(
          "La génération a été refusée par les garde-fous de sécurité du modèle.",
          false,
        );
      }

      const blocOutil = message.content.find((bloc) => bloc.type === "tool_use");
      if (!blocOutil || blocOutil.type !== "tool_use") {
        throw new AnthropicGenerationError("Aucun appel d'outil trouvé dans la réponse du modèle.", true);
      }

      return blocOutil.input;
    } catch (erreur) {
      if (erreur instanceof AnthropicGenerationError) throw erreur;
      throw this.mapperErreur(erreur);
    }
  }

  private mapperErreur(erreur: unknown): AnthropicGenerationError {
    if (erreur instanceof Anthropic.RateLimitError) {
      return new AnthropicGenerationError("Limite de débit Anthropic atteinte.", true, erreur);
    }
    if (erreur instanceof Anthropic.InternalServerError || erreur instanceof Anthropic.APIConnectionError) {
      return new AnthropicGenerationError("Erreur transitoire de l'API Anthropic.", true, erreur);
    }
    if (erreur instanceof Anthropic.APIError) {
      // 400/401/403/404 — la requête elle-même est en cause, un nouvel essai identique échouerait pareil.
      return new AnthropicGenerationError(`Erreur Anthropic non transitoire : ${erreur.message}`, false, erreur);
    }
    this.logger.error("Erreur inattendue lors de l'appel Anthropic", erreur as Error);
    return new AnthropicGenerationError("Erreur inattendue lors de l'appel au moteur de génération.", true, erreur);
  }

  /** Alloue davantage de tokens de sortie à un parcours multi-jours qu'à un scénario simple. */
  private calculerMaxTokens(dto: CreateGenerationDto): number {
    if (dto.type !== DocumentType.PARCOURS) return 16000;
    const jours = dto.nombreJours ?? 2;
    return Math.min(16000 + jours * 6000, 64000);
  }

  private construireSystemPrompt(): string {
    return [
      "Tu es un·e expert·e en Éducation aux Médias et à l'Information (EMI), formé·e au référentiel francophone REFEMI.",
      "Tu remplis le schéma structuré de l'outil fourni — tu ne rédiges jamais de texte libre en dehors de ce schéma.",
      "",
      "Règles non négociables :",
      "- Les objectifs spécifiques suivent strictement la méthode SMART (spécifique, mesurable, atteignable, réaliste, temporellement défini). N'inclus jamais d'étiquette de taxonomie de Bloom entre parenthèses.",
      "- Le champ modeApprentissage de chaque ligne de déroulé doit être choisi exclusivement parmi les valeurs de l'énumération fournie par le schéma.",
      "- N'inclus JAMAIS l'encadré « Gestes professionnels du formateur » ni de mention sur la banque de ressources de la plateforme : ces éléments sont ajoutés séparément par le système, en dehors de ta réponse.",
      "- Contextualise systématiquement les exemples, les contraintes matérielles et les références au pays et à la modalité indiqués.",
      "- Adapte le vocabulaire et la complexité au niveau et au public précisés.",
      "- Rédige l'intégralité du contenu dans la langue demandée pour le document.",
    ].join("\n");
  }

  private construireMessageUtilisateur(dto: CreateGenerationDto, titre: string): string {
    const lignes = [`Titre du document : ${titre}`, `Type : ${dto.type}`, `Pays : ${dto.pays}`, `Langue de rédaction : ${dto.langue}`];

    if (dto.thematiqueType === ThematiqueType.REFEMI && dto.referentielRefemi) {
      lignes.push(
        "Thématique : rattachée au référentiel REFEMI",
        `Culture : ${dto.referentielRefemi.culture}`,
        `Compétence : ${dto.referentielRefemi.competence}`,
        `Niveau REFEMI : ${dto.referentielRefemi.niveau}`,
        `Thématique précise : ${dto.referentielRefemi.thematique}`,
      );
    } else {
      lignes.push(
        "Thématique : personnalisée (hors référentiel REFEMI)",
        `Thématique libre : ${dto.thematiqueLibre}`,
        `Objectifs exprimés par l'utilisateur : ${dto.objectifsLibres}`,
      );
    }

    lignes.push(
      `Public : ${dto.public}`,
      `Durée : ${dto.duree}`,
      `Modalité : ${dto.modalite}`,
      `Profil du formateur : ${dto.profilFormateur}`,
    );

    if (dto.type === DocumentType.PARCOURS) {
      lignes.push(`Nombre de jours : ${dto.nombreJours ?? "non précisé"}`, `Format global : ${dto.formatGlobal ?? "non précisé"}`);
    }

    return lignes.join("\n");
  }
}
