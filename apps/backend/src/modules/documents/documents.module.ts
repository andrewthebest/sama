import { Module } from "@nestjs/common";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";

/**
 * Module `documents` — persistance des scénarios/parcours générés et de
 * leur historique de versions. Exporte `DocumentsService`, seul point
 * d'entrée que `generation` doit utiliser pour créer un document ou lui
 * ajouter une version.
 */
@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
