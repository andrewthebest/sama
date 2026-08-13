import { Module } from "@nestjs/common";
import { DocumentsModule } from "../documents/documents.module";
import { DocumentFeedbackController } from "./document-feedback.controller";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";

/**
 * Module `feedback` — retours de session rattachés à un document
 * généré. Dépend de `DocumentsModule` pour vérifier qu'un document
 * appartient bien à l'utilisateur avant de lui associer (ou lui
 * montrer) un retour — jamais d'accès direct à la table `Document`
 * depuis ce module.
 */
@Module({
  imports: [DocumentsModule],
  controllers: [DocumentFeedbackController, FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
