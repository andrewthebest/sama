import { INestApplication, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Enveloppe NestJS du client Prisma.
 *
 * Depuis Prisma 7, le moteur Rust historique a été retiré au profit
 * d'un compilateur de requêtes WASM piloté par un driver adapter : la
 * connexion PostgreSQL passe explicitement par `@prisma/adapter-pg`
 * (paquet `pg`) plutôt que d'être résolue implicitement depuis
 * `DATABASE_URL` au sein du schéma.
 *
 * Fournit par ailleurs un cycle de vie propre (connexion à
 * l'initialisation du module, déconnexion à sa destruction) et un hook
 * `enableShutdownHooks` pour que le processus se termine proprement sur
 * SIGTERM/SIGINT.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({ adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("Connexion PostgreSQL établie via Prisma.");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Ferme proprement la connexion Prisma lors de l'arrêt de l'application Nest. */
  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.on("beforeExit", () => {
      void app.close();
    });
  }
}
