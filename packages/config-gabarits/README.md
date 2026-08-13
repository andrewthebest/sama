# @sama-emi/config-gabarits

Gabarits de documents (scénario pédagogique, parcours de formation) et
blocs de texte fixes, stockés en JSON versionné — jamais codés en dur
dans le moteur de génération.

## Responsabilité

- `src/gabarits/scenario.json` — structure des 9 sections du scénario
  pédagogique (cahier des charges, section 6.1).
- `src/gabarits/parcours.json` — structure du parcours de formation
  multi-modules (section 6.2), qui reprend le gabarit scénario et y ajoute
  l'architecture par module et le déroulé répété par journée.
- `src/gabarits/blocs-fixes.json` — textes invariants, notamment
  l'encadré **« Gestes professionnels du formateur »**, qui doit être
  identique dans tout document généré et n'est jamais soumis à l'IA.
- `src/gabarits/modes-apprentissage.json` — liste fermée des valeurs
  autorisées pour la colonne « Mode d'apprentissage ».
- `src/loader.ts` — lecture de ces fichiers **depuis le disque à
  l'exécution** (et non via un `import` statique), pour qu'un ajustement
  de gabarit ne demande qu'un redémarrage du processus, jamais une
  recompilation ou un redéploiement.

## Comment l'étendre

1. Éditer le fichier JSON concerné (ajouter une section, changer une
   règle, ajuster un texte fixe).
2. Si la forme change de façon structurelle, mettre à jour
   `src/types.ts` en conséquence.
3. Redémarrer le processus backend — aucune modification de code
   applicatif n'est nécessaire pour un ajustement de contenu.

## Build

Ce paquet est compilé (`pnpm build`, ou automatiquement via le hook
`postinstall` racine) plutôt que consommé en TypeScript source : NestJS
(via `ts-node`) ne transpile pas les fichiers résolus dans
`node_modules`, y compris les paquets de ce workspace pnpm. Le build
copie aussi les fichiers `src/gabarits/*.json` vers `dist/gabarits/`,
inchangés — c'est cette copie que `loader.ts` lit à l'exécution.

Éditer un gabarit signifie donc éditer le fichier sous `src/gabarits/`
puis relancer `pnpm --filter @sama-emi/config-gabarits build` (une
simple recopie de JSON, quelques millisecondes) et redémarrer le
processus backend — jamais recompiler ni redéployer l'application dans
son ensemble, et jamais toucher au code TypeScript métier.

## Dépendance à sens unique

Le chargeur (`./loader`) utilise `__dirname` et n'a de sens qu'en
environnement Node.js (backend). Il n'est consommé que par le backend
en Session A ; si le frontend importe un jour ce paquet, séparer les
points d'entrée (types vs loader) pour éviter qu'un bundler navigateur
n'embarque `loader.ts` par erreur.
