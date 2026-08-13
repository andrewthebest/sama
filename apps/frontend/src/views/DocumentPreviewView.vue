<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useDocumentsStore } from "@/stores/documents.store";
import { useFeedbackStore } from "@/stores/feedback.store";

const props = defineProps<{ id: string }>();

const documentsStore = useDocumentsStore();
const feedbackStore = useFeedbackStore();
const enTelechargement = ref<"docx" | "pdf" | null>(null);
const modeDemonstration = import.meta.env.VITE_USE_MOCKS === "true";
const noteChoisie = ref(0);
const commentaireFeedback = ref("");
const envoiFeedbackEnCours = ref(false);

onMounted(async () => {
  feedbackStore.reinitialiser();
  await documentsStore.chargerDocument(props.id);
  await documentsStore.chargerApercu(props.id);
});

async function telecharger(format: "docx" | "pdf"): Promise<void> {
  enTelechargement.value = format;
  try {
    await documentsStore.telecharger(props.id, format);
  } finally {
    enTelechargement.value = null;
  }
}

async function soumettreFeedback(): Promise<void> {
  envoiFeedbackEnCours.value = true;
  try {
    await feedbackStore.envoyerFeedback(props.id, { note: noteChoisie.value, commentaire: commentaireFeedback.value || undefined });
    noteChoisie.value = 0;
    commentaireFeedback.value = "";
  } finally {
    envoiFeedbackEnCours.value = false;
  }
}
</script>

<template>
  <div class="conteneur">
    <template v-if="!documentsStore.apercuHtml">
      <p>{{ $t("commun.chargement") }}</p>
    </template>

    <template v-else>
      <p v-if="modeDemonstration" class="mention-mock">⚠️ {{ $t("apercu.mentionMock") }}</p>

      <div class="carte apercu-document" v-html="documentsStore.apercuHtml"></div>

      <div class="actions-apercu">
        <button
          type="button"
          class="bouton-primaire"
          :disabled="modeDemonstration || enTelechargement === 'docx'"
          :title="modeDemonstration ? 'Téléchargement disponible en mode connecté' : ''"
          @click="telecharger('docx')"
        >
          {{ enTelechargement === "docx" ? $t("commun.chargement") : $t("apercu.telecharger") }}
        </button>
        <button
          type="button"
          class="bouton-secondaire"
          :disabled="modeDemonstration || enTelechargement === 'pdf'"
          :title="modeDemonstration ? 'Téléchargement disponible en mode connecté' : ''"
          @click="telecharger('pdf')"
        >
          {{ enTelechargement === "pdf" ? $t("commun.chargement") : "Télécharger (.pdf)" }}
        </button>
        <RouterLink to="/" class="bouton-secondaire">{{ $t("apercu.nouvelleGeneration") }}</RouterLink>
      </div>

      <div class="carte bloc-feedback">
        <h2>{{ $t("feedback.titre") }}</h2>

        <template v-if="feedbackStore.envoiReussi">
          <p class="feedback-merci">{{ $t("feedback.merci") }}</p>
          <button type="button" class="lien-bascule" @click="feedbackStore.reinitialiser()">
            {{ $t("feedback.nouveauRetour") }}
          </button>
        </template>

        <form v-else @submit.prevent="soumettreFeedback">
          <div class="champ">
            <label>{{ $t("feedback.note") }}</label>
            <div class="etoiles">
              <button
                v-for="n in 5"
                :key="n"
                type="button"
                class="etoile"
                :class="{ active: n <= noteChoisie }"
                :aria-label="`${n} / 5`"
                @click="noteChoisie = n"
              >
                ★
              </button>
            </div>
          </div>
          <div class="champ">
            <label for="commentaireFeedback">{{ $t("feedback.commentaire") }}</label>
            <textarea id="commentaireFeedback" v-model="commentaireFeedback" rows="3"></textarea>
          </div>
          <button type="submit" class="bouton-primaire" :disabled="noteChoisie === 0 || envoiFeedbackEnCours">
            {{ envoiFeedbackEnCours ? $t("commun.chargement") : $t("feedback.envoyer") }}
          </button>
        </form>
      </div>
    </template>
  </div>
</template>

<style scoped>
.mention-mock {
  background: #fff6e0;
  border: 1px solid #e9cf8a;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13.5px;
  margin-bottom: 16px;
}
.apercu-document {
  font-size: 14.5px;
  line-height: 1.6;
}
.apercu-document :deep(h1) {
  color: var(--couleur-marque-fonce);
  border-bottom: 2px solid var(--couleur-marque);
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.apercu-document :deep(h2) {
  color: var(--couleur-marque-fonce);
  font-size: 17px;
  margin-top: 26px;
}
.apercu-document :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 13px;
}
.apercu-document :deep(td),
.apercu-document :deep(th) {
  border: 1px solid var(--couleur-bordure);
  padding: 6px 8px;
  text-align: left;
}
.apercu-document :deep(th) {
  background: var(--couleur-marque);
  color: #fff;
}
.actions-apercu {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
.bloc-feedback {
  margin-top: 24px;
}
.bloc-feedback h2 {
  margin: 0 0 14px;
  font-size: 16px;
  color: var(--couleur-marque-fonce);
}
.etoiles {
  display: flex;
  gap: 4px;
}
.etoile {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: var(--couleur-bordure);
  padding: 2px;
}
.etoile.active {
  color: #e0a52c;
}
.feedback-merci {
  color: var(--couleur-marque-fonce);
  font-weight: 600;
  margin: 0 0 10px;
}
</style>
