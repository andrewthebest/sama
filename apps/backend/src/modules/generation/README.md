# Module `generation`

## Responsabilité

Cœur du moteur : reçoit une demande de génération (scénario ou parcours),
gère le choix entre thématique REFEMI (sélecteur en cascade) et
thématique personnalisée, appelle l'API Anthropic pour produire le
contenu structuré, suit la progression via WebSocket, et persiste le
résultat via `DocumentsModule`. L'assemblage `.docx`/PDF et l'aperçu
HTML sont hors périmètre de ce module — voir `DocumentsModule`.

## Flux réel (Session B)

1. `GenerationController.lancer` vérifie le quota, crée le `Document`
   « coquille » et son `GenerationJob` (statut `EN_FILE`), puis met un
   job en file **BullMQ** (`GenerationService.lancerGeneration`).
2. `GenerationProcessor`, abonné à la file `generation`, dépile le job
   et exécute le travail réel :
   - `AnthropicGenerationClient.genererContenu` — appelle Claude avec
     un **tool use forcé** (`tool_choice`), dont le schéma
     (`anthropic-tool-schema.ts`) reflète exactement la structure du
     gabarit. Claude ne rédige jamais de texte libre : il remplit ce
     schéma, section par section, ligne de déroulé par ligne de
     déroulé (avec `modeApprentissage` contraint à l'énumération
     fermée). Les blocs fixes (Gestes professionnels…) ne figurent
     **pas** dans le schéma — impossible pour l'IA de les produire ou
     de les reformuler.
   - `ContentComposerService.composer` fusionne cette sortie avec les
     blocs fixes lus depuis `@sama-emi/config-gabarits` (jamais
     générés par l'IA) pour produire le contenu final
     (`ContenuScenario` / `ContenuParcours`, définis dans
     `documents/composed-content.types.ts`).
   - Ce contenu est persisté comme nouvelle `DocumentVersion` via
     `DocumentsService.ajouterVersion`.
3. À chaque étape (`CADRAGE_RECU → GENERATION_CONTENU → MISE_EN_FORME
   → FINALISATION`), `GenerationGateway.emettreProgression` diffuse
   l'avancement sur le WebSocket — le contrôleur, le DTO et la gateway
   n'ont pas changé depuis le squelette de la Session A.

Le `.docx`/`.pdf` et l'aperçu HTML ne sont **pas** générés à cette
étape : ils sont assemblés à la demande, au moment du téléchargement,
à partir du contenu structuré déjà stocké — voir
`DocumentsModule` (`docx-assembler.service.ts`).

## File d'attente et nouvelles tentatives

La file BullMQ `generation` (voir `generation.types.ts`,
`OPTIONS_JOB_GENERATION`) retente automatiquement un job en échec
**transitoire** (limite de débit, erreur 5xx, coupure réseau) avec un
backoff exponentiel (3 tentatives : 5 s, 20 s, 80 s). C'est
`AnthropicGenerationClient` qui classifie l'erreur
(`AnthropicGenerationError.retryable`) : une erreur non transitoire
(clé API absente, requête invalide, refus de sécurité) est détectée
par `GenerationProcessor`, qui marque immédiatement le job `ECHOUE` en
base et diffuse l'erreur sur le WebSocket, sans consommer les
tentatives restantes sur une requête vouée au même échec.

## Dépendances

- `DocumentsModule` — création du document et de ses versions.
- `SubscriptionsModule` — `SubscriptionsService.consommerQuota` avant la
  mise en file (voir « Logique métier non triviale » ci-dessous) et
  `SubscriptionsService.rembourserQuota` sur échec définitif. Ce module
  n'accède plus directement à la table `UserSubscription` depuis la
  Session C — voir `subscriptions/README.md`.
- `ANTHROPIC_API_KEY` (variable d'environnement) — sans elle,
  `AnthropicGenerationClient` échoue immédiatement et de façon non
  transitoire dès le premier job (message d'erreur explicite dans
  `GenerationJob.erreur`), sans bloquer le démarrage du serveur.

## Logique métier non triviale

**Vérification de quota.** `SubscriptionsService.consommerQuota` lit le
dernier `UserSubscription` de l'utilisateur : si un essai gratuit reste
disponible, il est décompté ; si l'abonnement est `ACTIF`, la
génération est autorisée et comptabilisée ; sinon la requête est
rejetée (`403`). C'est une version volontairement minimale de la
politique de quota — la grille par palier, la distinction par type de
génération et les achats à l'unité sont hors périmètre de cette
session (voir cahier des charges, section 3.3, et
`subscriptions/README.md`). L'identifiant de l'abonnement débité et
l'origine de la consommation (`subscriptionId`/`typeConsommationQuota`)
voyagent avec le job BullMQ (`DonneesJobGeneration`) pour permettre un
remboursement exact si la génération échoue définitivement —
`GenerationProcessor.gererErreur` l'appelle avant de marquer le job
`ECHOUE`, ce qui referme la limite connue documentée jusqu'à la Session
B (le quota n'était alors jamais restitué).

**Tool use forcé plutôt que prompt libre.** `tool_choice` force
l'appel de l'unique outil déclaré (`rediger_scenario` ou
`rediger_parcours`), avec `thinking: {type: "disabled"}` à l'effort
`high` : cette génération est un remplissage de schéma en un seul
appel, pas un raisonnement agentique multi-étapes.

## Parcours multi-jours

Le schéma `rediger_parcours` et `ContentComposerService.composerParcours`
gèrent `architectureParcours` (vue d'ensemble par module) et
`derouleParJour` (un tableau de déroulé par journée) depuis leur
création en Session B. La chaîne complète (composition → assemblage
`.docx` → aperçu `mammoth` → export PDF LibreOffice) a été vérifiée en
Session D avec un contenu de parcours fabriqué à la main sur 3 jours :
le document assemblé contient bien un tableau d'architecture et un
tableau de déroulé par jour (4 tableaux au total), sans troncature ni
erreur de conversion. Ajuster
`AnthropicGenerationClient.calculerMaxTokens` si des parcours plus
longs que ~8 jours sont nécessaires (l'appel Anthropic réel, lui, n'a
pas pu être testé dans cet environnement sans `ANTHROPIC_API_KEY`).

## Comment l'étendre

- Application réelle de la grille de quotas par palier
  (`Plan.quotaScenarios`/`quotaParcours`/`quotaRessources`) : voir la
  limite connue équivalente dans `subscriptions/README.md`.
