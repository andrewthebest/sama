import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { Role, UserEntity } from "@sama-emi/contracts";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SetModerationAvailabilityDto } from "./dto/set-moderation-availability.dto";
import { UsersService } from "./users.service";

/**
 * Endpoints exposant le profil de l'utilisateur authentifié.
 * La gestion complète du profil (édition, préférences) est hors périmètre
 * de la Session A ; seul `GET /users/me` est exposé pour valider le flux
 * d'authentification de bout en bout côté frontend.
 */
@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get("me")
  @ApiOkResponse({ description: "Profil de l'utilisateur authentifié." })
  me(@CurrentUser() user: User): UserEntity {
    return this.usersService.toPublicEntity(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR)
  @Patch("me/disponibilite-moderation")
  @ApiOkResponse({ description: "Bascule la disponibilité du compte MODERATEUR pour être désigné sur de nouvelles ressources." })
  async definirDisponibilite(@CurrentUser() user: User, @Body() dto: SetModerationAvailabilityDto): Promise<UserEntity> {
    const misAJour = await this.usersService.definirDisponibiliteModeration(user.id, dto.disponible);
    return this.usersService.toPublicEntity(misAJour);
  }
}
