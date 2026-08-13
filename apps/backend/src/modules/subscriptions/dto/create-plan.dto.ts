import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, Min } from "class-validator";
import { CreatePlanRequestDto } from "@sama-emi/contracts";

/**
 * DTO de création d'un plan d'abonnement — « quotas configurables sans
 * déploiement » (cahier des charges, section 3.3). Réservé aux comptes
 * `ADMINISTRATEUR` (voir `RolesGuard` sur `PlansController`).
 */
export class CreatePlanDto implements CreatePlanRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  nom!: string;

  @ApiProperty({ description: "Prix en centimes, dans la devise indiquée par `devise`." })
  @IsInt()
  @Min(0)
  prixCentimes!: number;

  @ApiPropertyOptional({ example: "XOF" })
  @IsOptional()
  @IsNotEmpty()
  devise?: string;

  @ApiProperty({ enum: ["MENSUEL", "ANNUEL"] })
  @IsEnum(["MENSUEL", "ANNUEL"])
  periode!: "MENSUEL" | "ANNUEL";

  @ApiProperty()
  @IsInt()
  @Min(0)
  quotaScenarios!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  quotaParcours!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  quotaRessources!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  essaiInclus?: boolean;
}
