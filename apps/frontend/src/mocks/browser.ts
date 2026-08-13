import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * Démarre le service worker MSW qui intercepte tous les appels réseau
 * de l'application (`apiClient`) sans qu'aucun code des stores ou des
 * composants n'ait besoin de le savoir. C'est ce mécanisme qui permet
 * au frontend de fonctionner sans base de données ni backend actif —
 * voir README racine, section « Mode démonstration ».
 */
export async function demarrerMocks(): Promise<void> {
  const worker = setupWorker(...handlers);
  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: false,
  });
}
