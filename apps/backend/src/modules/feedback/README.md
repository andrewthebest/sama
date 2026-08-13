# Module `feedback`

## Responsabilité

Retours de session laissés par un formateur sur un document généré
(scénario ou parcours), traçables par document et par utilisateur
(cahier des charges, section 3.5).

- `POST /documents/:documentId/feedback` — enregistre un retour (note
  1-5, commentaire, durée réelle vs prévue, champs structurés libres).
- `GET /documents/:documentId/feedback` — retours de ce document, du
  plus récent au plus ancien.
- `GET /feedback/me` — vue agrégée des retours donnés par l'utilisateur
  authentifié, tous documents confondus (nombre, note moyenne,
  historique complet).

## Logique métier non triviale

**Un retour de session appartient à celui qui a généré le document.**
`creerFeedback` et `listerParDocument` appellent tous deux
`DocumentsService.findOneForUser(documentId, userId)` avant toute
opération — la même vérification de propriété que la consultation d'un
document (404 si le document n'existe pas, 403 s'il appartient à
quelqu'un d'autre). Il n'existe pas de retour « anonyme » ni de retour
sur le document d'un tiers : un compte ne peut évaluer que ses propres
générations.

**Plusieurs retours par document sont autorisés.** Le modèle n'impose
pas l'unicité (documentId, userId) : un formateur peut laisser un
retour « à chaud » puis un autre après usage réel en salle. L'agrégation
(`GET /feedback/me`) traite chaque ligne indépendamment plutôt que de
supposer un retour unique par document.

## Dépendances

- `DocumentsModule` — vérification de propriété du document (voir
  ci-dessus). Aucun accès direct à la table `Document` depuis ce
  module.
- `PrismaService` (module global) — seul module autorisé à écrire dans
  `Feedback`.

## Comment l'étendre

- Vue agrégée par document pour un modérateur/administrateur (moyenne,
  volumétrie) : hors périmètre actuel, réservé au futur module `admin`
  (Lot 8).
- Rattachement des retours à la mini-formation (module `training`,
  Lot 7) : le champ `champsStructures` (JSON libre) est prévu pour
  absorber ce type d'extension sans migration de schéma.
