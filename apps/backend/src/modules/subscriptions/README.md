# Module `subscriptions`

## Responsabilité

Plans d'abonnement, essais gratuits, et décompte/remboursement de quota
autour d'une génération. Paiement explicitement hors périmètre (cahier
des charges, section 3.3 et dossier d'architecture, Session C) : ce
module gère les entités et la logique de quota, pas de prestataire de
paiement.

- `GET /subscriptions/me` — abonnement courant de l'utilisateur
  authentifié (essai ou souscription), avec son plan résolu.
- `GET /plans` — plans actifs, du moins cher au plus cher.
- `POST /plans`, `PATCH /plans/:id` — création/modification d'un plan,
  réservées aux comptes `ADMINISTRATEUR` (`RolesGuard`). C'est le
  mécanisme visé par « quotas configurables sans déploiement » : ajuster
  une grille tarifaire ne nécessite pas de déploiement, seulement un
  appel API avec un compte administrateur.

## Qui consomme quoi

- `AuthModule` appelle `SubscriptionsService.creerEssaiGratuit(userId)`
  juste après la création du compte — c'est un effet de bord obligatoire
  de l'inscription (cahier des charges, section 3.3 : chaque compte
  démarre avec des essais gratuits).
- `GenerationModule` appelle `SubscriptionsService.consommerQuota(userId)`
  avant de mettre un job en file, et
  `SubscriptionsService.rembourserQuota(subscriptionId, type)` si ce job
  échoue **définitivement** (voir `generation/README.md`).

Aucun des deux modules n'accède plus directement à la table
`UserSubscription` — c'était une dette assumée en Session A/B, en
attendant l'existence de ce module (voir l'historique des README de
`generation`).

## Logique métier non triviale

**Décompte minimal, pas la grille complète.** `consommerQuota` ne
distingue que deux cas : essai gratuit restant (décompté), ou abonnement
`ACTIF` (généra­tions comptabilisées, jamais bloquées). La grille de
quotas par palier (`Plan.quotaScenarios` / `quotaParcours` /
`quotaRessources`) est **posée mais pas encore appliquée** : elle
n'entre pas en compte dans la décision d'autoriser ou non une
génération. L'appliquer réellement (distinguer par type de document,
plafonner par palier plutôt que par essai/illimité) est laissé à une
session ultérieure une fois le premier retour d'usage disponible — cahier
des charges, section 3.3.

**Remboursement, pas un simple “retry gratuit”.** `rembourserQuota` est
strictement symétrique de `consommerQuota` : il incrémente
`essaisGratuitsRestants` si l'échec provenait d'un essai, ou décrémente
`generationsUtilisees` si l'échec provenait d'un abonnement actif — sur
l'abonnement précis qui avait été débité (`subscriptionId`), pas sur
« le dernier abonnement de l'utilisateur », qui pourrait avoir changé
entre-temps. Un job qui **retente** (erreur transitoire, voir
`OPTIONS_JOB_GENERATION`) ne déclenche aucun remboursement intermédiaire
: seul l'échec définitif, une fois toutes les tentatives épuisées,
rembourse.

## Dépendances

- `PrismaService` (module global) — seul module autorisé à écrire dans
  `Plan` et `UserSubscription`.

## Comment l'étendre

- Application réelle de la grille de quotas par palier et par type de
  génération : voir la limite connue ci-dessus.
- Prestataire de paiement, changement de plan en cours de période,
  annulation avec effet différé : hors périmètre de ce module tel que
  cadré (paiement explicitement exclu).
- Tableau de bord d'administration des quotas (au-delà du simple
  `POST`/`PATCH /plans`) : module `admin` (Lot 8).
