/**
 * Origine de la quota consommée par une génération : essai gratuit ou
 * abonnement actif. Conservée avec le job de génération pour permettre
 * un remboursement exact (`SubscriptionsService.rembourserQuota`) si la
 * génération échoue définitivement — voir `generation.processor.ts`.
 */
export type TypeConsommationQuota = "ESSAI" | "ABONNEMENT";
