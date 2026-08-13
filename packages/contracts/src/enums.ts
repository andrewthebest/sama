/**
 * Enums partagés entre le backend, le frontend et les mocks MSW.
 *
 * Ce fichier est la source unique de vérité pour les valeurs énumérées du
 * domaine SAMA EMI. Le schéma Prisma (`apps/backend/prisma/schema.prisma`)
 * définit ses propres enums avec les mêmes valeurs — Prisma ne permet pas
 * d'importer un enum TypeScript externe dans son schéma — mais toute
 * modification doit être répercutée aux deux endroits.
 */

/** Rôle applicatif d'un compte utilisateur. */
export enum Role {
  UTILISATEUR = "UTILISATEUR",
  MODERATEUR = "MODERATEUR",
  ADMINISTRATEUR = "ADMINISTRATEUR",
}

/** Type de document généré par le moteur de génération. */
export enum DocumentType {
  SCENARIO = "SCENARIO",
  PARCOURS = "PARCOURS",
}

/**
 * Origine de la thématique d'un document généré.
 *
 * `REFEMI` : la thématique provient du sélecteur en cascade
 * (culture → compétence → niveau → thématique) et le document référence
 * le référentiel dans sa page de couverture.
 *
 * `PERSONNALISEE` : l'utilisateur a saisi une thématique et des objectifs
 * en texte libre. La page de couverture affiche alors « Thématique
 * personnalisée » à la place de la citation REFEMI (règle non négociable
 * du cahier des charges, section 6).
 */
export enum ThematiqueType {
  REFEMI = "REFEMI",
  PERSONNALISEE = "PERSONNALISEE",
}

/** Niveau souhaité pour un scénario rattaché au référentiel REFEMI. */
export enum NiveauRefemi {
  ELEMENTAIRE = "ELEMENTAIRE",
  INTERMEDIAIRE = "INTERMEDIAIRE",
  EXPERIMENTE = "EXPERIMENTE",
  PARCOURS_COMBINE = "PARCOURS_COMBINE",
}

/** Modalité d'animation d'un scénario ou d'un parcours. */
export enum Modalite {
  PRESENTIEL = "PRESENTIEL",
  DISTANCIEL = "DISTANCIEL",
  HYBRIDE = "HYBRIDE",
}

/**
 * Mode d'apprentissage d'une étape du déroulé.
 *
 * Liste fermée imposée par le gabarit validé (cahier des charges,
 * exigence transversale) : la colonne « Mode d'apprentissage » de tout
 * tableau de déroulé doit utiliser exclusivement ces valeurs.
 */
export enum ModeApprentissage {
  ACQUISITION = "ACQUISITION",
  ENQUETE = "ENQUETE",
  DISCUSSION = "DISCUSSION",
  COLLABORATION = "COLLABORATION",
  APPLICATION = "APPLICATION",
  REFLEXION_INDIVIDUELLE = "REFLEXION_INDIVIDUELLE",
  CREATION = "CREATION",
}

/** Statut d'avancement d'une génération de document. */
export enum GenerationJobStatut {
  EN_FILE = "EN_FILE",
  EN_COURS = "EN_COURS",
  TERMINE = "TERMINE",
  ECHOUE = "ECHOUE",
}

/**
 * Étape de progression affichée en temps réel côté utilisateur.
 *
 * Les quatre étapes sont imposées par le cahier des charges (section 3.2,
 * étape 2) et diffusées via le WebSocket de progression.
 */
export enum GenerationEtape {
  CADRAGE_RECU = "CADRAGE_RECU",
  GENERATION_CONTENU = "GENERATION_CONTENU",
  MISE_EN_FORME = "MISE_EN_FORME",
  FINALISATION = "FINALISATION",
}

/** Statut d'un abonnement utilisateur. */
export enum SubscriptionStatut {
  ESSAI = "ESSAI",
  ACTIF = "ACTIF",
  EXPIRE = "EXPIRE",
  ANNULE = "ANNULE",
}

/**
 * Type extensible de ressource communautaire (cahier des charges,
 * section 10). De nouveaux formats pourront s'ajouter au fil des
 * sessions sans remettre en cause le modèle `Resource`.
 */
export enum ResourceType {
  FICHE_PEDAGOGIQUE = "FICHE_PEDAGOGIQUE",
  ETUDE_DE_CAS = "ETUDE_DE_CAS",
  SCRIPT_VIDEO = "SCRIPT_VIDEO",
  LIEN_EXTERNE = "LIEN_EXTERNE",
  AUTRE = "AUTRE",
}

/**
 * Cycle de vie d'une ressource soumise à la banque communautaire.
 *
 * `EN_ATTENTE` : soumise, en attente qu'au moins 3 modérateurs
 * disponibles lui soient désignés. `EN_EXAMEN` : 3 modérateurs
 * désignés, vote en aveugle en cours. `PUBLIEE`/`REJETEE` : quorum de
 * 2 votes concordants atteint. `SIGNALEE` : une ressource publiée
 * ayant reçu au moins un signalement.
 */
export enum ResourceStatut {
  EN_ATTENTE = "EN_ATTENTE",
  EN_EXAMEN = "EN_EXAMEN",
  PUBLIEE = "PUBLIEE",
  REJETEE = "REJETEE",
  SIGNALEE = "SIGNALEE",
}

/** Décision d'un modérateur sur une ressource en examen. */
export enum ResourceDecision {
  VALIDER = "VALIDER",
  REJETER = "REJETER",
}
