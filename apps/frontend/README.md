# @sama-emi/frontend

Frontend Vue 3 (Composition API) de SAMA EMI.

## Structure

| Dossier | Rôle |
|---|---|
| `src/views/` | Écrans : `AuthView`, `HomeView`, `CadrageFormView`, `GenerationProgressView`, `DocumentPreviewView`, `SubscriptionView` |
| `src/stores/` | Pinia — `auth`, `generation`, `documents`, `subscriptions` |
| `src/api/` | `client.ts` (axios, intercepté par MSW en mode démo), `websocket.ts` (Socket.IO réel) |
| `src/composables/useGenerationProgress.ts` | Point d'entrée unique de suivi de progression — voir son commentaire pour l'exception WebSocket/MSW documentée |
| `src/mocks/` | Mode démonstration : handlers MSW + fixtures JSON |
| `src/data/` | `pays.ts` (liste ISO complète, via `i18n-iso-countries`), `refemi.ts` (cascade REFEMI — contenu partiellement placeholder, voir commentaire en tête de fichier) |
| `src/locales/` | Traductions `fr` (repli) / `en` |

## Écrans couverts (Sessions A-C)

Choix scénario/parcours → formulaire de cadrage (sélecteur en cascade
REFEMI ou thématique personnalisée, pays obligatoire) → lancement →
barre de progression temps réel → aperçu HTML du document assemblé
(conversion `mammoth` du vrai `.docx` en mode connecté, HTML équivalent
généré côté mock en mode démonstration) → téléchargement `.docx`/`.pdf`
réel (désactivé en mode démonstration, où il n'y a pas de fichier
binaire à servir).

« Mon abonnement » (`/abonnement`, lien dans l'en-tête) affiche le
statut de l'abonnement courant (essai ou souscription), le quota
consommé/restant et le plan associé le cas échéant — alimenté par
`GET /subscriptions/me`, avec la même fixture MSW en mode
démonstration que le backend réel.

Voir le README racine pour les commandes de lancement (démo et
connecté).

## Ce qui manque encore

- Espace personnel listant tous les documents (`GET /documents` existe
  déjà côté store et backend, mais aucun écran ne l'affiche encore).
- Contenu REFEMI authentique dans `data/refemi.ts` (actuellement
  partiellement placeholder — voir le commentaire en tête de fichier).
- Écran de choix/changement de plan d'abonnement (`GET /plans` existe
  côté backend, mais aucun écran ne l'affiche encore — paiement hors
  périmètre, voir `subscriptions/README.md`).
