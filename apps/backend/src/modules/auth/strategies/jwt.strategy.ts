import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { User } from "@prisma/client";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../../users/users.service";
import { JwtPayload } from "../jwt-payload.interface";

/**
 * Stratégie Passport validant l'access token JWT présenté dans l'en-tête
 * `Authorization: Bearer`. Recharge l'utilisateur depuis la base à chaque
 * requête (plutôt que de faire confiance aveuglément au contenu du
 * payload) afin de refléter immédiatement une désactivation de compte ou
 * un changement de rôle décidé côté administration.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("Utilisateur introuvable ou désactivé.");
    }
    return user;
  }
}
