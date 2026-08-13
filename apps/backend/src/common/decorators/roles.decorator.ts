import { SetMetadata } from "@nestjs/common";
import { Role } from "@sama-emi/contracts";

export const ROLES_KEY = "roles";

/** À combiner avec `JwtAuthGuard` + `RolesGuard` sur un endpoint réservé à certains rôles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
