import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

/**
 * Module `users` — profils et accès aux comptes.
 * Exporte `UsersService`, seul point d'entrée que les autres modules
 * (notamment `auth`) doivent utiliser pour lire ou modifier un `User`.
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
