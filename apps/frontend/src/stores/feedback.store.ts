import { defineStore } from "pinia";
import { ref } from "vue";
import type { CreateFeedbackRequestDto, FeedbackEntity } from "@sama-emi/contracts";
import { apiClient } from "@/api/client";

/** Store des retours de session, rattachés à un document généré. */
export const useFeedbackStore = defineStore("feedback", () => {
  const feedbacksDocument = ref<FeedbackEntity[]>([]);
  const envoiReussi = ref(false);

  async function chargerFeedbacksDocument(documentId: string): Promise<void> {
    const { data } = await apiClient.get<FeedbackEntity[]>(`/documents/${documentId}/feedback`);
    feedbacksDocument.value = data;
  }

  async function envoyerFeedback(documentId: string, dto: CreateFeedbackRequestDto): Promise<void> {
    const { data } = await apiClient.post<FeedbackEntity>(`/documents/${documentId}/feedback`, dto);
    feedbacksDocument.value = [data, ...feedbacksDocument.value];
    envoiReussi.value = true;
  }

  function reinitialiser(): void {
    envoiReussi.value = false;
  }

  return { feedbacksDocument, envoiReussi, chargerFeedbacksDocument, envoyerFeedback, reinitialiser };
});
