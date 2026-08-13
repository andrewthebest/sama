import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { SubscriptionMeResponseDto } from "@sama-emi/contracts";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { SubscriptionsService } from "./subscriptions.service";

@ApiTags("subscriptions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get("me")
  @ApiOkResponse({ description: "Abonnement courant de l'utilisateur authentifié (essai ou souscription), avec son plan résolu." })
  async moi(@CurrentUser() user: User): Promise<SubscriptionMeResponseDto> {
    const abonnement = await this.subscriptionsService.trouverAbonnementCourant(user.id);
    return {
      ...this.subscriptionsService.toPublicEntity(abonnement),
      plan: abonnement.plan ? this.subscriptionsService.toPublicPlanEntity(abonnement.plan) : null,
    };
  }
}
