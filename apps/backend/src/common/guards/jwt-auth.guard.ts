import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Garde d'accès basée sur la stratégie Passport `jwt` (voir
 * `modules/auth/strategies/jwt.strategy.ts`).
 *
 * Toute route protégée par ce garde exige un en-tête
 * `Authorization: Bearer <accessToken>` valide. Conformément à la
 * contrainte du cahier des charges (« accès à toute fonctionnalité
 * conditionné à un compte utilisateur »), c'est le garde à appliquer par
 * défaut sur les endpoints de génération, documents, feedback, etc.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
