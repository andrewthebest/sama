import { Module } from "@nestjs/common";
import { DocumentsModule } from "../documents/documents.module";
import { GenerationController } from "./generation.controller";
import { GenerationGateway } from "./gateway/generation.gateway";
import { GenerationService } from "./generation.service";
import { MockContentBuilder } from "./mock-content.builder";

/**
 * Module `generation` — cœur du moteur. Dépend de `DocumentsModule`
 * pour la persistance (jamais d'accès direct à la table `Document`
 * depuis ce module). En Session A, `GenerationService` simule l'appel à
 * l'API Anthropic ; voir son README pour le point de branchement prévu
 * en Session B.
 */
@Module({
  imports: [DocumentsModule],
  controllers: [GenerationController],
  providers: [GenerationService, GenerationGateway, MockContentBuilder],
})
export class GenerationModule {}
