import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "@prisma/client";

/**
 * Injecte l'utilisateur authentifié (résolu par `JwtStrategy.validate`)
 * dans un paramètre de contrôleur. Doit être utilisé sur une route
 * protégée par `JwtAuthGuard` ; sinon `request.user` est `undefined`.
 *
 * @example
 * ```ts
 * @UseGuards(JwtAuthGuard)
 * @Get("me")
 * me(@CurrentUser() user: User) { ... }
 * ```
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest();
  return request.user as User;
});
