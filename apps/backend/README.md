# @sama-emi/backend

Monolithe modulaire NestJS de SAMA EMI.

## Modules présents (Sessions A-C)

| Module | Rôle | README |
|---|---|---|
| `auth` | Inscription (pays obligatoire), connexion, JWT + refresh rotatif | [src/modules/auth](src/modules/auth/README.md) |
| `users` | Profil utilisateur (`GET /users/me`) | [src/modules/users](src/modules/users/README.md) |
| `documents` | Persistance des scénarios/parcours, historique de versions, aperçu HTML et export `.docx`/`.pdf` | [src/modules/documents](src/modules/documents/README.md) |
| `subscriptions` | Plans, essai gratuit, décompte et remboursement de quota | [src/modules/subscriptions](src/modules/subscriptions/README.md) |
| `generation` | Cœur du moteur — appel Anthropic (tool use), file BullMQ + Redis | [src/modules/generation](src/modules/generation/README.md) |

Six autres modules du cahier des charges (`feedback`, `resources`,
`resource-builder`, `training`, `notifications`, `admin`) rejoindront
`app.module.ts` à leurs sessions respectives (voir le phasage validé
lors du cadrage).

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

## Règle de cloisonnement entre modules

Un module ne doit jamais importer le `Service` d'un autre module en
contournant son `Module` (pas de `providers: [DocumentsService]` en
dehors de `DocumentsModule`), ni interroger directement les tables
Prisma d'un domaine dont il n'est pas responsable. Toute communication
inter-module passe par les providers exportés par le `Module`
correspondant. C'est cette discipline qui permettra d'extraire un jour
un module en service indépendant sans réécriture.
