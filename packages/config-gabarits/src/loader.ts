/**
 * Chargeur des fichiers de configuration JSON de ce paquet.
 *
 * Pourquoi une lecture disque plutôt qu'un `import ... from "./x.json"` :
 * un import statique serait inliné par le compilateur TypeScript dans le
 * bundle du backend, ce qui obligerait à recompiler/redéployer pour tout
 * ajustement d'un gabarit — exactement ce que le cahier des charges
 * interdit (« pouvoir les ajuster sans redéploiement »). En lisant le
 * fichier depuis le disque à l'exécution, éditer un gabarit ne demande
 * qu'un redémarrage du processus backend, jamais une recompilation.
 *
 * Ce module est consommé uniquement côté backend (Node.js, CommonJS) —
 * il s'appuie sur `__dirname`, indisponible dans un bundle navigateur.
 * Le frontend ne doit importer que `./types` depuis ce paquet.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { BlocsFixes, GabaritDocument, ModeApprentissageConfig } from "./types";

const GABARITS_DIR = join(__dirname, "gabarits");

function lireJson<T>(nomFichier: string): T {
  const contenu = readFileSync(join(GABARITS_DIR, nomFichier), "utf-8");
  return JSON.parse(contenu) as T;
}

/** Charge le gabarit du scénario pédagogique (9 sections). */
export function chargerGabaritScenario(): GabaritDocument {
  return lireJson<GabaritDocument>("scenario.json");
}

/** Charge le gabarit du parcours de formation (architecture multi-modules). */
export function chargerGabaritParcours(): GabaritDocument {
  return lireJson<GabaritDocument>("parcours.json");
}

/** Charge les blocs de texte fixes (Gestes professionnels, mentions obligatoires). */
export function chargerBlocsFixes(): BlocsFixes {
  return lireJson<BlocsFixes>("blocs-fixes.json");
}

/** Charge la liste fermée des modes d'apprentissage autorisés. */
export function chargerModesApprentissage(): ModeApprentissageConfig {
  return lireJson<ModeApprentissageConfig>("modes-apprentissage.json");
}
