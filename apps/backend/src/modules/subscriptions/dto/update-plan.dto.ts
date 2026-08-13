import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, Min } from "class-validator";
import { UpdatePlanRequestDto } from "@sama-emi/contracts";

/** DTO de modification d'un plan existant — tous les champs sont optionnels. */
export class UpdatePlanDto implements UpdatePlanRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  nom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  prixCentimes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  devise?: string;

  @ApiPropertyOptional({ enum: ["MENSUEL", "ANNUEL"] })
  @IsOptional()
  @IsEnum(["MENSUEL", "ANNUEL"])
  periode?: "MENSUEL" | "ANNUEL";

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  quotaScenarios?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  quotaParcours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  quotaRessources?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  essaiInclus?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
