/**
 * DTO de requête/réponse du module `subscriptions`.
 */

import type { PlanEntity, UserSubscriptionEntity } from "./entities";

/** Réponse de `GET /subscriptions/me` : l'abonnement courant avec son plan résolu. */
export interface SubscriptionMeResponseDto extends UserSubscriptionEntity {
  plan: PlanEntity | null;
}

/** Corps de requête de création d'un plan (administration des quotas). */
export interface CreatePlanRequestDto {
  nom: string;
  prixCentimes: number;
  devise?: string;
  periode: "MENSUEL" | "ANNUEL";
  quotaScenarios: number;
  quotaParcours: number;
  quotaRessources: number;
  essaiInclus?: boolean;
}

/** Corps de requête de modification d'un plan existant. Tous les champs sont optionnels. */
export interface UpdatePlanRequestDto extends Partial<CreatePlanRequestDto> {
  actif?: boolean;
}
