# @sama-emi/frontend

Frontend Vue 3 (Composition API) de SAMA EMI.

## Structure

| Dossier | Rôle |
|---|---|
| `src/views/` | Écrans : `AuthView`, `HomeView`, `CadrageFormView`, `GenerationProgressView`, `DocumentPreviewView` |
| `src/stores/` | Pinia — `auth`, `generation`, `documents` |
| `src/api/` | `client.ts` (axios, intercepté par MSW en mode démo), `websocket.ts` (Socket.IO réel) |
| `src/composables/useGenerationProgress.ts` | Point d'entrée unique de suivi de progression — voir son commentaire pour l'exception WebSocket/MSW documentée |
| `src/mocks/` | Mode démonstration : handlers MSW + fixtures JSON |
| `src/data/` | `pays.ts` (liste ISO complète, via `i18n-iso-countries`), `refemi.ts` (cascade REFEMI — contenu partiellement placeholder, voir commentaire en tête de fichier) |
| `src/locales/` | Traductions `fr` (repli) / `en` |

## Écran couvert en Session A

Choix scénario/parcours → formulaire de cadrage (sélecteur en cascade
REFEMI ou thématique personnalisée, pays obligatoire) → lancement →
barre de progression temps réel → aperçu factice du document. Voir le
README racine pour les commandes de lancement (démo et connecté).

## Ce qui manque encore (hors périmètre Session A)

- Téléchargement réel `.docx`/`.pdf` (le bouton est désactivé — Session B).
- Espace personnel listant tous les documents (`GET /documents` existe
  déjà côté store et backend, mais aucun écran ne l'affiche encore).
- Contenu REFEMI authentique dans `data/refemi.ts` (actuellement
  partiellement placeholder — voir le commentaire en tête de fichier).
