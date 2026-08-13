<script setup lang="ts">
import { computed, reactive } from "vue";
import { useRouter } from "vue-router";
import type { CreateGenerationRequestDto } from "@sama-emi/contracts";
import { DocumentType, Modalite, NiveauRefemi, ThematiqueType } from "@sama-emi/contracts";
import { useGenerationStore } from "@/stores/generation.store";
import { listePays } from "@/data/pays";
import { CULTURES_REFEMI, NIVEAUX_REFEMI } from "@/data/refemi";

const props = defineProps<{ type: "scenario" | "parcours" }>();

const router = useRouter();
const generationStore = useGenerationStore();

const estParcours = computed(() => props.type === "parcours");
const documentType = computed(() => (estParcours.value ? DocumentType.PARCOURS : DocumentType.SCENARIO));
const pays = listePays("fr");

const sourceThematique = reactive({ mode: ThematiqueType.REFEMI as ThematiqueType, cultureId: "", competenceId: "", thematique: "" });

const formulaire = reactive({
  pays: "",
  public: "",
  duree: "",
  nombreJours: 1,
  modalite: Modalite.PRESENTIEL as Modalite,
  profilFormateur: "",
  niveau: NiveauRefemi.INTERMEDIAIRE as NiveauRefemi,
  langue: "fr",
  thematiqueLibre: "",
  objectifsLibres: "",
});

const chargement = computed(() => false);
const erreur = reactive<{ message: string | null }>({ message: null });

const culture = computed(() => CULTURES_REFEMI.find((c) => c.id === sourceThematique.cultureId));
const competence = computed(() => culture.value?.competences.find((c) => c.id === sourceThematique.competenceId));

function surChangementCulture(): void {
  sourceThematique.competenceId = "";
  sourceThematique.thematique = "";
}

async function soumettre(): Promise<void> {
  erreur.message = null;

  const dto: CreateGenerationRequestDto = {
    type: documentType.value,
    pays: formulaire.pays,
    thematiqueType: sourceThematique.mode,
    public: formulaire.public,
    duree: formulaire.duree,
    modalite: formulaire.modalite,
    profilFormateur: formulaire.profilFormateur,
    langue: formulaire.langue,
    niveau: sourceThematique.mode === ThematiqueType.REFEMI ? formulaire.niveau : undefined,
    nombreJours: estParcours.value ? formulaire.nombreJours : undefined,
    formatGlobal: estParcours.value ? formulaire.duree : undefined,
  };

  if (sourceThematique.mode === ThematiqueType.REFEMI) {
    if (!culture.value || !competence.value || !sourceThematique.thematique) {
      erreur.message = "Veuillez compléter la sélection en cascade REFEMI.";
      return;
    }
    dto.referentielRefemi = {
      culture: culture.value.nom,
      competence: competence.value.nom,
      niveau: formulaire.niveau,
      thematique: sourceThematique.thematique,
    };
  } else {
    dto.thematiqueLibre = formulaire.thematiqueLibre;
    dto.objectifsLibres = formulaire.objectifsLibres;
  }

  try {
    await generationStore.lancerGeneration(dto);
    await router.push({ name: "generation-progression", params: { jobId: generationStore.jobCourant.jobId } });
  } catch (e: unknown) {
    const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    erreur.message = message ?? "La génération n'a pas pu être lancée.";
  }
}
</script>

<template>
  <div class="conteneur">
    <h1>{{ $t(estParcours ? "cadrage.titreParcours" : "cadrage.titreScenario") }}</h1>

    <form class="carte" @submit.prevent="soumettre">
      <fieldset class="groupe">
        <legend>{{ $t("cadrage.sourceThematique") }}</legend>
        <div class="bascule">
          <label>
            <input v-model="sourceThematique.mode" type="radio" :value="ThematiqueType.REFEMI" />
            {{ $t("cadrage.refemi") }}
          </label>
          <label>
            <input v-model="sourceThematique.mode" type="radio" :value="ThematiqueType.PERSONNALISEE" />
            {{ $t("cadrage.personnalisee") }}
          </label>
        </div>

        <template v-if="sourceThematique.mode === ThematiqueType.REFEMI">
          <div class="champ">
            <label for="culture">{{ $t("cadrage.culture") }}</label>
            <select id="culture" v-model="sourceThematique.cultureId" required @change="surChangementCulture">
              <option value="" disabled>—</option>
              <option v-for="c in CULTURES_REFEMI" :key="c.id" :value="c.id">{{ c.nom }}</option>
            </select>
          </div>
          <div class="champ">
            <label for="competence">{{ $t("cadrage.competence") }}</label>
            <select id="competence" v-model="sourceThematique.competenceId" required :disabled="!culture">
              <option value="" disabled>—</option>
              <option v-for="c in culture?.competences ?? []" :key="c.id" :value="c.id">{{ c.nom }}</option>
            </select>
          </div>
          <div class="champ">
            <label for="niveau">{{ $t("cadrage.niveau") }}</label>
            <select id="niveau" v-model="formulaire.niveau" required>
              <option v-for="n in NIVEAUX_REFEMI" :key="n.valeur" :value="n.valeur">{{ n.libelle }}</option>
            </select>
          </div>
          <div class="champ">
            <label for="thematique">{{ $t("cadrage.thematique") }}</label>
            <select id="thematique" v-model="sourceThematique.thematique" required :disabled="!competence">
              <option value="" disabled>—</option>
              <option v-for="t in competence?.thematiquesIndicatives ?? []" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
        </template>

        <template v-else>
          <div class="champ">
            <label for="thematiqueLibre">{{ $t("cadrage.thematiqueLibre") }}</label>
            <input id="thematiqueLibre" v-model="formulaire.thematiqueLibre" type="text" required />
          </div>
          <div class="champ">
            <label for="objectifsLibres">{{ $t("cadrage.objectifsLibres") }}</label>
            <textarea id="objectifsLibres" v-model="formulaire.objectifsLibres" rows="3" required></textarea>
          </div>
        </template>
      </fieldset>

      <div class="champ">
        <label for="pays">{{ $t("commun.pays") }} *</label>
        <select id="pays" v-model="formulaire.pays" required>
          <option value="" disabled>—</option>
          <option v-for="p in pays" :key="p.code" :value="p.code">{{ p.libelle }}</option>
        </select>
      </div>

      <div class="champ">
        <label for="public">{{ $t("cadrage.public") }}</label>
        <input id="public" v-model="formulaire.public" type="text" required placeholder="ex. Jeunes 15-18 ans" />
      </div>

      <div class="champ">
        <label for="duree">{{ $t(estParcours ? "cadrage.formatGlobal" : "cadrage.duree") }}</label>
        <input id="duree" v-model="formulaire.duree" type="text" required :placeholder="estParcours ? 'ex. 2-3 jours' : 'ex. 2h'" />
      </div>

      <div v-if="estParcours" class="champ">
        <label for="nombreJours">{{ $t("cadrage.nombreJours") }}</label>
        <input id="nombreJours" v-model.number="formulaire.nombreJours" type="number" min="1" required />
      </div>

      <div class="champ">
        <label for="modalite">{{ $t("cadrage.modalite") }}</label>
        <select id="modalite" v-model="formulaire.modalite" required>
          <option :value="Modalite.PRESENTIEL">Présentiel</option>
          <option :value="Modalite.DISTANCIEL">Distanciel</option>
          <option :value="Modalite.HYBRIDE">Hybride</option>
        </select>
      </div>

      <div class="champ">
        <label for="profilFormateur">{{ $t("cadrage.profilFormateur") }}</label>
        <input id="profilFormateur" v-model="formulaire.profilFormateur" type="text" required placeholder="ex. Enseignant·e" />
      </div>

      <div class="champ">
        <label for="langue">{{ $t("commun.langue") }}</label>
        <select id="langue" v-model="formulaire.langue" required>
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>

      <p class="note-quota">{{ $t("cadrage.quotaAvertissement") }}</p>
      <p v-if="erreur.message" class="message-erreur">{{ erreur.message }}</p>

      <button type="submit" class="bouton-primaire" :disabled="chargement">{{ $t("cadrage.lancerGeneration") }}</button>
    </form>
  </div>
</template>

<style scoped>
.groupe {
  border: 1px solid var(--couleur-bordure);
  border-radius: 8px;
  padding: 14px 16px 4px;
  margin-bottom: 20px;
}
.groupe legend {
  font-size: 13px;
  font-weight: 600;
  color: var(--couleur-texte-att);
  padding: 0 6px;
}
.bascule {
  display: flex;
  gap: 20px;
  margin-bottom: 14px;
  font-size: 14px;
}
.bascule label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.note-quota {
  font-size: 12.5px;
  color: var(--couleur-texte-att);
  margin: 4px 0 16px;
}
</style>
