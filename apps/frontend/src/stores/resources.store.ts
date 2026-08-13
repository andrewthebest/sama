import { defineStore } from "pinia";
import { ref } from "vue";
import type {
  CreateResourceRequestDto,
  ResourceEntity,
  ResourceType,
  VoteResourceRequestDto,
} from "@sama-emi/contracts";
import { apiClient } from "@/api/client";

/** Store de la banque de ressources communautaire (soumission, liste publiée, file de modération). */
export const useResourcesStore = defineStore("resources", () => {
  const ressourcesPubliees = ref<ResourceEntity[]>([]);
  const mesRessources = ref<ResourceEntity[]>([]);
  const fileModeration = ref<ResourceEntity[]>([]);

  async function chargerRessourcesPubliees(filtres: { pays?: string; type?: ResourceType } = {}): Promise<void> {
    const { data } = await apiClient.get<ResourceEntity[]>("/resources", { params: filtres });
    ressourcesPubliees.value = data;
  }

  async function chargerMesRessources(): Promise<void> {
    const { data } = await apiClient.get<ResourceEntity[]>("/resources/mes");
    mesRessources.value = data;
  }

  async function chargerFileModeration(): Promise<void> {
    const { data } = await apiClient.get<ResourceEntity[]>("/resources/moderation/file");
    fileModeration.value = data;
  }

  async function soumettre(dto: CreateResourceRequestDto): Promise<ResourceEntity> {
    const { data } = await apiClient.post<ResourceEntity>("/resources", dto);
    return data;
  }

  async function voter(id: string, dto: VoteResourceRequestDto): Promise<void> {
    await apiClient.post(`/resources/${id}/vote`, dto);
    fileModeration.value = fileModeration.value.filter((r) => r.id !== id);
  }

  async function signaler(id: string): Promise<void> {
    await apiClient.post(`/resources/${id}/signaler`, {});
    ressourcesPubliees.value = ressourcesPubliees.value.map((r) => (r.id === id ? { ...r, statut: "SIGNALEE" as const, signalements: r.signalements + 1 } : r));
  }

  return {
    ressourcesPubliees,
    mesRessources,
    fileModeration,
    chargerRessourcesPubliees,
    chargerMesRessources,
    chargerFileModeration,
    soumettre,
    voter,
    signaler,
  };
});
