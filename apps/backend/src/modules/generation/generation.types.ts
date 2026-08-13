import { GenerationEtape } from "@sama-emi/contracts";

/**
 * Calendrier simulé des 4 étapes de génération (cahier des charges,
 * section 3.2, étape 2). `delaiMs` est le délai *après* le passage à
 * cette étape avant de passer à la suivante — permet à l'interface de
 * montrer une progression réaliste plutôt qu'un saut instantané à 100 %.
 */
export const ETAPES_SIMULEES: Array<{ etape: GenerationEtape; progression: number; delaiMs: number }> = [
  { etape: GenerationEtape.CADRAGE_RECU, progression: 10, delaiMs: 600 },
  { etape: GenerationEtape.GENERATION_CONTENU, progression: 55, delaiMs: 1400 },
  { etape: GenerationEtape.MISE_EN_FORME, progression: 85, delaiMs: 700 },
  { etape: GenerationEtape.FINALISATION, progression: 100, delaiMs: 400 },
];
