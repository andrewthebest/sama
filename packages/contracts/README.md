# @sama-emi/contracts

Source unique de vérité pour la forme des échanges API entre le backend
NestJS, le frontend Vue et les mocks MSW du mode démonstration.

## Responsabilité

- Enums du domaine (`enums.ts`) : rôles, types de document, étapes de
  génération, mode d'apprentissage, etc.
- Formes des entités telles que sérialisées en JSON par l'API (`entities.ts`).
- DTO de requête/réponse par module (`dto-*.ts`).

## Pourquoi ce paquet existe

Le cahier des charges impose que le mode démonstration (fixtures + MSW) et
le mode connecté (API NestJS réelle) partagent un code frontend strictement
identique. Cela n'est possible que si la forme des requêtes/réponses est
fixée à un seul endroit et importée partout : ce paquet est cet endroit.

Le schéma Prisma du backend (`apps/backend/prisma/schema.prisma`) est la
source de vérité pour la *persistance* (contraintes, index, relations) ;
ce paquet est la source de vérité pour le *contrat réseau*. Prisma ne
permet pas d'importer un enum TypeScript externe dans son schéma — les
enums Prisma dupliquent donc volontairement les valeurs définies ici.
Toute évolution d'un enum doit être répercutée aux deux endroits.

## Comment l'étendre

1. Ajouter/modifier un type dans `entities.ts` ou `enums.ts`.
2. Répercuter le changement dans `apps/backend/prisma/schema.prisma` si la
   forme persistée change, puis générer une migration.
3. Mettre à jour les fixtures MSW concernées
   (`apps/frontend/src/mocks/fixtures`) pour qu'elles restent conformes.
4. Reconstruire ce paquet (`pnpm --filter @sama-emi/contracts build`,
   ou `pnpm build:packages` depuis la racine) pour que le backend (via
   `ts-node`, qui ne transpile pas les paquets résolus dans
   `node_modules`) et le frontend voient la nouvelle définition.
