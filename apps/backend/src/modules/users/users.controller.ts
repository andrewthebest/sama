import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { UserEntity } from "@sama-emi/contracts";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
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
}
