<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ResourceDecision } from "@sama-emi/contracts";
import { useAuthStore } from "@/stores/auth.store";
import { useResourcesStore } from "@/stores/resources.store";

const authStore = useAuthStore();
const resourcesStore = useResourcesStore();
const enCoursVote = ref<string | null>(null);
const enBascule = ref(false);
const commentaires = reactive<Record<string, string>>({});

onMounted(async () => {
  await resourcesStore.chargerFileModeration();
});

async function basculerDisponibilite(): Promise<void> {
  enBascule.value = true;
  try {
    await authStore.definirDisponibiliteModeration(!authStore.user?.disponiblePourModeration);
  } finally {
    enBascule.value = false;
  }
}

async function voter(id: string, decision: ResourceDecision): Promise<void> {
  enCoursVote.value = id;
  try {
    await resourcesStore.voter(id, { decision, commentaire: commentaires[id] || undefined });
    delete commentaires[id];
  } finally {
    enCoursVote.value = null;
  }
}
</script>

<template>
  <div class="conteneur">
    <div class="entete-ecran">
      <h1>{{ $t("resources.moderation") }}</h1>
      <button type="button" class="bouton-secondaire" :disabled="enBascule" @click="basculerDisponibilite">
        {{ authStore.user?.disponiblePourModeration ? $t("resources.disponible") : $t("resources.indisponible") }}
      </button>
    </div>

    <p v-if="resourcesStore.fileModeration.length === 0" class="vide">{{ $t("resources.fileVide") }}</p>

    <div v-for="ressource in resourcesStore.fileModeration" :key="ressource.id" class="carte carte-moderation">
      <span class="badge-type">{{ ressource.type }}</span>
      <h2>{{ ressource.titre }}</h2>
      <p class="description">{{ ressource.description }}</p>
      <p v-if="ressource.contenu" class="contenu">{{ ressource.contenu }}</p>
      <p class="meta">{{ $t("commun.pays") }} : {{ ressource.pays }}</p>

      <textarea
        v-model="commentaires[ressource.id]"
        class="commentaire-vote"
        rows="2"
        :placeholder="$t('resources.commentaireVote')"
      ></textarea>

      <div class="actions-vote">
        <button
          type="button"
          class="bouton-primaire"
          :disabled="enCoursVote === ressource.id"
          @click="voter(ressource.id, ResourceDecision.VALIDER)"
        >
          {{ $t("resources.valider") }}
        </button>
        <button
          type="button"
          class="bouton-secondaire"
          :disabled="enCoursVote === ressource.id"
          @click="voter(ressource.id, ResourceDecision.REJETER)"
        >
          {{ $t("resources.rejeter") }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.entete-ecran {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.vide {
  color: var(--couleur-texte-att);
}
.carte-moderation {
  margin-bottom: 16px;
}
.badge-type {
  font-size: 11.5px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--couleur-marque-claire);
  color: var(--couleur-marque-fonce);
}
.carte-moderation h2 {
  margin: 8px 0 4px;
  font-size: 16px;
  color: var(--couleur-marque-fonce);
}
.description {
  font-size: 14px;
  margin: 0 0 6px;
}
.contenu {
  font-size: 13px;
  color: var(--couleur-texte-att);
  white-space: pre-wrap;
  background: var(--couleur-fond);
  border-radius: 8px;
  padding: 8px 10px;
}
.meta {
  font-size: 12.5px;
  color: var(--couleur-texte-att);
}
.commentaire-vote {
  width: 100%;
  margin: 10px 0;
  font-family: inherit;
  font-size: 13.5px;
  padding: 8px 10px;
  border: 1px solid var(--couleur-bordure);
  border-radius: 8px;
  resize: vertical;
}
.actions-vote {
  display: flex;
  gap: 10px;
}
</style>
