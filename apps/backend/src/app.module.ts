import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { GenerationModule } from "./modules/generation/generation.module";
import { UsersModule } from "./modules/users/users.module";
import { PrismaModule } from "./prisma/prisma.module";

/**
 * Module racine. N'assemble, pour la Session A, que les modules du
 * cœur produit (`auth`, `users`, `documents`, `generation`) conformément
 * au phasage validé en cadrage — les sept autres modules du cahier des
 * charges (subscriptions, feedback, resources, resource-builder,
 * training, notifications, admin) rejoindront ce fichier à leurs
 * sessions respectives.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DocumentsModule,
    GenerationModule,
  ],
})
export class AppModule {}
