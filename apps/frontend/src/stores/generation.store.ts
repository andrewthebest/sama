import { defineStore } from "pinia";
import { reactive } from "vue";
import type { CreateGenerationRequestDto, GenerationEtape, GenerationJobStatut } from "@sama-emi/contracts";
import { apiClient } from "@/api/client";
import { suivreProgressionGeneration } from "@/composables/useGenerationProgress";

interface EtatJobCourant {
  jobId: string | null;
  documentId: string | null;
  statut: GenerationJobStatut | null;
  etape: GenerationEtape | null;
  progression: number;
  erreur: string | null;
}

/**
 * Store du flux de génération : lance une génération, puis suit sa
 * progression jusqu'à son terme. Reflète les étapes du cahier des
 * charges (section 3.2, étape 2) telles que diffusées par
 * `GenerationGateway` côté backend.
 */
export const useGenerationStore = defineStore("generation", () => {
  const jobCourant = reactive<EtatJobCourant>({
    jobId: null,
    documentId: null,
    statut: null,
    etape: null,
    progression: 0,
    erreur: null,
  });

  let arreterSuivi: (() => void) | null = null;

  async function lancerGeneration(dto: CreateGenerationRequestDto): Promise<void> {
    arreterSuivi?.();
    jobCourant.erreur = null;
    jobCourant.progression = 0;
    jobCourant.etape = null;

    const { data } = await apiClient.post<{ jobId: string; documentId: string; statut: GenerationJobStatut }>(
      "/generations",
      dto,
    );

    jobCourant.jobId = data.jobId;
    jobCourant.documentId = data.documentId;
    jobCourant.statut = data.statut;

    arreterSuivi = suivreProgressionGeneration(data.jobId, data.documentId, (event) => {
      jobCourant.statut = event.statut;
      jobCourant.etape = event.etape;
      jobCourant.progression = event.progression;
      if (event.erreur) jobCourant.erreur = event.erreur;
    });
  }

  function reinitialiser(): void {
    arreterSuivi?.();
    arreterSuivi = null;
    jobCourant.jobId = null;
    jobCourant.documentId = null;
    jobCourant.statut = null;
    jobCourant.etape = null;
    jobCourant.progression = 0;
    jobCourant.erreur = null;
  }

  return { jobCourant, lancerGeneration, reinitialiser };
});
