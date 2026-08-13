import { Module } from "@nestjs/common";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";
import { DocxAssemblerService } from "./docx-assembler.service";
import { LibreOfficeConverterService } from "./libreoffice-converter.service";

/**
 * Module `documents` — persistance des scénarios/parcours générés et de
 * leur historique de versions. Exporte `DocumentsService`, seul point
 * d'entrée que `generation` doit utiliser pour créer un document ou lui
 * ajouter une version. Assemble aussi les exports `.docx`/`.pdf` et
 * l'aperçu HTML à la demande, depuis le contenu structuré déjà stocké
 * (voir `docx-assembler.service.ts`) — cette conversion n'a jamais lieu
 * au moment de la génération elle-même.
 */
@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, DocxAssemblerService, LibreOfficeConverterService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
