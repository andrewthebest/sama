/** Formes TypeScript des fichiers de configuration JSON de ce paquet. */

export interface GabaritSectionTableau {
  colonnes: string[];
  colonneModeApprentissageObligatoire?: boolean;
  sourceValeursModeApprentissage?: string;
}

export interface GabaritSection {
  numero: number | string;
  id: string;
  titre: string;
  contenuGenereParIA: boolean;
  regle?: string;
  blocFixeApres?: string;
  mentionFixeApres?: string;
  repeteParJour?: boolean;
  tableau?: GabaritSectionTableau;
  sousSections?: string[];
}

export interface GabaritDocument {
  id: "scenario" | "parcours";
  version: number;
  libelle: string;
  description: string;
  couverture: {
    champs: string[];
    regle: string;
  };
  sections: GabaritSection[];
}

export interface BlocGestesProfessionnels {
  titre: string;
  regle: string;
  items: Array<{ cle: string; libelle: string; texte: string }>;
}

export interface BlocsFixes {
  version: number;
  gestesProfessionnelsFormateur: BlocGestesProfessionnels;
  mentionRessourcesIndicatives: string;
  mentionMaterielFlexible: string;
  mentionIaARelire: string;
  mentionThematiquePersonnalisee: string;
}

export interface ModeApprentissageConfig {
  version: number;
  description: string;
  valeurs: Array<{ valeur: string; libelleFr: string; libelleEn: string }>;
}
