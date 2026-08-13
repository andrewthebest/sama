/**
 * DTO de requête/réponse du module `resources`.
 */

import type { ResourceDecision, ResourceType } from "./enums";
import type { ReferentielRefemi, ResourceEntity } from "./entities";

/** Corps de requête de soumission d'une ressource à la banque communautaire. */
export interface CreateResourceRequestDto {
  titre: string;
  description: string;
  type: ResourceType;
  format?: string;
  /** Texte libre ou URL selon `type`. */
  contenu?: string;
  configJson?: Record<string, unknown>;
  competenceRefemi?: ReferentielRefemi;
  thematiqueLibre?: string;
  pays: string;
}

/** Corps de requête d'un vote de modération. */
export interface VoteResourceRequestDto {
  decision: ResourceDecision;
  commentaire?: string;
}

/** Corps de requête d'un signalement (motif facultatif, texte libre). */
export interface ReportResourceRequestDto {
  motif?: string;
}

/** Corps de requête de bascule de disponibilité pour la modération (comptes MODERATEUR). */
export interface SetModerationAvailabilityRequestDto {
  disponible: boolean;
}

/** Filtres optionnels de `GET /resources`. */
export interface ListResourcesQueryDto {
  pays?: string;
  type?: ResourceType;
}

/** Élément de la file de modération : la ressource, sans exposer les votes des pairs (vote en aveugle). */
export type ModerationQueueItemDto = ResourceEntity;
