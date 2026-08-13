import { io, type Socket } from "socket.io-client";
import type { GenerationProgressEvent } from "@sama-emi/contracts";

let socket: Socket | null = null;

function obtenirSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_WS_URL ?? "http://localhost:3000/generation", {
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socket;
}

/**
 * S'abonne à la progression d'un job de génération.
 *
 * En mode connecté, rejoint la room `job:{jobId}` du `GenerationGateway`
 * NestJS réel. En mode démonstration, MSW n'interceptant pas les
 * WebSocket, `useGenerationProgress` (composable) prend le relais avec
 * une simulation locale équivalente plutôt que d'appeler cette fonction
 * — voir `src/composables/useGenerationProgress.ts` pour le détail de
 * cette exception documentée au principe « code identique entre modes ».
 */
export function suivreProgression(jobId: string, onProgress: (event: GenerationProgressEvent) => void): () => void {
  const s = obtenirSocket();
  s.emit("join", jobId);

  const handler = (event: GenerationProgressEvent) => {
    if (event.jobId === jobId) {
      onProgress(event);
    }
  };
  s.on("progress", handler);

  return () => {
    s.off("progress", handler);
  };
}
