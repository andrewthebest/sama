# Module `documents`

## Responsabilité

Persistance des scénarios pédagogiques et parcours de formation générés,
avec historique de versions (`DocumentVersion`) et rattachement à
l'utilisateur qui les a créés. En Session A, expose la lecture
(`GET /documents`, `GET /documents/:id`) ; le module `generation` est
seul responsable de l'écriture (création + ajout de version).

## Dépendances

- `PrismaService` (module global).
- Aucune dépendance vers `generation` : c'est `generation` qui dépend de
  `DocumentsModule`, jamais l'inverse — évite tout cycle entre les deux
  modules.

## Comment l'étendre

- Téléchargement `.docx`/`.pdf` : ajouter des endpoints
  `GET /documents/:id/export.docx` et `.pdf` en Session B, en
  s'appuyant sur `versionCourante.contenu` et les gabarits de
  `@sama-emi/config-gabarits` pour l'assemblage.
- Régénération/ajustement d'un document existant : réutiliser
  `DocumentsService.ajouterVersion`, déjà conçu pour empiler les
  versions sans perte d'historique.
