import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { FeedbackModule } from "./modules/feedback/feedback.module";
import { GenerationModule } from "./modules/generation/generation.module";
import { ResourcesModule } from "./modules/resources/resources.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { UsersModule } from "./modules/users/users.module";
import { PrismaModule } from "./prisma/prisma.module";

/**
 * Module racine. Assemble le cœur produit (`auth`, `users`,
 * `documents`, `generation`), `subscriptions` (Session C), `feedback`
 * (Session D) et `resources` (Session E) — conformément au phasage
 * validé en cadrage. Quatre autres modules du cahier des charges
 * (resource-builder, training, notifications, admin) rejoindront ce
 * fichier à leurs sessions respectives.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // File d'attente BullMQ (décision validée en cadrage) — la connexion
    // Redis est déclarée une seule fois ici ; chaque module y enregistre
    // ses propres files via BullModule.registerQueue().
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>("REDIS_URL", "redis://localhost:6379") },
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DocumentsModule,
    SubscriptionsModule,
    GenerationModule,
    FeedbackModule,
    ResourcesModule,
  ],
})
export class AppModule {}
