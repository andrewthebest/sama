<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ResourceType } from "@sama-emi/contracts";
import { listePays } from "@/data/pays";
import { useResourcesStore } from "@/stores/resources.store";

const router = useRouter();
const resourcesStore = useResourcesStore();
const pays = listePays("fr");
const enEnvoi = ref(false);
const confirmation = ref<string | null>(null);

const formulaire = reactive({
  titre: "",
  description: "",
  type: ResourceType.FICHE_PEDAGOGIQUE,
  contenu: "",
  thematiqueLibre: "",
  pays: "",
});

const typesRessource = Object.values(ResourceType);

async function soumettre(): Promise<void> {
  enEnvoi.value = true;
  confirmation.value = null;
  try {
    const ressource = await resourcesStore.soumettre({
      titre: formulaire.titre,
      description: formulaire.description,
      type: formulaire.type,
      contenu: formulaire.contenu || undefined,
      thematiqueLibre: formulaire.thematiqueLibre || undefined,
      pays: formulaire.pays,
    });
    confirmation.value = ressource.statut === "EN_EXAMEN" ? "resources.confirmationEnExamen" : "resources.confirmationEnAttente";
  } finally {
    enEnvoi.value = false;
  }
}

function retourListe(): void {
  void router.push("/ressources");
}
</script>

<template>
  <div class="conteneur conteneur-etroit">
    <div class="carte">
      <h1>{{ $t("resources.soumettre") }}</h1>

      <template v-if="confirmation">
        <p class="confirmation">{{ $t(confirmation) }}</p>
        <button type="button" class="bouton-primaire" @click="retourListe">{{ $t("resources.voirListe") }}</button>
      </template>

      <form v-else @submit.prevent="soumettre">
        <div class="champ">
          <label for="titre">{{ $t("resources.champTitre") }}</label>
          <input id="titre" v-model="formulaire.titre" type="text" required />
        </div>
        <div class="champ">
          <label for="description">{{ $t("resources.champDescription") }}</label>
          <textarea id="description" v-model="formulaire.description" rows="3" required></textarea>
        </div>
        <div class="champ">
          <label for="type">{{ $t("resources.champType") }}</label>
          <select id="type" v-model="formulaire.type" required>
            <option v-for="t in typesRessource" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="champ">
          <label for="contenu">{{ $t("resources.champContenu") }}</label>
          <textarea id="contenu" v-model="formulaire.contenu" rows="4"></textarea>
        </div>
        <div class="champ">
          <label for="thematiqueLibre">{{ $t("resources.champThematique") }}</label>
          <input id="thematiqueLibre" v-model="formulaire.thematiqueLibre" type="text" />
        </div>
        <div class="champ">
          <label for="pays">{{ $t("commun.pays") }} *</label>
          <select id="pays" v-model="formulaire.pays" required>
            <option value="" disabled>—</option>
            <option v-for="p in pays" :key="p.code" :value="p.code">{{ p.libelle }}</option>
          </select>
        </div>
        <button type="submit" class="bouton-primaire" :disabled="enEnvoi">
          {{ enEnvoi ? $t("commun.chargement") : $t("resources.envoyer") }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.conteneur-etroit {
  max-width: 480px;
}
.confirmation {
  color: var(--couleur-marque-fonce);
  font-weight: 600;
  margin-bottom: 16px;
}
</style>
