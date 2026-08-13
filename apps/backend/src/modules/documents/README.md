# Module `documents`

## Responsabilité

Persistance des scénarios pédagogiques et parcours de formation générés,
avec historique de versions (`DocumentVersion`) et rattachement à
l'utilisateur qui les a créés. Le module `generation` est seul
responsable de l'écriture (création + ajout de version, via
`DocumentsService`) ; ce module expose la lecture, l'aperçu et
l'export :

- `GET /documents` — documents de l'utilisateur authentifié.
- `GET /documents/:id` — document + version courante (JSON structuré).
- `GET /documents/:id/apercu.html` — aperçu HTML de la version
  courante, pour affichage dans la plateforme.
- `GET /documents/:id/telecharger.docx` — téléchargement du `.docx`.
- `GET /documents/:id/telecharger.pdf` — téléchargement du `.pdf`.

## Assemblage à la demande, jamais au moment de la génération

`DocxAssemblerService` construit un buffer `.docx` (librairie `docx`)
directement depuis le contenu structuré (`ContenuScenario` /
`ContenuParcours`, définis dans `composed-content.types.ts`) déjà
stocké dans `DocumentVersion.contenu`. Cet assemblage a lieu **à
chaque requête d'aperçu ou de téléchargement**, pas une seule fois au
moment de la génération : aucun fichier binaire n'est stocké en base,
et faire évoluer la mise en forme du gabarit (`DocxAssemblerService`)
n'impose pas de régénérer les documents existants.

- **Aperçu HTML** : le `.docx` assemblé est converti en HTML via
  `mammoth` (`mammoth.convertToHtml`), conformément au choix
  d'architecture validé en cadrage (aperçu docx → HTML plutôt qu'un
  lecteur Word embarqué).
- **PDF** : le `.docx` assemblé est converti via **LibreOffice
  headless** (`soffice --headless --convert-to pdf`,
  `libreoffice-converter.service.ts`), décision validée en cadrage.
  **Dépendance système** : le paquet `libreoffice-writer` doit être
  installé (`libreoffice-core` seul ne suffit pas — il ne contient pas
  le composant Writer capable de lire un `.docx`). Voir le README
  racine pour la commande d'installation.

## Dépendances

- `PrismaService` (module global).
- Aucune dépendance vers `generation` : c'est `generation` qui dépend de
  `DocumentsModule`, jamais l'inverse — évite tout cycle entre les deux
  modules. `composed-content.types.ts` vit ici (et non dans
  `generation`) pour la même raison : c'est ce module qui assemble et
  sert le contenu, `generation` ne fait que le produire.

## Comment l'étendre

- Régénération/ajustement d'un document existant : réutiliser
  `DocumentsService.ajouterVersion`, déjà conçu pour empiler les
  versions sans perte d'historique.
- Mise en cache de l'assemblage : si l'assemblage à la demande devient
  coûteux à l'échelle, envisager un cache (par `documentId` +
  `numeroVersion`) plutôt qu'un stockage permanent du binaire.
