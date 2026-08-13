/**
 * Formes des entités telles qu'exposées par l'API REST (JSON).
 *
 * Ces interfaces reflètent le schéma Prisma (`apps/backend/prisma/schema.prisma`)
 * mais avec les dates sérialisées en chaînes ISO 8601, comme elles
 * transitent réellement sur le réseau. Le backend, le frontend et les
 * fixtures MSW importent ces mêmes types : c'est ce qui garantit que le
 * mode démonstration et le mode connecté partagent un contrat identique.
 */

import type {
  DocumentType,
  GenerationEtape,
  GenerationJobStatut,
  ModeApprentissage,
  NiveauRefemi,
  Modalite,
  Role,
  SubscriptionStatut,
  ThematiqueType,
} from "./enums";

/** Compte utilisateur. Le champ `pays` est obligatoire (code ISO-3166-1 alpha-2). */
export interface UserEntity {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  organisation: string | null;
  pays: string;
  languePreferee: string;
  roleEmi: string | null;
  emailVerifie: boolean;
  createdAt: string;
}

/**
 * Offre d'abonnement. Les quotas sont éditables depuis l'administration
 * (module `admin`, Lot 8) — jamais codés en dur côté application.
 */
export interface PlanEntity {
  id: string;
  nom: string;
  prixCentimes: number;
  devise: string;
  periode: "MENSUEL" | "ANNUEL";
  quotaScenarios: number;
  quotaParcours: number;
  quotaRessources: number;
  essaiInclus: boolean;
  actif: boolean;
}

/** Abonnement actif (ou en essai) d'un utilisateur, avec suivi de consommation. */
export interface UserSubscriptionEntity {
  id: string;
  userId: string;
  planId: string | null;
  statut: SubscriptionStatut;
  dateDebut: string;
  dateFin: string | null;
  generationsUtilisees: number;
  essaisGratuitsRestants: number;
}

/** Paramètres de cadrage saisis dans le formulaire de génération (JSON). */
export interface ParametresGeneration {
  public: string;
  duree: string;
  modalite: Modalite;
  profilFormateur: string;
  niveau: NiveauRefemi | null;
  langue: string;
  nombreJours: number | null;
  formatGlobal: string | null;
}

/** Sélection issue du sélecteur en cascade REFEMI, si applicable. */
export interface ReferentielRefemi {
  culture: string;
  competence: string;
  niveau: NiveauRefemi;
  thematique: string;
}

/** Un scénario pédagogique ou un parcours de formation généré. */
export interface DocumentEntity {
  id: string;
  type: DocumentType;
  userId: string;
  titre: string;
  pays: string;
  thematiqueType: ThematiqueType;
  referentielRefemi: ReferentielRefemi | null;
  thematiqueLibre: string | null;
  objectifsLibres: string | null;
  parametresGeneration: ParametresGeneration;
  versionCourante: number;
  createdAt: string;
  updatedAt: string;
}

/** Une version d'un document (historique des régénérations/ajustements). */
export interface DocumentVersionEntity {
  id: string;
  documentId: string;
  numeroVersion: number;
  contenu: unknown;
  noteDeVersion: string | null;
  createdAt: string;
}

/** Suivi temps réel d'une génération en cours. */
export interface GenerationJobEntity {
  id: string;
  documentId: string;
  statut: GenerationJobStatut;
  etape: GenerationEtape | null;
  progression: number;
  demarreLe: string | null;
  termineLe: string | null;
  erreur: string | null;
}

/** Retour de session lié à un document généré. */
export interface FeedbackEntity {
  id: string;
  documentId: string;
  userId: string;
  note: number;
  commentaire: string | null;
  dureeReellePrevue: string | null;
  champsStructures: Record<string, unknown> | null;
  createdAt: string;
}
