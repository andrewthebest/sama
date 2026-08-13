/**
 * DTO de requête/réponse du module `generation`.
 */

import type { DocumentType, GenerationEtape, GenerationJobStatut, Modalite, NiveauRefemi, ThematiqueType } from "./enums";
import type { DocumentEntity, GenerationJobEntity, ReferentielRefemi } from "./entities";

/**
 * Corps de la requête de lancement d'une génération.
 *
 * Reflète le formulaire de cadrage à cascade (section 3.2 du cahier des
 * charges) : soit `thematiqueType = REFEMI` avec `referentielRefemi`
 * renseigné, soit `thematiqueType = PERSONNALISEE` avec `thematiqueLibre`
 * et `objectifsLibres` renseignés. Ces deux sous-ensembles de champs sont
 * mutuellement exclusifs et validés comme tels côté backend.
 */
export interface CreateGenerationRequestDto {
  type: DocumentType;
  pays: string;
  thematiqueType: ThematiqueType;
  referentielRefemi?: ReferentielRefemi;
  thematiqueLibre?: string;
  objectifsLibres?: string;
  public: string;
  duree: string;
  modalite: Modalite;
  profilFormateur: string;
  niveau?: NiveauRefemi;
  langue: string;
  /** Uniquement pour un parcours de formation (plusieurs jours). */
  nombreJours?: number;
  formatGlobal?: string;
}

export interface CreateGenerationResponseDto {
  jobId: string;
  documentId: string;
  statut: GenerationJobStatut;
}

export interface GenerationJobDetailDto extends GenerationJobEntity {
  document: DocumentEntity;
}

/**
 * Payload diffusé par le `GenerationGateway` (WebSocket) à chaque
 * changement d'étape. Le canal est nommé `generation:{jobId}`.
 */
export interface GenerationProgressEvent {
  jobId: string;
  documentId: string;
  statut: GenerationJobStatut;
  etape: GenerationEtape | null;
  progression: number;
  erreur?: string;
}
