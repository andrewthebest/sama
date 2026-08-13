import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { PlanEntity, Role } from "@sama-emi/contracts";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { SubscriptionsService } from "./subscriptions.service";

/**
 * Grille de plans d'abonnement. Lecture ouverte à tout compte
 * authentifié (nécessaire pour afficher les offres) ; création et
 * modification réservées aux administrateurs — c'est le mécanisme visé
 * par « quotas configurables sans déploiement » (cahier des charges,
 * section 3.3), en attendant le tableau de bord dédié du module `admin`
 * (Lot 8).
 */
@ApiTags("subscriptions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("plans")
export class PlansController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOkResponse({ description: "Plans d'abonnement actifs, du moins cher au plus cher." })
  async lister(): Promise<PlanEntity[]> {
    const plans = await this.subscriptionsService.listerPlansActifs();
    return plans.map((p) => this.subscriptionsService.toPublicPlanEntity(p));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR)
  @ApiCreatedResponse({ description: "Crée un nouveau plan d'abonnement." })
  async creer(@Body() dto: CreatePlanDto): Promise<PlanEntity> {
    const plan = await this.subscriptionsService.creerPlan(dto);
    return this.subscriptionsService.toPublicPlanEntity(plan);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR)
  @ApiOkResponse({ description: "Modifie un plan d'abonnement existant (ex. ajuster ses quotas ou le désactiver)." })
  async modifier(@Param("id") id: string, @Body() dto: UpdatePlanDto): Promise<PlanEntity> {
    const plan = await this.subscriptionsService.modifierPlan(id, dto);
    return this.subscriptionsService.toPublicPlanEntity(plan);
  }
}
