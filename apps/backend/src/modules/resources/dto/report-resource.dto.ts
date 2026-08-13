import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { ReportResourceRequestDto } from "@sama-emi/contracts";

export class ReportResourceDto implements ReportResourceRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motif?: string;
}
