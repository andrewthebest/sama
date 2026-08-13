<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

const authStore = useAuthStore();
const router = useRouter();

function seDeconnecter(): void {
  authStore.deconnecter();
  void router.push({ name: "connexion" });
}
</script>

<template>
  <header class="entete">
    <RouterLink to="/" class="marque">SAMA EMI</RouterLink>
    <div v-if="authStore.estConnecte" class="entete-droite">
      <span class="utilisateur">{{ authStore.user?.prenom }} · {{ authStore.user?.pays }}</span>
      <button class="bouton-secondaire" @click="seDeconnecter">Déconnexion</button>
    </div>
  </header>
  <RouterView />
</template>

<style scoped>
.entete {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--couleur-surface);
  border-bottom: 1px solid var(--couleur-bordure);
}
.marque {
  font-weight: 700;
  font-size: 18px;
  color: var(--couleur-marque-fonce);
  text-decoration: none;
  letter-spacing: -0.01em;
}
.entete-droite {
  display: flex;
  align-items: center;
  gap: 14px;
}
.utilisateur {
  font-size: 13.5px;
  color: var(--couleur-texte-att);
}
</style>
