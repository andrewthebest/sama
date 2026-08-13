import axios from "axios";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Instance HTTP unique de l'application.
 *
 * Ce client est utilisé à l'identique en mode démonstration et en mode
 * connecté : c'est `main.ts` qui décide, selon `VITE_USE_MOCKS`, de
 * démarrer ou non le service worker MSW qui interceptera ces mêmes
 * requêtes. Aucune branche conditionnelle ne doit être ajoutée ici pour
 * distinguer les deux modes.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
});

apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`;
  }
  return config;
});

/**
 * Rafraîchissement automatique du token d'accès sur une réponse 401.
 * Une seule tentative de rejeu par requête (`_retry`) pour éviter toute
 * boucle infinie si le refresh token est lui-même invalide.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore();
    const originalRequest = error.config;

    if (error.response?.status === 401 && authStore.refreshToken && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await authStore.rafraichirSession();
        originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        authStore.deconnecter();
      }
    }

    return Promise.reject(error);
  },
);
