<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

function choisir(type: "scenario" | "parcours"): void {
  void router.push({ name: "cadrage", params: { type } });
}
</script>

<template>
  <div class="conteneur">
    <h1>{{ $t("accueil.titre") }}</h1>
    <p class="sous-titre">{{ $t("accueil.sousTitre") }}</p>

    <div class="grille-choix">
      <button type="button" class="carte carte-choix" @click="choisir('scenario')">
        <span class="icone" aria-hidden="true">📄</span>
        <h2>{{ $t("accueil.scenario") }}</h2>
        <p>{{ $t("accueil.scenarioDescription") }}</p>
      </button>
      <button type="button" class="carte carte-choix" @click="choisir('parcours')">
        <span class="icone" aria-hidden="true">🗂️</span>
        <h2>{{ $t("accueil.parcours") }}</h2>
        <p>{{ $t("accueil.parcoursDescription") }}</p>
      </button>
    </div>
  </div>
</template>

<style scoped>
.sous-titre {
  color: var(--couleur-texte-att);
  margin-top: -8px;
}
.grille-choix {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 28px;
}
.carte-choix {
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.1s ease;
  font-family: inherit;
}
.carte-choix:hover {
  border-color: var(--couleur-marque);
  transform: translateY(-1px);
}
.icone {
  font-size: 28px;
}
.carte-choix h2 {
  margin: 10px 0 4px;
  font-size: 17px;
  color: var(--couleur-marque-fonce);
}
.carte-choix p {
  margin: 0;
  color: var(--couleur-texte-att);
  font-size: 14px;
}
</style>
