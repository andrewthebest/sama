<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useDocumentsStore } from "@/stores/documents.store";

const props = defineProps<{ id: string }>();

const documentsStore = useDocumentsStore();

onMounted(() => {
  void documentsStore.chargerDocument(props.id);
});

/**
 * Forme provisoire du contenu simulé (Session A). `DocumentVersionEntity.contenu`
 * est typé `unknown` côté contrat car sa structure réelle ne sera figée
 * qu'avec le moteur de génération complet (Session B) ; ce cast local
 * sert uniquement à l'aperçu de ce squelette.
 */
interface ContenuMock {
  couverture: { titre: string; citation: string; pays: string; public: string; duree: string; modalite: string; profilFormateur: string; langue: string };
  sections: Array<{ numero: number | string; id: string; titre: string; texte: string; tableauMock?: Array<Record<string, string>> }>;
  gestesProfessionnelsFormateur?: { titre: string; items: Array<{ cle: string; libelle: string; texte: string }> };
  mentionIaARelire: string;
}

const contenu = computed(() => documentsStore.versionCourante?.contenu as ContenuMock | undefined);
</script>

<template>
  <div class="conteneur">
    <template v-if="!documentsStore.documentCourant">
      <p>{{ $t("commun.chargement") }}</p>
    </template>

    <template v-else>
      <p class="mention-mock">⚠️ {{ $t("apercu.mentionMock") }}</p>

      <div class="carte apercu-document">
        <header class="couverture">
          <h1>{{ contenu?.couverture.titre ?? documentsStore.documentCourant.titre }}</h1>
          <p class="citation">{{ contenu?.couverture.citation }}</p>
          <dl class="meta-couverture">
            <div><dt>{{ $t("commun.pays") }}</dt><dd>{{ documentsStore.documentCourant.pays }}</dd></div>
            <div><dt>{{ $t("cadrage.public") }}</dt><dd>{{ contenu?.couverture.public }}</dd></div>
            <div><dt>{{ $t("cadrage.duree") }}</dt><dd>{{ contenu?.couverture.duree }}</dd></div>
            <div><dt>{{ $t("cadrage.modalite") }}</dt><dd>{{ contenu?.couverture.modalite }}</dd></div>
            <div><dt>{{ $t("cadrage.profilFormateur") }}</dt><dd>{{ contenu?.couverture.profilFormateur }}</dd></div>
          </dl>
        </header>

        <section v-for="section in contenu?.sections ?? []" :key="section.id" class="section-document">
          <h2>{{ section.numero }}. {{ section.titre }}</h2>
          <p>{{ section.texte }}</p>
          <table v-if="section.tableauMock" class="tableau-mock">
            <tbody>
              <tr v-for="(ligne, i) in section.tableauMock" :key="i">
                <td v-for="(valeur, cle) in ligne" :key="cle">{{ valeur }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section v-if="contenu?.gestesProfessionnelsFormateur" class="encadre-fixe">
          <h3>{{ contenu.gestesProfessionnelsFormateur.titre }}</h3>
          <dl>
            <template v-for="item in contenu.gestesProfessionnelsFormateur.items" :key="item.cle">
              <dt>{{ item.libelle }}</dt>
              <dd>{{ item.texte }}</dd>
            </template>
          </dl>
        </section>

        <p class="mention-ia">{{ contenu?.mentionIaARelire }}</p>
      </div>

      <div class="actions-apercu">
        <button type="button" class="bouton-primaire" disabled title="Disponible en Session B">{{ $t("apercu.telecharger") }}</button>
        <RouterLink to="/" class="bouton-secondaire">{{ $t("apercu.nouvelleGeneration") }}</RouterLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.mention-mock {
  background: #fff6e0;
  border: 1px solid #e9cf8a;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13.5px;
  margin-bottom: 16px;
}
.apercu-document {
  font-size: 14.5px;
}
.couverture {
  border-bottom: 2px solid var(--couleur-marque);
  padding-bottom: 16px;
  margin-bottom: 20px;
}
.couverture h1 {
  color: var(--couleur-marque-fonce);
  margin-bottom: 4px;
}
.citation {
  font-style: italic;
  color: var(--couleur-texte-att);
}
.meta-couverture {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px 20px;
  margin-top: 14px;
}
.meta-couverture dt {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--couleur-texte-att);
}
.meta-couverture dd {
  margin: 0;
  font-weight: 600;
}
.section-document {
  padding: 14px 0;
  border-top: 1px solid var(--couleur-bordure);
}
.section-document h2 {
  font-size: 15.5px;
  color: var(--couleur-marque-fonce);
}
.tableau-mock {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  font-size: 13px;
}
.tableau-mock td {
  border: 1px solid var(--couleur-bordure);
  padding: 6px 8px;
  color: var(--couleur-texte-att);
}
.encadre-fixe {
  margin-top: 20px;
  padding: 16px;
  background: var(--couleur-marque-claire);
  border-radius: 8px;
}
.encadre-fixe dt {
  font-weight: 600;
  margin-top: 8px;
}
.encadre-fixe dd {
  margin: 2px 0 0;
  color: var(--couleur-texte-att);
}
.mention-ia {
  margin-top: 20px;
  font-size: 12px;
  color: var(--couleur-texte-att);
  border-top: 1px solid var(--couleur-bordure);
  padding-top: 12px;
}
.actions-apercu {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
</style>
