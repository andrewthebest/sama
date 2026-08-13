# Module `auth`

## Responsabilité

Inscription (avec pays obligatoire), connexion, émission et rotation des
tokens JWT (access + refresh), déconnexion. Fournit `JwtStrategy`,
consommée par `JwtAuthGuard` (`src/common/guards`) pour protéger les
routes des autres modules.

## Dépendances

- `UsersModule` — lecture/création de `User`, stockage du hash du
  refresh token courant.
- `PrismaService` (module global) — création de l'abonnement d'essai à
  l'inscription.
- Aucun autre module métier ne dépend d'`AuthModule` directement ; ils
  dépendent de `JwtAuthGuard` et `CurrentUser`, tous deux dans
  `src/common`, pour rester découplés de l'implémentation d'auth.

## Logique métier non triviale

**Rotation des refresh tokens.** Chaque appel à `POST /auth/refresh`
invalide l'ancien refresh token (son hash est remplacé en base) même
s'il était encore valide, avant d'en émettre un nouveau. Un refresh
token volé ne peut donc être rejoué qu'une seule fois avant que la
session légitime ne l'invalide au prochain refresh. Le hash (argon2) est
stocké plutôt que le token en clair : une lecture non autorisée de la
base ne suffit pas à usurper une session.

**Essai gratuit à l'inscription.** `AuthService.register` crée
directement un `UserSubscription` avec `essaisGratuitsRestants = 2`
(valeur du cahier des charges, section 3.3). Ce nombre est un point de
départ, pas une constante figée : sa modification ultérieure (grille de
quotas) relève du futur module `subscriptions` (Lot 2), qui lira/écrira
ce même modèle Prisma.

## Comment l'étendre

- Vérification d'email et réinitialisation de mot de passe (mentionnées
  au cahier des charges, non couvertes en Session A) : ajouter des DTO
  et endpoints dédiés dans ce module, en réutilisant `UsersService`.
- Connexion via fournisseur tiers (OAuth) : ajouter une stratégie
  Passport supplémentaire sans toucher à `JwtStrategy`.
