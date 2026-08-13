<script setup lang="ts">
import { computed, onMounted } from "vue";
import { SubscriptionStatut } from "@sama-emi/contracts";
import { useSubscriptionsStore } from "@/stores/subscriptions.store";

const subscriptionsStore = useSubscriptionsStore();

onMounted(() => {
  void subscriptionsStore.chargerAbonnementCourant();
});

const abonnement = computed(() => subscriptionsStore.abonnement);

const cleStatut = computed(() => {
  switch (abonnement.value?.statut) {
    case SubscriptionStatut.ACTIF:
      return "abonnement.statutActif";
    case SubscriptionStatut.EXPIRE:
      return "abonnement.statutExpire";
    case SubscriptionStatut.ANNULE:
      return "abonnement.statutAnnule";
    default:
      return "abonnement.statutEssai";
  }
});
</script>

<template>
  <div class="conteneur">
    <h1>{{ $t("abonnement.titre") }}</h1>

    <div v-if="abonnement" class="carte">
      <span class="badge-statut" :class="`badge-${abonnement.statut.toLowerCase()}`">{{ $t(cleStatut) }}</span>

      <template v-if="abonnement.statut === SubscriptionStatut.ESSAI || abonnement.statut === SubscriptionStatut.EXPIRE">
        <p v-if="abonnement.essaisGratuitsRestants > 0" class="mesure">
          {{ $t("abonnement.essaisRestants", { n: abonnement.essaisGratuitsRestants }) }}
        </p>
        <p v-else class="mesure avertissement">{{ $t("abonnement.essaisEpuises") }}</p>
      </template>
      <p v-else class="mesure">{{ $t("abonnement.generationsUtilisees", { n: abonnement.generationsUtilisees }) }}</p>

      <div class="plan">
        <h2>{{ $t("abonnement.planTitre") }}</h2>
        <p v-if="!abonnement.plan" class="sans-plan">{{ $t("abonnement.planAucun") }}</p>
        <template v-else>
          <p class="nom-plan">{{ abonnement.plan.nom }}</p>
          <ul class="liste-quotas">
            <li><span>{{ $t("abonnement.quotaScenarios") }}</span><strong>{{ abonnement.plan.quotaScenarios }}</strong></li>
            <li><span>{{ $t("abonnement.quotaParcours") }}</span><strong>{{ abonnement.plan.quotaParcours }}</strong></li>
            <li><span>{{ $t("abonnement.quotaRessources") }}</span><strong>{{ abonnement.plan.quotaRessources }}</strong></li>
          </ul>
        </template>
        <p class="mention-quota">{{ $t("abonnement.quotaMention") }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.badge-statut {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  background: var(--couleur-marque-claire);
  color: var(--couleur-marque-fonce);
}
.badge-expire,
.badge-annule {
  background: #fbe4e4;
  color: #9a2c2c;
}
.mesure {
  margin: 14px 0 0;
  color: var(--couleur-texte-att);
  font-size: 14.5px;
}
.avertissement {
  color: #9a2c2c;
  font-weight: 600;
}
.plan {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--couleur-bordure);
}
.plan h2 {
  margin: 0 0 8px;
  font-size: 15px;
  color: var(--couleur-marque-fonce);
}
.sans-plan {
  margin: 0;
  color: var(--couleur-texte-att);
  font-size: 14px;
}
.nom-plan {
  margin: 0 0 10px;
  font-weight: 600;
}
.liste-quotas {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.liste-quotas li {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.mention-quota {
  margin: 14px 0 0;
  color: var(--couleur-texte-att);
  font-size: 12.5px;
  font-style: italic;
}
</style>
