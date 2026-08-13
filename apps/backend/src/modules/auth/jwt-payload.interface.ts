import { Role } from "@sama-emi/contracts";

/** Contenu signé d'un access token JWT. */
export interface JwtPayload {
  /** Identifiant de l'utilisateur (subject). */
  sub: string;
  email: string;
  role: Role;
}
