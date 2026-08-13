<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { listePays } from "@/data/pays";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const modeInscription = ref(true);
const chargement = ref(false);
const erreur = ref<string | null>(null);
const pays = listePays("fr");

const formulaire = reactive({
  email: "",
  motDePasse: "",
  nom: "",
  prenom: "",
  pays: "",
  organisation: "",
});

const titre = computed(() => (modeInscription.value ? "auth.inscriptionTitre" : "auth.connexionTitre"));

async function soumettre(): Promise<void> {
  erreur.value = null;
  chargement.value = true;
  try {
    if (modeInscription.value) {
      await authStore.inscrire({
        email: formulaire.email,
        motDePasse: formulaire.motDePasse,
        nom: formulaire.nom,
        prenom: formulaire.prenom,
        pays: formulaire.pays,
        organisation: formulaire.organisation || undefined,
      });
    } else {
      await authStore.connecter({ email: formulaire.email, motDePasse: formulaire.motDePasse });
    }
    const destination = (route.query.redirect as string) || "/";
    await router.push(destination);
  } catch {
    erreur.value = "auth.erreur";
  } finally {
    chargement.value = false;
  }
}
</script>

<template>
  <div class="conteneur conteneur-etroit">
    <div class="carte">
      <h1>{{ $t(titre) }}</h1>

      <form @submit.prevent="soumettre">
        <div class="champ">
          <label for="email">{{ $t("auth.email") }}</label>
          <input id="email" v-model="formulaire.email" type="email" required autocomplete="email" />
        </div>
        <div class="champ">
          <label for="motDePasse">{{ $t("auth.motDePasse") }}</label>
          <input id="motDePasse" v-model="formulaire.motDePasse" type="password" required minlength="8" autocomplete="current-password" />
        </div>

        <template v-if="modeInscription">
          <div class="champ">
            <label for="prenom">{{ $t("auth.prenom") }}</label>
            <input id="prenom" v-model="formulaire.prenom" type="text" required />
          </div>
          <div class="champ">
            <label for="nom">{{ $t("auth.nom") }}</label>
            <input id="nom" v-model="formulaire.nom" type="text" required />
          </div>
          <div class="champ">
            <label for="pays">{{ $t("commun.pays") }} *</label>
            <select id="pays" v-model="formulaire.pays" required>
              <option value="" disabled>—</option>
              <option v-for="p in pays" :key="p.code" :value="p.code">{{ p.libelle }}</option>
            </select>
          </div>
          <div class="champ">
            <label for="organisation">{{ $t("auth.organisation") }}</label>
            <input id="organisation" v-model="formulaire.organisation" type="text" />
          </div>
        </template>

        <p v-if="erreur" class="message-erreur">{{ $t(erreur) }}</p>

        <button type="submit" class="bouton-primaire" :disabled="chargement">
          {{ $t(modeInscription ? "auth.inscrire" : "auth.connecter") }}
        </button>
      </form>

      <button type="button" class="lien-bascule" @click="modeInscription = !modeInscription">
        {{ $t(modeInscription ? "auth.basculerVersConnexion" : "auth.basculerVersInscription") }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.conteneur-etroit {
  max-width: 420px;
}
.lien-bascule {
  margin-top: 16px;
  background: none;
  border: none;
  color: var(--couleur-marque-fonce);
  font-size: 13.5px;
  padding: 0;
  text-decoration: underline;
}
</style>
