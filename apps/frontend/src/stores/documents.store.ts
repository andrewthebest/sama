import { defineStore } from "pinia";
import { ref } from "vue";
import type { DocumentEntity, DocumentVersionEntity } from "@sama-emi/contracts";
import { apiClient } from "@/api/client";

/**
 * Store de l'espace personnel de documents (scénarios/parcours générés).
 *
 * L'aperçu (`apercuHtml`) provient toujours de
 * `GET /documents/:id/apercu.html` — en mode connecté, converti depuis
 * le `.docx` réel via `mammoth` côté backend ; en mode démonstration,
 * une fixture HTML servie par MSW. Le composant qui affiche l'aperçu
 * ne distingue jamais les deux cas.
 */
export const useDocumentsStore = defineStore("documents", () => {
  const documents = ref<DocumentEntity[]>([]);
  const documentCourant = ref<DocumentEntity | null>(null);
  const versionCourante = ref<DocumentVersionEntity | null>(null);
  const apercuHtml = ref<string | null>(null);

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

  async function chargerApercu(id: string): Promise<void> {
    const { data } = await apiClient.get<{ html: string }>(`/documents/${id}/apercu.html`);
    apercuHtml.value = data.html;
  }

  /**
   * Télécharge le document au format demandé. Utilise un blob plutôt
   * qu'une simple navigation `<a href>` : l'endpoint exige un token
   * d'authentification, qu'un lien de navigation classique ne peut pas
   * transmettre en en-tête.
   */
  async function telecharger(id: string, format: "docx" | "pdf"): Promise<void> {
    const reponse = await apiClient.get<Blob>(`/documents/${id}/telecharger.${format}`, { responseType: "blob" });
    const url = URL.createObjectURL(reponse.data);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `sama-emi-${id}.${format}`;
    lien.click();
    URL.revokeObjectURL(url);
  }

  return { documents, documentCourant, versionCourante, apercuHtml, chargerMesDocuments, chargerDocument, chargerApercu, telecharger };
});
