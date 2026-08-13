import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { FeedbackEntity } from "@sama-emi/contracts";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { FeedbackService } from "./feedback.service";

@ApiTags("feedback")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("documents/:documentId/feedback")
export class DocumentFeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiCreatedResponse({ description: "Enregistre un retour de session pour ce document." })
  async creer(@Param("documentId") documentId: string, @Body() dto: CreateFeedbackDto, @CurrentUser() user: User): Promise<FeedbackEntity> {
    const feedback = await this.feedbackService.creerFeedback(documentId, user.id, dto);
    return this.feedbackService.toPublicEntity(feedback);
  }

  @Get()
  @ApiOkResponse({ description: "Retours de session de ce document, du plus récent au plus ancien." })
  async lister(@Param("documentId") documentId: string, @CurrentUser() user: User): Promise<FeedbackEntity[]> {
    const feedbacks = await this.feedbackService.listerParDocument(documentId, user.id);
    return feedbacks.map((f) => this.feedbackService.toPublicEntity(f));
  }
}
