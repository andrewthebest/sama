# Module `resources`

## Responsabilité

Banque de ressources communautaire (cahier des charges, section 10) :
soumission, désignation de modérateurs, modération à quorum, publication,
signalement. Le contenu géré ici (`Resource.contenu`) est du texte libre
ou une URL selon `type` — l'éditeur multi-format riche (panneau HTML
interactif autonome, scripts vidéo structurés, fiches pédagogiques avec
mise en page…) est le module `resource-builder` (Lot 6), hors périmètre
de cette session.

## Cycle de vie d'une ressource

```
EN_ATTENTE --(3 modérateurs désignés)--> EN_EXAMEN
EN_ATTENTE --(< 3 modérateurs actifs)--> EN_ATTENTE
EN_EXAMEN --(2e vote « valider »)--> PUBLIEE
EN_EXAMEN --(2e vote « rejeter »)--> REJETEE
PUBLIEE --(signalement utilisateur)--> SIGNALEE
```

- `POST /resources` — soumet une ressource. Tente immédiatement une
  désignation de 3 modérateurs disponibles (voir ci-dessous).
- `GET /resources` — ressources `PUBLIEE`, filtrables par `pays` et
  `type`.
- `GET /resources/mes` — mes soumissions, tous statuts confondus.
- `GET /resources/:id` — détail, avec contrôle de visibilité (voir
  « Logique métier non triviale »).
- `GET /resources/moderation/file` — ressources `EN_EXAMEN` désignées
  au modérateur authentifié, sur lesquelles il n'a pas encore voté
  (réservé `MODERATEUR`/`ADMINISTRATEUR`).
- `POST /resources/:id/vote` — vote d'un modérateur désigné (réservé
  `MODERATEUR`/`ADMINISTRATEUR`).
- `POST /resources/:id/signaler` — signale une ressource publiée.
- `POST /resources/relancer-assignations` — relance l'assignation de
  toutes les ressources `EN_ATTENTE` (voir « Limite connue »).

Un compte `MODERATEUR` bascule sa disponibilité via
`PATCH /users/me/disponibilite-moderation` (module `users`).

## Logique métier non triviale

**Désignation par ordre de disponibilité.** `UsersService.trouverModerateursDisponibles`
sélectionne jusqu'à 3 comptes `MODERATEUR` avec
`disponiblePourModeration = true`, triés par
`derniereAssignationModeration` croissant (jamais assigné en premier) —
une rotation équitable plutôt qu'un tirage arbitraire, pour éviter que
les mêmes modérateurs disponibles soient systématiquement sollicités.
Être désigné ne retire pas la disponibilité : un modérateur reste
éligible à d'autres désignations, seule la priorité de sélection change.

**Vote en aveugle.** Aucun endpoint ne révèle à un modérateur les votes
de ses pairs avant la résolution de la ressource (`PUBLIEE`/`REJETEE`) :
`GET /resources/moderation/file` n'expose que les ressources sur
lesquelles l'appelant n'a pas encore voté, jamais le contenu des
`ResourceReview` existantes. La résolution est immédiate dès qu'un
camp atteint 2 votes — le 3ᵉ avis, s'il est exprimé, n'a plus d'effet
(mais reste rejeté par le contrôle de statut `EN_EXAMEN`, puisque la
ressource a déjà basculé).

**Chaque vote est une ligne, jamais un champ plat.** `ResourceReview` a
une contrainte d'unicité `(resourceId, moderatorId)` : un modérateur ne
peut voter qu'une fois par ressource. Cette table est la source de
vérité du quorum, pas un compteur dénormalisé sur `Resource`.

## Limite connue

**Pas de relance automatique de l'assignation.** Une ressource
`EN_ATTENTE` (moins de 3 modérateurs disponibles au moment de la
soumission) ne repasse jamais automatiquement en `EN_EXAMEN` quand un
modérateur devient disponible ensuite — il faut appeler
`POST /resources/relancer-assignations` manuellement. Un déclenchement
automatique (à l'activation d'un modérateur, ou via une tâche planifiée)
est laissé à une session ultérieure ; il aurait exigé soit que
`UsersModule` dépende de `ResourcesModule` (sens interdit par la règle
de cloisonnement), soit un mécanisme d'événements transverses qui
n'existe pas encore dans le monolithe.

**Motif de signalement non tracé.** `POST /resources/:id/signaler`
accepte un `motif` (contrat `ReportResourceRequestDto`) mais ne le
persiste pas encore — seuls le statut et un compteur `signalements`
sont mis à jour. Une entité `ResourceReport` dédiée (motif, auteur du
signalement, date) serait nécessaire pour la traçabilité complète,
mais n'est pas dans la liste des entités du Lot 5 validée en cadrage.

## Dépendances

- `UsersModule` — désignation de modérateurs disponibles. Aucun accès
  direct à la table `User` depuis ce module.
- `PrismaService` (module global) — seul module autorisé à écrire dans
  `Resource` et `ResourceReview`.

## Comment l'étendre

- Éditeur multi-format riche du contenu : module `resource-builder`
  (Lot 6).
- Traçabilité des signalements (motif, auteur) : voir « Limite connue »
  ci-dessus.
- Relance automatique de l'assignation : voir « Limite connue »
  ci-dessus — envisager un événement `moderateur.devenu_disponible`
  une fois un bus d'événements transverse introduit.
- Tableau de bord de modération (vue d'ensemble, métriques) : module
  `admin` (Lot 8).
