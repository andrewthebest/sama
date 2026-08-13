import type Anthropic from "@anthropic-ai/sdk";
import { ModeApprentissage } from "@sama-emi/contracts";

/**
 * Schémas d'outil Anthropic (tool use) dérivés des gabarits validés.
 *
 * Principe central de l'architecture : Claude ne rédige jamais un
 * document libre, il remplit ce schéma via un appel d'outil forcé
 * (`tool_choice`). C'est ce schéma — pas un prompt — qui garantit que
 * la structure du document produit respecte le gabarit (cahier des
 * charges, section 6) : objectifs SMART sans étiquette Bloom, colonne
 * « Mode d'apprentissage » à valeurs fermées, etc. Les blocs fixes
 * (Gestes professionnels, mentions obligatoires) ne figurent
 * délibérément PAS dans ce schéma : ils sont injectés par
 * `DocxAssembler` depuis `@sama-emi/config-gabarits`, jamais générés.
 */

const MODES_APPRENTISSAGE = Object.values(ModeApprentissage);

const LIGNE_DEROULE_SCHEMA = {
  type: "object" as const,
  properties: {
    horaire: { type: "string", description: "Ex. « 0h00 – 0h05 (5 min) »." },
    etape: { type: "string", description: "Nom de l'étape (ex. Accueil, Activité 2)." },
    contenuEtObjectif: { type: "string", description: "Description du contenu et, si pertinent, référence à un objectif spécifique." },
    modeApprentissage: { type: "string", enum: MODES_APPRENTISSAGE },
    modalite: { type: "string", description: "Ex. Collectif, Groupes de 4-5, Individuel." },
    materiel: { type: "string" },
  },
  required: ["horaire", "etape", "contenuEtObjectif", "modeApprentissage", "modalite", "materiel"],
  additionalProperties: false,
};

/** Outil de rédaction d'un scénario pédagogique (gabarit 9 sections). */
export const OUTIL_REDIGER_SCENARIO: Anthropic.Tool = {
  name: "rediger_scenario",
  description:
    "Rédige le contenu structuré d'un scénario pédagogique EMI conforme au gabarit validé. " +
    "N'inclut jamais l'encadré « Gestes professionnels du formateur » ni les mentions de ressources indicatives : elles sont ajoutées séparément.",
  input_schema: {
    type: "object",
    properties: {
      objectifGeneral: { type: "string", description: "Objectif général de la séance." },
      objectifsSpecifiques: {
        type: "array",
        description:
          "2 à 5 objectifs spécifiques rédigés selon la méthode SMART. Ne jamais inclure d'étiquette de taxonomie de Bloom entre parenthèses.",
        items: { type: "string" },
      },
      publicEtContexte: { type: "string", description: "Contextualisation du public et du contexte local (pays, connectivité, réalités socioculturelles)." },
      profilFormateurTransferabilite: {
        type: "string",
        description: "Compétences de transférabilité du formateur mappées sur la Cible REFEMI correspondant au profil choisi (sans l'encadré Gestes professionnels).",
      },
      deroule: { type: "array", description: "Déroulé chronologique complet de la séance.", items: LIGNE_DEROULE_SCHEMA },
      fichesActivites: { type: "string", description: "Fiches détaillées des activités mentionnées dans le déroulé." },
      evaluation: {
        type: "object",
        properties: {
          diagnostique: { type: "string" },
          formative: { type: "string", description: "Grille d'observation." },
          sommative: { type: "string", description: "Quiz ou évaluation notée." },
          aChaud: { type: "string" },
        },
        required: ["diagnostique", "formative", "sommative", "aChaud"],
        additionalProperties: false,
      },
      arbitragesPedagogiques: { type: "string", description: "Justification des choix de conception." },
      materielNecessaire: { type: "string" },
      variantesEtAdaptations: { type: "string", description: "Adaptations pour d'autres durées, publics ou profils." },
    },
    required: [
      "objectifGeneral",
      "objectifsSpecifiques",
      "publicEtContexte",
      "profilFormateurTransferabilite",
      "deroule",
      "fichesActivites",
      "evaluation",
      "arbitragesPedagogiques",
      "materielNecessaire",
      "variantesEtAdaptations",
    ],
    additionalProperties: false,
  },
  strict: true,
};

/** Outil de rédaction d'un parcours de formation (architecture multi-modules). */
export const OUTIL_REDIGER_PARCOURS: Anthropic.Tool = {
  name: "rediger_parcours",
  description:
    "Rédige le contenu structuré d'un parcours de formation EMI multi-modules, conforme au gabarit validé. " +
    "N'inclut jamais l'encadré « Gestes professionnels du formateur » ni les mentions de ressources indicatives.",
  input_schema: {
    type: "object",
    properties: {
      objectifsParModule: { type: "string", description: "Objectifs SMART du parcours, regroupés par module." },
      publicEtContexte: { type: "string" },
      profilFormateurTransferabilite: { type: "string" },
      architectureParcours: {
        type: "array",
        description: "Vue d'ensemble des modules du parcours.",
        items: {
          type: "object",
          properties: {
            module: { type: "string" },
            domaineCompetenceRefemi: { type: "string" },
            niveau: { type: "string" },
            duree: { type: "string" },
            jour: { type: "string" },
          },
          required: ["module", "domaineCompetenceRefemi", "niveau", "duree", "jour"],
          additionalProperties: false,
        },
      },
      derouleParJour: {
        type: "array",
        description: "Un déroulé détaillé par journée du parcours.",
        items: {
          type: "object",
          properties: {
            jour: { type: "integer", description: "Numéro du jour (1, 2, 3...)." },
            tableau: { type: "array", items: LIGNE_DEROULE_SCHEMA },
          },
          required: ["jour", "tableau"],
          additionalProperties: false,
        },
      },
      fichesActivitesParModule: {
        type: "string",
        description: "Fiches détaillées des activités par module — même niveau de détail qu'un scénario simple, pas un résumé.",
      },
      evaluationParcours: {
        type: "object",
        properties: {
          diagnostiqueJ1: { type: "string" },
          formativeContinue: { type: "string" },
          sommativeFinDeParcours: { type: "string" },
          aChaud: { type: "string" },
          recommandationEvaluationAFroid: { type: "string" },
        },
        required: ["diagnostiqueJ1", "formativeContinue", "sommativeFinDeParcours", "aChaud", "recommandationEvaluationAFroid"],
        additionalProperties: false,
      },
      arbitragesPedagogiques: { type: "string" },
      materielNecessaire: { type: "string" },
      variantesEtAdaptations: { type: "string" },
    },
    required: [
      "objectifsParModule",
      "publicEtContexte",
      "profilFormateurTransferabilite",
      "architectureParcours",
      "derouleParJour",
      "fichesActivitesParModule",
      "evaluationParcours",
      "arbitragesPedagogiques",
      "materielNecessaire",
      "variantesEtAdaptations",
    ],
    additionalProperties: false,
  },
  strict: true,
};
