# @sama-emi/frontend

Frontend Vue 3 (Composition API) de SAMA EMI.

## Structure

| Dossier | Rôle |
|---|---|
| `src/views/` | Écrans : `AuthView`, `HomeView`, `CadrageFormView`, `GenerationProgressView`, `DocumentPreviewView`, `SubscriptionView`, `ResourcesView`, `SubmitResourceView`, `ModerationQueueView` |
| `src/stores/` | Pinia — `auth`, `generation`, `documents`, `subscriptions`, `feedback`, `resources` |
| `src/api/` | `client.ts` (axios, intercepté par MSW en mode démo), `websocket.ts` (Socket.IO réel) |
| `src/composables/useGenerationProgress.ts` | Point d'entrée unique de suivi de progression — voir son commentaire pour l'exception WebSocket/MSW documentée |
| `src/mocks/` | Mode démonstration : handlers MSW + fixtures JSON |
| `src/data/` | `pays.ts` (liste ISO complète, via `i18n-iso-countries`), `refemi.ts` (cascade REFEMI — contenu partiellement placeholder, voir commentaire en tête de fichier) |
| `src/locales/` | Traductions `fr` (repli) / `en` |

## Écrans couverts (Sessions A-E)

Choix scénario/parcours → formulaire de cadrage (sélecteur en cascade
REFEMI ou thématique personnalisée, pays obligatoire, nombre de jours
pour un parcours) → lancement → barre de progression temps réel →
aperçu HTML du document assemblé (conversion `mammoth` du vrai `.docx`
en mode connecté, HTML équivalent généré côté mock en mode
démonstration) → téléchargement `.docx`/`.pdf` réel (désactivé en mode
démonstration, où il n'y a pas de fichier binaire à servir).

« Mon abonnement » (`/abonnement`, lien dans l'en-tête) affiche le
statut de l'abonnement courant (essai ou souscription), le quota
consommé/restant et le plan associé le cas échéant — alimenté par
`GET /subscriptions/me`, avec la même fixture MSW en mode
démonstration que le backend réel.

Sur l'écran d'aperçu d'un document, un formulaire de retour de session
(note sur 5, commentaire libre) permet de laisser un ou plusieurs
retours (`POST /documents/:id/feedback`), avec confirmation visuelle et
possibilité d'en envoyer un autre.

« Ressources » (`/ressources`, lien dans l'en-tête) liste les
ressources publiées et permet d'en soumettre une nouvelle
(`/ressources/nouvelle`) ou de signaler une ressource publiée. Un
compte `MODERATEUR` ou `ADMINISTRATEUR` voit en plus un lien
« Modération » (`/moderation`) : sa file de ressources à examiner
(vote « valider »/« rejeter » + commentaire), et un bouton pour
basculer sa disponibilité de désignation. Ces deux écrans traduisent
côté interface le module `resources` — voir son README pour la
machine à états complète (quorum, vote en aveugle).

Voir le README racine pour les commandes de lancement (démo et
connecté).

### Piège connu : cache de pré-bundling Vite après ajout d'exports à `@sama-emi/contracts`

Si un écran importe un nouvel enum/type fraîchement ajouté à
`@sama-emi/contracts` et échoue au runtime avec une erreur du type
`Cannot read properties of undefined` sur cet import (alors que la
compilation TypeScript passe), c'est presque toujours le cache de
pré-bundling de Vite (`node_modules/.vite/`) qui sert encore l'ancienne
version du paquet — Vite ne détecte pas toujours qu'un paquet du
workspace résolu par symlink a changé. Solution : arrêter le serveur
de dev, supprimer `apps/frontend/node_modules/.vite`, puis relancer
`pnpm dev:frontend` / `pnpm dev:frontend:demo`. Rencontré et corrigé en
Session E lors de l'ajout de `ResourceType`.

## Ce qui manque encore

- Espace personnel listant tous les documents (`GET /documents` existe
  déjà côté store et backend, mais aucun écran ne l'affiche encore).
- Contenu REFEMI authentique dans `data/refemi.ts` (actuellement
  partiellement placeholder — voir le commentaire en tête de fichier).
- Écran de choix/changement de plan d'abonnement (`GET /plans` existe
  côté backend, mais aucun écran ne l'affiche encore — paiement hors
  périmètre, voir `subscriptions/README.md`).
- Vue agrégée des retours donnés par l'utilisateur (`GET /feedback/me`
  existe côté backend, mais ni store ni écran ne l'exploitent encore
  côté frontend).
- Filtres de recherche sur `/ressources` (pays, type) : l'endpoint
  `GET /resources` les accepte déjà, mais l'écran ne propose pas
  encore de contrôles pour les renseigner.
- « Mes ressources » (soumissions de l'utilisateur, tous statuts) :
  `GET /resources/mes` existe côté backend, sans écran dédié.
