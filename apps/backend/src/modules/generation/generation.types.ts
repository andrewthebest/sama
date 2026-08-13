import { TypeConsommationQuota } from "../subscriptions/subscriptions.types";
import { CreateGenerationDto } from "./dto/create-generation.dto";

/** Nom de la file BullMQ du moteur de génération. */
export const FILE_GENERATION = "generation";

/** Nom du job BullMQ traité par `GenerationProcessor`. */
export const JOB_GENERER_DOCUMENT = "generer-document";

/**
 * Politique de nouvelle tentative sur erreur transitoire de l'API
 * Anthropic (rate limit, 5xx, coupure réseau) — cahier des charges,
 * section 4.2 : « nouvelle tentative automatique en cas d'erreur
 * transitoire ». Backoff exponentiel : 5s, 20s, 80s.
 */
export const OPTIONS_JOB_GENERATION = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 86400 },
};

/**
 * Données transportées par un job BullMQ de génération.
 *
 * `subscriptionId`/`typeConsommationQuota` reflètent la quota déjà
 * débitée par `SubscriptionsService.consommerQuota` avant la mise en
 * file — ils permettent à `GenerationProcessor` de la rembourser
 * exactement (même abonnement, même origine) en cas d'échec définitif.
 */
export interface DonneesJobGeneration {
  jobId: string;
  documentId: string;
  titre: string;
  dto: CreateGenerationDto;
  userId: string;
  subscriptionId: string;
  typeConsommationQuota: TypeConsommationQuota;
}
