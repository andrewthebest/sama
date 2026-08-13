import type { GenerationProgressEvent } from "@sama-emi/contracts";
import { GenerationEtape, GenerationJobStatut } from "@sama-emi/contracts";
import { suivreProgression } from "@/api/websocket";

/** Calendrier simulé, miroir de `ETAPES_SIMULEES` côté backend (voir apps/backend/src/modules/generation/generation.types.ts). */
const ETAPES_SIMULEES: Array<{ etape: GenerationEtape; progression: number; delaiMs: number }> = [
  { etape: GenerationEtape.CADRAGE_RECU, progression: 10, delaiMs: 500 },
  { etape: GenerationEtape.GENERATION_CONTENU, progression: 55, delaiMs: 1000 },
  { etape: GenerationEtape.MISE_EN_FORME, progression: 85, delaiMs: 500 },
  { etape: GenerationEtape.FINALISATION, progression: 100, delaiMs: 300 },
];

/**
 * Abonnement à la progression d'une génération — point d'entrée unique
 * utilisé par le store `generation`, quel que soit le mode.
 *
 * **Exception documentée au principe « code identique entre mode
 * démonstration et mode connecté »** : MSW intercepte les requêtes
 * HTTP mais pas les WebSocket. En mode démonstration
 * (`VITE_USE_MOCKS=true`), cette fonction simule donc localement les
 * mêmes 4 étapes que le backend réel émettrait, plutôt que d'ouvrir une
 * connexion Socket.IO vers un serveur qui n'existe pas. Le store
 * appelant, lui, ne connaît pas cette distinction : il reçoit des
 * `GenerationProgressEvent` identiques dans les deux cas.
 */
export function suivreProgressionGeneration(
  jobId: string,
  documentId: string,
  onProgress: (event: GenerationProgressEvent) => void,
): () => void {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    let annule = false;
    void (async () => {
      for (const { etape, progression, delaiMs } of ETAPES_SIMULEES) {
        await new Promise((resolve) => setTimeout(resolve, delaiMs));
        if (annule) return;
        onProgress({ jobId, documentId, statut: GenerationJobStatut.EN_COURS, etape, progression });
      }
      if (!annule) {
        onProgress({ jobId, documentId, statut: GenerationJobStatut.TERMINE, etape: null, progression: 100 });
      }
    })();
    return () => {
      annule = true;
    };
  }

  return suivreProgression(jobId, onProgress);
}
