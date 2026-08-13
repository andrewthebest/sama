# @sama-emi/backend

Monolithe modulaire NestJS de SAMA EMI.

## Modules présents (Sessions A-E)

| Module | Rôle | README |
|---|---|---|
| `auth` | Inscription (pays obligatoire), connexion, JWT + refresh rotatif | [src/modules/auth](src/modules/auth/README.md) |
| `users` | Profil utilisateur (`GET /users/me`), disponibilité de modération | [src/modules/users](src/modules/users/README.md) |
| `documents` | Persistance des scénarios/parcours, historique de versions, aperçu HTML et export `.docx`/`.pdf` | [src/modules/documents](src/modules/documents/README.md) |
| `subscriptions` | Plans, essai gratuit, décompte et remboursement de quota | [src/modules/subscriptions](src/modules/subscriptions/README.md) |
| `generation` | Cœur du moteur — appel Anthropic (tool use), file BullMQ + Redis, scénario et parcours multi-jours | [src/modules/generation](src/modules/generation/README.md) |
| `feedback` | Retours de session rattachés à un document généré, vue agrégée par utilisateur | [src/modules/feedback](src/modules/feedback/README.md) |
| `resources` | Banque de ressources communautaire — soumission, quorum de modération à vote aveugle, publication, signalement | [src/modules/resources](src/modules/resources/README.md) |

Quatre autres modules du cahier des charges (`resource-builder`,
`training`, `notifications`, `admin`) rejoindront `app.module.ts` à
leurs sessions respectives (voir le phasage validé lors du cadrage).

## Commandes

Voir le README racine du monorepo pour la procédure complète
(installation, base de données, migrations). En résumé, depuis
`apps/backend/` ou via les scripts racine :

```bash
pnpm prisma:generate     # génère le client Prisma
pnpm prisma:migrate      # applique les migrations en développement
pnpm --filter @sama-emi/backend start:dev
```

La documentation Swagger de l'API est servie sur `/api/docs` une fois le
serveur démarré.

## Tests

```bash
pnpm --filter @sama-emi/backend test          # une fois
pnpm --filter @sama-emi/backend test -- --watch
```

Tests unitaires **Jest** (`*.spec.ts`, colocalisés avec le code
qu'ils testent) — `PrismaService` et les autres dépendances sont
mockées (`jest.fn()`), aucune base de données ni file Redis n'est
nécessaire pour les lancer. Aucune suite `e2e` (supertest + base de
test) n'existe encore — voir « Ce qui manque encore » ci-dessous.

Périmètre couvert, en priorité sur la « logique métier non triviale »
documentée dans chaque README de module :

| Suite | Ce qui est vérifié |
|---|---|
| `common/guards/roles.guard.spec.ts` | Autorisation/refus selon le rôle, endpoint non protégé |
| `subscriptions/subscriptions.service.spec.ts` | `consommerQuota` (essai/actif/épuisé), `rembourserQuota` (symétrie exacte) |
| `users/users.service.spec.ts` | Requête de sélection des modérateurs disponibles (tri par ancienneté), marquage d'assignation |
| `resources/resources.service.spec.ts` | Assignation de modérateurs, quorum de vote (résolution au 2ᵉ avis, vote dupliqué/hors-statut rejeté), signalement, règles de visibilité |
| `generation/generation.service.spec.ts` | Décompte de quota avant mise en file, données transmises au job BullMQ |
| `generation/generation.processor.spec.ts` | Succès, erreur transitoire (retry sans remboursement), erreur définitive (remboursement + `ECHOUE`), dernière tentative transitoire traitée comme définitive |
| `generation/anthropic-generation.client.spec.ts` | Clé API absente, classification des erreurs SDK (transitoire/définitive), calcul des tokens max, refus du modèle |
| `generation/content-composer.service.spec.ts` | Les blocs fixes ne peuvent jamais être écrasés par la sortie de l'IA, citation REFEMI vs personnalisée |
| `feedback/feedback.service.spec.ts` | Vérification de propriété avant écriture/lecture, calcul de moyenne (y compris cas vide) |

**Non couvert intentionnellement** (voir la note dans
`anthropic-generation.client.spec.ts`) : l'appel HTTP réel au SDK
Anthropic (`messages.stream`) n'est testé qu'à travers un mock du
module `@anthropic-ai/sdk` pour les scénarios de classification
d'erreur — jamais contre l'API réelle, pour ne pas rendre la suite
dépendante d'une clé/du réseau/de crédit API.

## Ce qui manque encore

- Tests e2e (supertest + base de données de test dédiée, migrations
  avant suite, nettoyage entre tests) — valideraient les contrôleurs,
  les guards en conditions réelles et le cycle de vie HTTP complet,
  complémentaires aux tests unitaires actuels.
- Tests pour `DocxAssemblerService`/`LibreOfficeConverterService`
  (vérifiés manuellement en Session B/D avec un contenu fabriqué à la
  main, jamais avec une assertion automatisée sur le buffer produit).
- Couverture de code non mesurée/exigée (`collectCoverageFrom` est
  configuré mais aucun seuil minimal n'est imposé).

## Règle de cloisonnement entre modules

Un module ne doit jamais importer le `Service` d'un autre module en
contournant son `Module` (pas de `providers: [DocumentsService]` en
dehors de `DocumentsModule`), ni interroger directement les tables
Prisma d'un domaine dont il n'est pas responsable. Toute communication
inter-module passe par les providers exportés par le `Module`
correspondant. C'est cette discipline qui permettra d'extraire un jour
un module en service indépendant sans réécriture.
