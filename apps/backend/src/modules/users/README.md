# Module `users`

## Responsabilité

Profil utilisateur et point d'accès unique à la table `User` pour le
reste de l'application. En Session A, expose uniquement `GET /users/me`
pour valider le flux d'authentification ; l'édition de profil et les
préférences (langue, organisation) suivront.

## Dépendances

- `PrismaService` (module global `PrismaModule`).
- Aucune dépendance vers un autre module métier : `users` est une feuille
  du graphe de modules, ce qui permet à `auth`, `generation` et
  `documents` de tous en dépendre sans risque de cycle.

## Comment l'étendre

- Ajouter l'édition de profil (`PATCH /users/me`) avec un DTO validé par
  `class-validator`, en réutilisant `UsersService.toPublicEntity` pour la
  sérialisation de réponse.
- Les préférences avancées (organisation, rôle EMI) sont déjà en base
  (voir `prisma/schema.prisma`, modèle `User`) ; il ne manque qu'un
  endpoint de mise à jour.
