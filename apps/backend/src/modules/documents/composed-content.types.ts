import type { BlocGestesProfessionnels } from "@sama-emi/config-gabarits";

/** Une ligne du tableau de déroulé — partagée entre scénario et parcours. */
export interface LigneDeroule {
  horaire: string;
  etape: string;
  contenuEtObjectif: string;
  modeApprentissage: string;
  modalite: string;
  materiel: string;
}

interface Couverture {
  titre: string;
  citation: string;
  pays: string;
  public: string;
  duree: string;
  modalite: string;
  profilFormateur: string;
  langue: string;
}

interface BlocsCommuns {
  gestesProfessionnelsFormateur: BlocGestesProfessionnels;
  mentionRessourcesIndicatives: string;
  mentionMaterielFlexible: string;
  mentionIaARelire: string;
  arbitragesPedagogiques: string;
  materielNecessaire: string;
  variantesEtAdaptations: string;
}

/**
 * Contenu final composé d'un scénario pédagogique — ce que produit
 * `ContentComposer` en fusionnant la sortie structurée de Claude
 * (schéma `rediger_scenario`) avec les blocs fixes de
 * `@sama-emi/config-gabarits`. C'est cet objet, et lui seul, que
 * consomment `DocxAssembler` et l'aperçu HTML : ni l'un ni l'autre ne
 * lisent la sortie brute de l'IA directement.
 */
export interface ContenuScenario extends BlocsCommuns {
  gabaritId: "scenario";
  couverture: Couverture;
  objectifGeneral: string;
  objectifsSpecifiques: string[];
  publicEtContexte: string;
  profilFormateurTransferabilite: string;
  deroule: LigneDeroule[];
  fichesActivites: string;
  evaluation: { diagnostique: string; formative: string; sommative: string; aChaud: string };
}

/** Contenu final composé d'un parcours de formation. */
export interface ContenuParcours extends BlocsCommuns {
  gabaritId: "parcours";
  couverture: Couverture;
  objectifsParModule: string;
  publicEtContexte: string;
  profilFormateurTransferabilite: string;
  architectureParcours: Array<{ module: string; domaineCompetenceRefemi: string; niveau: string; duree: string; jour: string }>;
  derouleParJour: Array<{ jour: number; tableau: LigneDeroule[] }>;
  fichesActivitesParModule: string;
  evaluationParcours: {
    diagnostiqueJ1: string;
    formativeContinue: string;
    sommativeFinDeParcours: string;
    aChaud: string;
    recommandationEvaluationAFroid: string;
  };
}

export type ContenuDocument = ContenuScenario | ContenuParcours;
