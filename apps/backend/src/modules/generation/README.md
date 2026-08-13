# Module `generation`

## Responsabilité

Cœur du moteur : reçoit une demande de génération (scénario ou parcours),
gère le choix entre thématique REFEMI (sélecteur en cascade) et
thématique personnalisée, orchestre la production du document, suit la
progression via WebSocket, et persiste le résultat via `DocumentsModule`.

## État en Session A — squelette avec mock de réponse

`POST /generations` et le namespace WebSocket `/generation` sont
pleinement fonctionnels, mais `GenerationService.demarrerSimulation`
**ne contacte pas l'API Anthropic**. Elle simule les 4 étapes du cahier
des charges (`CADRAGE_RECU → GENERATION_CONTENU → MISE_EN_FORME →
FINALISATION`) avec des délais fixes (`generation.types.ts`), diffuse
chaque changement d'étape via `GenerationGateway`, puis construit un
contenu de document *structurellement fidèle* au gabarit réel (via
`MockContentBuilder`, qui lit les mêmes fichiers JSON que le futur
moteur réel) mais avec des textes d'espace réservé.

Ce choix permet de valider tout le flux de bout en bout — file d'attente,
progression temps réel, persistance, aperçu — avant d'introduire la
dépendance réseau et le coût de l'API Anthropic.

## Point de branchement pour la Session B

Un seul endroit change pour passer au moteur réel :
`GenerationService.demarrerSimulation`. Remplacer l'appel à
`MockContentBuilder.construire` par un appel à `@anthropic-ai/sdk` avec
*tool use* (schéma dérivé du gabarit, comme documenté dans
`@sama-emi/config-gabarits`), tout en conservant les mêmes émissions
`gateway.emettreProgression` aux mêmes moments. Le contrôleur, le
DTO, la gateway et `DocumentsService` ne changent pas.

À ajouter à cette occasion : file d'attente **BullMQ + Redis** (décision
validée en cadrage) pour la limitation de débit et les nouvelles
tentatives sur erreur transitoire de l'API Anthropic — la simulation
actuelle utilise un simple `setTimeout` en mémoire, suffisant pour un
squelette mais pas pour une charge de production.

## Dépendances

- `DocumentsModule` — création du document et de ses versions.
- Accès direct et minimal à `UserSubscription` (Prisma) pour la
  vérification de quota — voir « Logique métier non triviale »
  ci-dessous. Cet accès sera retiré au profit de `SubscriptionsModule`
  dès que celui-ci existera (Lot 2).

## Logique métier non triviale

**Vérification de quota.** `verifierEtReserverQuota` lit le dernier
`UserSubscription` de l'utilisateur : si un essai gratuit reste
disponible, il est décompté ; si l'abonnement est `ACTIF`, la
génération est autorisée et comptabilisée ; sinon la requête est
rejetée (`403`). C'est une version volontairement minimale de la
politique de quota — la grille par palier, la distinction par type de
génération et les achats à l'unité sont hors périmètre de cette
session (voir cahier des charges, section 3.3, et le dossier
d'architecture, section 7b).

## Comment l'étendre

- Retries et limitation de débit : encapsuler l'appel Anthropic dans une
  file BullMQ (`@nestjs/bullmq`) avec une stratégie de backoff
  exponentiel.
- Génération de parcours multi-jours : `MockContentBuilder` lit déjà le
  bon gabarit (`chargerGabaritParcours`) selon `dto.type` ; le vrai
  moteur devra boucler sur `dto.nombreJours` pour le déroulé par jour.
