/**
 * DTO de requête/réponse du module `feedback`.
 */

import type { FeedbackEntity } from "./entities";

/**
 * Corps de requête de création d'un retour de session, rattaché à un
 * document généré (cahier des charges, section 3.5 : « retour de
 * session lié au document »).
 */
export interface CreateFeedbackRequestDto {
  /** Note sur 5, entière. */
  note: number;
  commentaire?: string;
  /** Durée réellement observée face à la durée prévue, en texte libre (ex. "2h30 au lieu de 2h"). */
  dureeReellePrevue?: string;
  /** Champs additionnels structurés (ce qui a bien fonctionné, ajustements...), libres au frontend. */
  champsStructures?: Record<string, unknown>;
}

/** Réponse de `GET /feedback/me` : vue agrégée des retours donnés par l'utilisateur. */
export interface FeedbackSummaryResponseDto {
  nombreFeedbacks: number;
  noteMoyenne: number | null;
  feedbacks: FeedbackEntity[];
}
