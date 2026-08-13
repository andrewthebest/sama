import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { ResourceEntity, ResourceType, Role } from "@sama-emi/contracts";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateResourceDto } from "./dto/create-resource.dto";
import { ReportResourceDto } from "./dto/report-resource.dto";
import { VoteResourceDto } from "./dto/vote-resource.dto";
import { ResourcesService } from "./resources.service";

@ApiTags("resources")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("resources")
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @ApiCreatedResponse({ description: "Soumet une ressource à la banque communautaire. Tente immédiatement de désigner 3 modérateurs disponibles." })
  async soumettre(@Body() dto: CreateResourceDto, @CurrentUser() user: User): Promise<ResourceEntity> {
    const resource = await this.resourcesService.soumettre(dto, user.id);
    return this.resourcesService.toPublicEntity(resource);
  }

  @Get()
  @ApiOkResponse({ description: "Ressources publiées, les plus récentes en premier. Filtrable par pays et par type." })
  async lister(@Query("pays") pays?: string, @Query("type") type?: ResourceType): Promise<ResourceEntity[]> {
    const resources = await this.resourcesService.listerPubliees({ pays, type });
    return resources.map((r) => this.resourcesService.toPublicEntity(r));
  }

  @Get("mes")
  @ApiOkResponse({ description: "Ressources soumises par l'utilisateur authentifié, tous statuts confondus." })
  async mesRessources(@CurrentUser() user: User): Promise<ResourceEntity[]> {
    const resources = await this.resourcesService.listerMesRessources(user.id);
    return resources.map((r) => this.resourcesService.toPublicEntity(r));
  }

  @Get("moderation/file")
  @UseGuards(RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMINISTRATEUR)
  @ApiOkResponse({ description: "Ressources en examen désignées à l'utilisateur authentifié, sur lesquelles il n'a pas encore voté (vote en aveugle)." })
  async fileModeration(@CurrentUser() user: User): Promise<ResourceEntity[]> {
    const resources = await this.resourcesService.listerFileModeration(user.id);
    return resources.map((r) => this.resourcesService.toPublicEntity(r));
  }

  @Post("relancer-assignations")
  @UseGuards(RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMINISTRATEUR)
  @ApiOkResponse({ description: "Retente l'assignation de 3 modérateurs sur toutes les ressources encore EN_ATTENTE (déclenchement manuel, voir README)." })
  async relancerAssignations(): Promise<ResourceEntity[]> {
    const resources = await this.resourcesService.relancerAssignationsEnAttente();
    return resources.map((r) => this.resourcesService.toPublicEntity(r));
  }

  @Get(":id")
  @ApiOkResponse({ description: "Détail d'une ressource — visible si publiée/signalée, ou si l'utilisateur en est l'auteur, le modérateur désigné, ou administrateur." })
  async trouverUn(@Param("id") id: string, @CurrentUser() user: User): Promise<ResourceEntity> {
    const resource = await this.resourcesService.trouverPourUtilisateur(id, user);
    return this.resourcesService.toPublicEntity(resource);
  }

  @Post(":id/vote")
  @UseGuards(RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMINISTRATEUR)
  @ApiCreatedResponse({ description: "Enregistre le vote (valider/rejeter) d'un modérateur désigné sur cette ressource." })
  async voter(@Param("id") id: string, @Body() dto: VoteResourceDto, @CurrentUser() user: User): Promise<ResourceEntity> {
    const resource = await this.resourcesService.voter(id, user.id, dto);
    return this.resourcesService.toPublicEntity(resource);
  }

  @Post(":id/signaler")
  @ApiCreatedResponse({ description: "Signale une ressource publiée." })
  // `dto.motif` n'est pas encore persisté (voir README, « Comment l'étendre ») —
  // le corps est accepté dès maintenant pour ne pas casser le contrat une fois
  // la traçabilité des motifs ajoutée.
  async signaler(@Param("id") id: string, @Body() dto: ReportResourceDto): Promise<ResourceEntity> {
    void dto;
    const resource = await this.resourcesService.signaler(id);
    return this.resourcesService.toPublicEntity(resource);
  }
}
