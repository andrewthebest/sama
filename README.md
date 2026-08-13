# SAMA EMI

Système d'Accompagnement des Médiateurs et Animateurs en Éducation aux
Médias et à l'Information. Plateforme web qui génère, à partir du
référentiel francophone REFEMI, des scénarios pédagogiques (une séance)
et des parcours de formation (plusieurs jours), avec l'assistance de
l'API Anthropic.

**État du projet : Lot 1, Session B** — cœur produit (auth, users,
documents, generation) fonctionnel avec un **moteur de génération
réel** : appel à l'API Anthropic (tool use forcé), file BullMQ + Redis
avec nouvelles tentatives, assemblage `.docx` (librairie `docx`),
aperçu HTML (`mammoth`) et export PDF (LibreOffice headless) — voir
[apps/backend/src/modules/generation/README.md](apps/backend/src/modules/generation/README.md)
et
[apps/backend/src/modules/documents/README.md](apps/backend/src/modules/documents/README.md).
Neuf autres modules du cahier des charges suivront aux sessions
suivantes selon le phasage validé en cadrage.

## Stack

Monolithe modulaire NestJS (backend) + Vue 3/Pinia/vue-i18n (frontend),
PostgreSQL/Prisma, WebSocket temps réel, monorepo pnpm.

```
sama-emi/
├─ apps/
│  ├─ backend/    NestJS — voir apps/backend/README.md
│  └─ frontend/   Vue 3 — voir apps/frontend/README.md
├─ packages/
│  ├─ contracts/         types/DTO partagés (contrat d'API)
│  └─ config-gabarits/   gabarits de documents versionnés (JSON)
└─ docker-compose.yml    PostgreSQL + Redis (mode connecté)
```

## Prérequis

- Node.js ≥ 20, [pnpm](https://pnpm.io) (`corepack enable` ou `npm i -g pnpm`)
- Pour le mode connecté uniquement :
  - PostgreSQL 16 (via Docker ou installation locale) et Redis (file
    BullMQ du moteur de génération, voir `pnpm db:up`)
  - Une clé `ANTHROPIC_API_KEY` valide pour que le moteur de génération
    fonctionne réellement (sans elle, chaque génération échoue
    proprement avec un message d'erreur explicite — voir
    [apps/backend/src/modules/generation/README.md](apps/backend/src/modules/generation/README.md))
  - Le paquet système `libreoffice-writer` pour l'export PDF (ex. sur
    Debian/Ubuntu : `apt-get install -y libreoffice-writer` —
    `libreoffice-core` seul ne suffit pas, voir
    [apps/backend/src/modules/documents/README.md](apps/backend/src/modules/documents/README.md))

## Installation

```bash
pnpm install
```

Ceci installe toutes les dépendances du workspace **et** compile
automatiquement `packages/contracts` et `packages/config-gabarits`
(hook `postinstall`) — nécessaire car ces paquets sont consommés en
JavaScript compilé, pas en TypeScript source (voir
[packages/contracts/README.md](packages/contracts/README.md) pour le
détail de ce choix).

## Mode démonstration (aucun backend requis)

Le frontend seul, avec toutes les données mockées (Mock Service
Worker) : idéal pour visualiser l'interface ou faire une démonstration
sans base de données.

```bash
pnpm dev:frontend:demo
```

Ouvrez http://localhost:5173. Inscrivez-vous avec n'importe quel email
(le pays est obligatoire) : tout le flux — choix scénario/parcours,
cadrage, progression, aperçu du document — fonctionne intégralement
sans backend, y compris la progression « temps réel », simulée
localement (voir
[src/composables/useGenerationProgress.ts](apps/frontend/src/composables/useGenerationProgress.ts)
pour l'unique exception documentée : MSW n'intercepte pas les
WebSocket, donc ce composable simule les mêmes événements en mode
démo). L'état est réinitialisé à chaque rechargement de page — ce n'est
pas un stockage persistant.

## Mode connecté (backend + base de données réels)

### 1. Démarrer PostgreSQL et Redis

```bash
pnpm db:up   # docker compose up -d postgres redis
```

Sans Docker disponible, toute installation PostgreSQL 16 locale
convient : ajustez simplement `DATABASE_URL` dans `apps/backend/.env`
en conséquence (c'est ainsi que ce projet a été validé pendant son
développement, dans un environnement sans Docker).

### 2. Configurer les variables d'environnement

```bash
cp .env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Ajustez `apps/backend/.env` si besoin (secrets JWT, etc. — voir les
commentaires du fichier `.env.example` à la racine pour le détail de
chaque variable).

### 3. Appliquer les migrations

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

Crée les tables du cœur produit : `User`, `Plan`, `UserSubscription`,
`Document`, `DocumentVersion`, `GenerationJob`, `Feedback`.

### 4. Lancer le backend et le frontend

```bash
pnpm dev:backend    # NestJS sur http://localhost:3000 (docs Swagger : /api/docs)
pnpm dev:frontend   # Vue sur http://localhost:5173, sans VITE_USE_MOCKS
```

Le frontend en mode connecté utilise exactement le même code que le
mode démonstration (stores Pinia, appels API) — seule l'absence du
flag `VITE_USE_MOCKS=true` change, conformément au principe du cahier
des charges garantissant un contrat d'interface identique entre les
deux modes.

### Vérification rapide (sans interface)

```bash
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" \
  -d '{"email":"test@example.org","motDePasse":"motdepasse123","nom":"Diallo","prenom":"Awa","pays":"SN"}'
```

Doit renvoyer un `accessToken`, un `refreshToken` et le profil créé.

## Documentation

- Documentation API REST auto-générée (Swagger) : `/api/docs` une fois
  le backend démarré.
- Chaque module NestJS a son propre README expliquant sa
  responsabilité, ses dépendances et comment l'étendre — voir
  [apps/backend/README.md](apps/backend/README.md) pour l'index.
- [packages/contracts/README.md](packages/contracts/README.md) et
  [packages/config-gabarits/README.md](packages/config-gabarits/README.md)
  documentent le contrat d'API partagé et les gabarits de documents.

## Règle de cloisonnement entre modules

Un module NestJS ne doit jamais importer directement le `Service`
d'un autre module en contournant son `Module`, ni interroger les
tables Prisma d'un domaine dont il n'est pas responsable. Toute
communication inter-module passe par les providers explicitement
exportés. C'est cette discipline — pas une contrainte technique du
framework — qui permettra d'extraire un jour un module en service
indépendant sans réécriture complète (architecture « monolithe
modulaire évolutif » validée en cadrage).

## Prochaines sessions

Voir le phasage validé (Lot 1 → Lot 8) : la prochaine session
attaquera le module `subscriptions` (grille d'abonnement par palier,
remboursement de quota sur échec définitif de génération — limite
connue documentée dans
[apps/backend/src/modules/generation/README.md](apps/backend/src/modules/generation/README.md)),
suivie des sessions `feedback`, `resources`, `resource-builder`,
`training`, `notifications`, `admin`.
