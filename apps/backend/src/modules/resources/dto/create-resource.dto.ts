import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, Length } from "class-validator";
import { CreateResourceRequestDto, ReferentielRefemi, ResourceType } from "@sama-emi/contracts";

/**
 * DTO de soumission d'une ressource. `competenceRefemi` n'est pas
 * validé en profondeur cette session (accepté tel quel comme objet
 * libre) — la cascade REFEMI complète pour les ressources est laissée
 * au module `resource-builder` (Lot 6), qui structure réellement le
 * contenu par compétence.
 */
export class CreateResourceDto implements CreateResourceRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  titre!: string;

  @ApiProperty()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ enum: ResourceType })
  @IsEnum(ResourceType)
  type!: ResourceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({ description: "Texte libre ou URL selon `type`." })
  @IsOptional()
  @IsString()
  contenu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  configJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  competenceRefemi?: ReferentielRefemi;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  thematiqueLibre?: string;

  @ApiProperty({ example: "SN", description: "Code pays ISO-3166-1 alpha-2." })
  @Length(2, 2)
  pays!: string;
}
