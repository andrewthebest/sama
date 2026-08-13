<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth.store";
import { useResourcesStore } from "@/stores/resources.store";

const authStore = useAuthStore();
const resourcesStore = useResourcesStore();

const estModerateur = computed(() => authStore.user?.role === "MODERATEUR" || authStore.user?.role === "ADMINISTRATEUR");

onMounted(async () => {
  await resourcesStore.chargerRessourcesPubliees();
});

async function signaler(id: string): Promise<void> {
  await resourcesStore.signaler(id);
}
</script>

<template>
  <div class="conteneur">
    <div class="entete-ecran">
      <h1>{{ $t("resources.titre") }}</h1>
      <div class="actions-entete">
        <RouterLink to="/ressources/nouvelle" class="bouton-primaire">{{ $t("resources.soumettre") }}</RouterLink>
        <RouterLink v-if="estModerateur" to="/moderation" class="bouton-secondaire">{{ $t("resources.moderation") }}</RouterLink>
      </div>
    </div>

    <p v-if="resourcesStore.ressourcesPubliees.length === 0" class="vide">{{ $t("resources.aucune") }}</p>

    <div class="grille-ressources">
      <div v-for="ressource in resourcesStore.ressourcesPubliees" :key="ressource.id" class="carte carte-ressource">
        <span class="badge-type">{{ ressource.type }}</span>
        <h2>{{ ressource.titre }}</h2>
        <p class="description">{{ ressource.description }}</p>
        <p class="meta">{{ $t("commun.pays") }} : {{ ressource.pays }}</p>
        <button type="button" class="lien-signaler" @click="signaler(ressource.id)">
          {{ $t("resources.signaler") }}
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
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}
.actions-entete {
  display: flex;
  gap: 10px;
}
.vide {
  color: var(--couleur-texte-att);
}
.grille-ressources {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}
.carte-ressource {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.badge-type {
  align-self: flex-start;
  font-size: 11.5px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--couleur-marque-claire);
  color: var(--couleur-marque-fonce);
}
.carte-ressource h2 {
  margin: 4px 0 0;
  font-size: 15.5px;
  color: var(--couleur-marque-fonce);
}
.description {
  font-size: 13.5px;
  color: var(--couleur-texte-att);
  flex-grow: 1;
}
.meta {
  font-size: 12.5px;
  color: var(--couleur-texte-att);
  margin: 0;
}
.lien-signaler {
  align-self: flex-start;
  background: none;
  border: none;
  color: var(--couleur-texte-att);
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  margin-top: 4px;
}
</style>
