import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { ResourcesController } from "./resources.controller";
import { ResourcesService } from "./resources.service";

/**
 * Module `resources` — banque de ressources communautaire (Lot 5).
 * Dépend de `UsersModule` pour désigner des modérateurs disponibles
 * (`UsersService.trouverModerateursDisponibles`) sans jamais interroger
 * directement la table `User`.
 */
@Module({
  imports: [UsersModule],
  controllers: [ResourcesController],
  providers: [ResourcesService],
})
export class ResourcesModule {}
