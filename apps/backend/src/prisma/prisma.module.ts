import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

/**
 * Module global exposant `PrismaService` à tous les modules métier sans
 * import répété. Cloisonnement : chaque module métier reste responsable
 * de ses propres requêtes Prisma (aucune requête cross-module directe
 * sur les tables d'un autre domaine — voir README racine, section
 * « Règle de cloisonnement »).
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
