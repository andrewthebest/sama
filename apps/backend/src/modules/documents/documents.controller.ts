import { Controller, Get, NotFoundException, Param, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiProduces, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { DocumentEntity, DocumentVersionEntity } from "@sama-emi/contracts";
import type { Response } from "express";
import * as mammoth from "mammoth";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ContenuDocument } from "./composed-content.types";
import { DocumentsService } from "./documents.service";
import { DocxAssemblerService } from "./docx-assembler.service";
import { LibreOfficeConverterService } from "./libreoffice-converter.service";

/**
 * Espace personnel de documents (scénarios/parcours générés), aperçu
 * HTML et téléchargement `.docx`/`.pdf`.
 *
 * L'assemblage du document (via `DocxAssemblerService`) et sa
 * conversion (`mammoth` pour l'aperçu HTML, LibreOffice headless pour
 * le PDF) sont effectués à la demande, à partir du contenu structuré
 * déjà persisté — jamais au moment de la génération elle-même. Cela
 * évite de stocker des fichiers binaires en base et permet de faire
 * évoluer la mise en forme du gabarit sans regénérer les documents
 * existants.
 */
@ApiTags("documents")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("documents")
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly docxAssembler: DocxAssemblerService,
    private readonly libreOfficeConverter: LibreOfficeConverterService,
  ) {}

  @Get()
  @ApiOkResponse({ description: "Documents de l'utilisateur authentifié, les plus récents en premier." })
  async findAllMine(@CurrentUser() user: User): Promise<DocumentEntity[]> {
    const documents = await this.documentsService.findAllForUser(user.id);
    return documents.map((d) => this.documentsService.toPublicEntity(d));
  }

  @Get(":id")
  @ApiOkResponse({ description: "Document et sa version courante, pour aperçu et téléchargement." })
  async findOne(
    @Param("id") id: string,
    @CurrentUser() user: User,
  ): Promise<{ document: DocumentEntity; versionCourante: DocumentVersionEntity | null }> {
    const { document, versionCourante } = await this.documentsService.findOneForUser(id, user.id);
    return {
      document: this.documentsService.toPublicEntity(document),
      versionCourante: versionCourante ? this.documentsService.toPublicVersionEntity(versionCourante) : null,
    };
  }

  @Get(":id/apercu.html")
  @ApiOkResponse({ description: "Aperçu HTML du document (conversion .docx → HTML via mammoth), pour affichage dans la plateforme." })
  async apercu(@Param("id") id: string, @CurrentUser() user: User): Promise<{ html: string }> {
    const docxBuffer = await this.assemblerDocx(id, user.id);
    const { value: html } = await mammoth.convertToHtml({ buffer: docxBuffer });
    return { html };
  }

  @Get(":id/telecharger.docx")
  @ApiProduces("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
  @ApiOkResponse({ description: "Téléchargement du document au format .docx." })
  async telechargerDocx(@Param("id") id: string, @CurrentUser() user: User, @Res() res: Response): Promise<void> {
    const docxBuffer = await this.assemblerDocx(id, user.id);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${this.nommerFichier(id)}.docx"`);
    res.send(docxBuffer);
  }

  @Get(":id/telecharger.pdf")
  @ApiProduces("application/pdf")
  @ApiOkResponse({ description: "Téléchargement du document au format .pdf (conversion LibreOffice headless)." })
  async telechargerPdf(@Param("id") id: string, @CurrentUser() user: User, @Res() res: Response): Promise<void> {
    const docxBuffer = await this.assemblerDocx(id, user.id);
    const pdfBuffer = await this.libreOfficeConverter.convertirEnPdf(docxBuffer);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${this.nommerFichier(id)}.pdf"`);
    res.send(pdfBuffer);
  }

  private async assemblerDocx(id: string, userId: string): Promise<Buffer> {
    const { versionCourante } = await this.documentsService.findOneForUser(id, userId);
    if (!versionCourante) {
      throw new NotFoundException("Ce document n'a pas encore de version générée.");
    }
    return this.docxAssembler.assembler(versionCourante.contenu as unknown as ContenuDocument);
  }

  private nommerFichier(id: string): string {
    return `sama-emi-${id}`;
  }
}
