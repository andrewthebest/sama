import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { PrismaService } from "./prisma/prisma.service";

/**
 * Point d'entrée du backend. Met en place la validation globale des DTO,
 * le CORS (restreint à l'origine du frontend), la documentation Swagger
 * auto-générée (exigence transversale du cahier des charges, section
 * 4.5), et l'arrêt propre de la connexion Prisma.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string>("FRONTEND_ORIGIN", "http://localhost:5173"),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("SAMA EMI — API")
    .setDescription(
      "API du backend SAMA EMI (monolithe modulaire NestJS). Documentation auto-générée — voir le README de chaque module pour le détail fonctionnel.",
    )
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, swaggerDocument);

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const port = config.get<number>("PORT", 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`SAMA EMI backend démarré sur http://localhost:${port} (docs: /api/docs)`);
}

void bootstrap();
