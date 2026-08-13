import { defineStore } from "pinia";
import { ref } from "vue";
import type { SubscriptionMeResponseDto } from "@sama-emi/contracts";
import { apiClient } from "@/api/client";

/**
 * Store de l'abonnement courant (essai gratuit ou souscription), avec
 * son plan résolu. Alimente l'écran « Mon abonnement ».
 */
export const useSubscriptionsStore = defineStore("subscriptions", () => {
  const abonnement = ref<SubscriptionMeResponseDto | null>(null);

  async function chargerAbonnementCourant(): Promise<void> {
    const { data } = await apiClient.get<SubscriptionMeResponseDto>("/subscriptions/me");
    abonnement.value = data;
  }

  return { abonnement, chargerAbonnementCourant };
});
