import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

/**
 * Module `auth` — inscription, connexion, rotation de refresh tokens.
 * `JwtModule.register({})` est laissé vide à dessein : chaque émission
 * de token précise explicitement son secret et sa durée de vie
 * (access vs refresh) dans `AuthService`, plutôt que de dépendre d'une
 * configuration globale unique qui ne distinguerait pas les deux.
 */
@Module({
  imports: [PassportModule, JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
