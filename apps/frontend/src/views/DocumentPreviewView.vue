<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useDocumentsStore } from "@/stores/documents.store";

const props = defineProps<{ id: string }>();

const documentsStore = useDocumentsStore();
const enTelechargement = ref<"docx" | "pdf" | null>(null);
const modeDemonstration = import.meta.env.VITE_USE_MOCKS === "true";

onMounted(async () => {
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
</style>
