import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { DocumentEntity, DocumentVersionEntity } from "@sama-emi/contracts";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { DocumentsService } from "./documents.service";

/**
 * Espace personnel de documents (scénarios/parcours générés). Le
 * téléchargement .docx/.pdf réel sera ajouté en Session B avec le
 * moteur de génération complet ; cette Session A expose la lecture pour
 * que le frontend puisse afficher l'aperçu factice après une génération.
 */
@ApiTags("documents")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

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
}
