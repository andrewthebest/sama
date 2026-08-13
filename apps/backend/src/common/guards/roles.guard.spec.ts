import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@sama-emi/contracts";
import { RolesGuard } from "./roles.guard";

function creerContexte(role: Role): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: { role } }),
    }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it("autorise l'accès quand aucun rôle n'est requis (endpoint non protégé par @Roles)", () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(creerContexte(Role.UTILISATEUR))).toBe(true);
  });

  it("autorise l'accès quand aucun rôle n'est requis (tableau vide)", () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    expect(guard.canActivate(creerContexte(Role.UTILISATEUR))).toBe(true);
  });

  it("autorise l'accès quand le rôle de l'utilisateur figure dans les rôles requis", () => {
    reflector.getAllAndOverride.mockReturnValue([Role.MODERATEUR, Role.ADMINISTRATEUR]);
    expect(guard.canActivate(creerContexte(Role.MODERATEUR))).toBe(true);
  });

  it("rejette avec 403 quand le rôle de l'utilisateur ne figure pas dans les rôles requis", () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMINISTRATEUR]);
    expect(() => guard.canActivate(creerContexte(Role.UTILISATEUR))).toThrow(ForbiddenException);
  });
});
