import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { FeedbackSummaryResponseDto } from "@sama-emi/contracts";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { FeedbackService } from "./feedback.service";

@ApiTags("feedback")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("feedback")
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get("me")
  @ApiOkResponse({ description: "Vue agrégée des retours de session donnés par l'utilisateur authentifié, tous documents confondus." })
  async mesFeedbacks(@CurrentUser() user: User): Promise<FeedbackSummaryResponseDto> {
    const { nombreFeedbacks, noteMoyenne, feedbacks } = await this.feedbackService.resumeParUtilisateur(user.id);
    return { nombreFeedbacks, noteMoyenne, feedbacks: feedbacks.map((f) => this.feedbackService.toPublicEntity(f)) };
  }
}
