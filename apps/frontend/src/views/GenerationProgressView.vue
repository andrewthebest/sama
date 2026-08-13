<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { GenerationJobStatut } from "@sama-emi/contracts";
import { useGenerationStore } from "@/stores/generation.store";

const props = defineProps<{ jobId: string }>();

const router = useRouter();
const generationStore = useGenerationStore();

const jobValide = computed(() => generationStore.jobCourant.jobId === props.jobId);
const termine = computed(() => generationStore.jobCourant.statut === GenerationJobStatut.TERMINE);
const echoue = computed(() => generationStore.jobCourant.statut === GenerationJobStatut.ECHOUE || Boolean(generationStore.jobCourant.erreur));

const etapes = ["CADRAGE_RECU", "GENERATION_CONTENU", "MISE_EN_FORME", "FINALISATION"] as const;

function ouvrirApercu(): void {
  if (generationStore.jobCourant.documentId) {
    void router.push({ name: "document-apercu", params: { id: generationStore.jobCourant.documentId } });
  }
}
</script>

<template>
  <div class="conteneur">
    <template v-if="!jobValide">
      <p>Cette génération n'est plus suivie dans cette session. <RouterLink to="/">Retour à l'accueil</RouterLink>.</p>
    </template>

    <template v-else>
      <h1>{{ $t("progression.titre") }}</h1>

      <div class="carte">
        <div class="barre-fond">
          <div class="barre-remplissage" :style="{ width: generationStore.jobCourant.progression + '%' }"></div>
        </div>
        <p class="pourcentage">{{ generationStore.jobCourant.progression }} %</p>

        <ul class="liste-etapes">
          <li
            v-for="etape in etapes"
            :key="etape"
            :class="{
              active: generationStore.jobCourant.etape === etape,
              faite: generationStore.jobCourant.progression >= 100 || (etapes.indexOf(etape) < etapes.indexOf(generationStore.jobCourant.etape as typeof etapes[number])),
            }"
          >
            {{ $t(`progression.${etape}`) }}
          </li>
        </ul>

        <p v-if="echoue" class="message-erreur">{{ $t("progression.erreur") }}</p>

        <div v-if="termine" class="bloc-termine">
          <p>✅ {{ $t("progression.termine") }}</p>
          <button type="button" class="bouton-primaire" @click="ouvrirApercu">{{ $t("progression.voirDocument") }}</button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.barre-fond {
  height: 10px;
  border-radius: 999px;
  background: var(--couleur-marque-claire);
  overflow: hidden;
}
.barre-remplissage {
  height: 100%;
  background: var(--couleur-marque);
  transition: width 0.4s ease;
}
.pourcentage {
  font-variant-numeric: tabular-nums;
  color: var(--couleur-texte-att);
  font-size: 13px;
  margin: 6px 0 20px;
}
.liste-etapes {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.liste-etapes li {
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--couleur-texte-att);
  font-size: 14px;
  background: var(--couleur-fond);
}
.liste-etapes li.faite {
  color: var(--couleur-marque-fonce);
}
.liste-etapes li.active {
  background: var(--couleur-marque-claire);
  color: var(--couleur-marque-fonce);
  font-weight: 600;
}
.bloc-termine {
  margin-top: 24px;
  text-align: center;
}
</style>
