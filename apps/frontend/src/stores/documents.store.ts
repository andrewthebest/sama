import { defineStore } from "pinia";
import { ref } from "vue";
import type { DocumentEntity, DocumentVersionEntity } from "@sama-emi/contracts";
import { apiClient } from "@/api/client";

/** Store de l'espace personnel de documents (scénarios/parcours générés). */
export const useDocumentsStore = defineStore("documents", () => {
  const documents = ref<DocumentEntity[]>([]);
  const documentCourant = ref<DocumentEntity | null>(null);
  const versionCourante = ref<DocumentVersionEntity | null>(null);

  async function chargerMesDocuments(): Promise<void> {
    const { data } = await apiClient.get<DocumentEntity[]>("/documents");
    documents.value = data;
  }

  async function chargerDocument(id: string): Promise<void> {
    const { data } = await apiClient.get<{ document: DocumentEntity; versionCourante: DocumentVersionEntity | null }>(
      `/documents/${id}`,
    );
    documentCourant.value = data.document;
    versionCourante.value = data.versionCourante;
  }

  return { documents, documentCourant, versionCourante, chargerMesDocuments, chargerDocument };
});
