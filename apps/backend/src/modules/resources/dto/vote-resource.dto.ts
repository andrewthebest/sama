import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { ResourceDecision, VoteResourceRequestDto } from "@sama-emi/contracts";

export class VoteResourceDto implements VoteResourceRequestDto {
  @ApiProperty({ enum: ResourceDecision })
  @IsEnum(ResourceDecision)
  decision!: ResourceDecision;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commentaire?: string;
}
