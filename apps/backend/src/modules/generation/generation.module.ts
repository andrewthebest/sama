import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { DocumentsModule } from "../documents/documents.module";
import { AnthropicGenerationClient } from "./anthropic-generation.client";
import { ContentComposerService } from "./content-composer.service";
import { GenerationController } from "./generation.controller";
import { GenerationGateway } from "./gateway/generation.gateway";
import { GenerationProcessor } from "./generation.processor";
import { GenerationService } from "./generation.service";
import { FILE_GENERATION } from "./generation.types";

/**
 * Module `generation` — cœur du moteur. Dépend de `DocumentsModule`
 * pour la persistance (jamais d'accès direct à la table `Document`
 * depuis ce module). Le travail réel (appel Anthropic, composition du
 * contenu) est effectué de façon asynchrone par `GenerationProcessor`
 * sur la file BullMQ `generation` ; voir son README pour le détail du
 * flux et la politique de nouvelle tentative. L'assemblage `.docx`/PDF
 * n'a lieu qu'au moment du téléchargement — voir `DocumentsModule`.
 */
@Module({
  imports: [DocumentsModule, BullModule.registerQueue({ name: FILE_GENERATION })],
  controllers: [GenerationController],
  providers: [GenerationService, GenerationGateway, GenerationProcessor, AnthropicGenerationClient, ContentComposerService],
})
export class GenerationModule {}
