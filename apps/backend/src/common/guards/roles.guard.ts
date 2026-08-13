import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { User } from "@prisma/client";
import { Role } from "@sama-emi/contracts";
import { ROLES_KEY } from "../decorators/roles.decorator";

/**
 * Garde de rôle — à appliquer après `JwtAuthGuard` (dont elle dépend
 * pour `request.user`). Utilisée pour les quelques endpoints
 * d'administration déjà nécessaires (ex. gestion des plans
 * d'abonnement) avant que le module `admin` dédié n'existe (Lot 8).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequis = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!rolesRequis || rolesRequis.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<{ user: User }>();
    if (!rolesRequis.includes(user.role as Role)) {
      throw new ForbiddenException("Accès réservé aux administrateurs.");
    }
    return true;
  }
}
