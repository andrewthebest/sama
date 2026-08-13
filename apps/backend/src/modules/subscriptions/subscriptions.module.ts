import { Module } from "@nestjs/common";
import { PlansController } from "./plans.controller";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsService } from "./subscriptions.service";

/**
 * Module `subscriptions` — plans d'abonnement, essais gratuits,
 * décompte et remboursement de quota. Exporte `SubscriptionsService`,
 * seul point d'entrée que `auth` (création de l'essai à l'inscription)
 * et `generation` (décompte/remboursement autour d'une génération)
 * doivent utiliser ; aucun des deux ne touche plus directement la table
 * `UserSubscription`.
 */
@Module({
  controllers: [SubscriptionsController, PlansController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
