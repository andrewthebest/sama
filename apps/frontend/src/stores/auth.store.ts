import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { AuthResponseDto, LoginRequestDto, RegisterRequestDto, UserEntity } from "@sama-emi/contracts";
import { apiClient } from "@/api/client";

const CLE_STOCKAGE = "sama-emi-auth";

interface EtatPersiste {
  accessToken: string;
  refreshToken: string;
  user: UserEntity;
}

/**
 * Store d'authentification. Les tokens et le profil courant sont
 * persistés dans `localStorage` pour survivre à un rechargement de page
 * — comportement identique en mode démonstration et en mode connecté,
 * puisque c'est `apiClient` (intercepté ou non par MSW selon le mode)
 * qui produit les réponses consommées ici.
 */
export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const user = ref<UserEntity | null>(null);

  const estConnecte = computed(() => Boolean(accessToken.value && user.value));

  function persister(): void {
    if (accessToken.value && refreshToken.value && user.value) {
      const etat: EtatPersiste = { accessToken: accessToken.value, refreshToken: refreshToken.value, user: user.value };
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat));
    }
  }

  function chargerDepuisStockage(): void {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return;
    try {
      const etat = JSON.parse(brut) as EtatPersiste;
      accessToken.value = etat.accessToken;
      refreshToken.value = etat.refreshToken;
      user.value = etat.user;
    } catch {
      localStorage.removeItem(CLE_STOCKAGE);
    }
  }

  function appliquerReponse(reponse: AuthResponseDto): void {
    accessToken.value = reponse.accessToken;
    refreshToken.value = reponse.refreshToken;
    user.value = reponse.user;
    persister();
  }

  async function inscrire(dto: RegisterRequestDto): Promise<void> {
    const { data } = await apiClient.post<AuthResponseDto>("/auth/register", dto);
    appliquerReponse(data);
  }

  async function connecter(dto: LoginRequestDto): Promise<void> {
    const { data } = await apiClient.post<AuthResponseDto>("/auth/login", dto);
    appliquerReponse(data);
  }

  async function rafraichirSession(): Promise<void> {
    if (!refreshToken.value) throw new Error("Aucun refresh token disponible.");
    const { data } = await apiClient.post<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      refreshToken: refreshToken.value,
    });
    accessToken.value = data.accessToken;
    refreshToken.value = data.refreshToken;
    persister();
  }

  function deconnecter(): void {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    localStorage.removeItem(CLE_STOCKAGE);
  }

  /** Bascule la disponibilité du compte MODERATEUR pour être désigné sur de nouvelles ressources (module `resources`). */
  async function definirDisponibiliteModeration(disponible: boolean): Promise<void> {
    const { data } = await apiClient.patch<UserEntity>("/users/me/disponibilite-moderation", { disponible });
    user.value = data;
    persister();
  }

  return {
    accessToken,
    refreshToken,
    user,
    estConnecte,
    inscrire,
    connecter,
    rafraichirSession,
    deconnecter,
    chargerDepuisStockage,
    definirDisponibiliteModeration,
  };
});
