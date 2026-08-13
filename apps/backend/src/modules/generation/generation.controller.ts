import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { CreateGenerationResponseDto, GenerationJobEntity } from "@sama-emi/contracts";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateGenerationDto } from "./dto/create-generation.dto";
import { GenerationService } from "./generation.service";

@ApiTags("generation")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("generations")
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Post()
  @ApiCreatedResponse({ description: "Génération mise en file d'attente. Suivre la progression via le WebSocket /generation." })
  lancer(@Body() dto: CreateGenerationDto, @CurrentUser() user: User): Promise<CreateGenerationResponseDto> {
    return this.generationService.lancerGeneration(dto, user.id);
  }

  @Get(":jobId")
  @ApiOkResponse({ description: "État courant d'un job de génération (utile en complément du WebSocket, ex. après reconnexion)." })
  async etat(@Param("jobId") jobId: string): Promise<GenerationJobEntity> {
    const job = await this.generationService.trouverJob(jobId);
    return {
      id: job.id,
      documentId: job.documentId,
      statut: job.statut as GenerationJobEntity["statut"],
      etape: job.etape as GenerationJobEntity["etape"],
      progression: job.progression,
      demarreLe: job.demarreLe?.toISOString() ?? null,
      termineLe: job.termineLe?.toISOString() ?? null,
      erreur: job.erreur,
    };
  }
}
