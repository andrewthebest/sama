import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, Length, Min, ValidateIf, ValidateNested } from "class-validator";
import {
  CreateGenerationRequestDto,
  DocumentType,
  Modalite,
  NiveauRefemi,
  ReferentielRefemi,
  ThematiqueType,
} from "@sama-emi/contracts";
import { ReferentielRefemiDto } from "./referentiel-refemi.dto";

/**
 * DTO de lancement d'une génération. Les champs `referentielRefemi` et
 * (`thematiqueLibre` + `objectifsLibres`) sont mutuellement exclusifs :
 * seul l'un des deux sous-ensembles est requis, selon `thematiqueType`
 * (cahier des charges, section 3.2 — option « thématique personnalisée »).
 */
export class CreateGenerationDto implements CreateGenerationRequestDto {
  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  type!: DocumentType;

  @ApiProperty({ example: "SN", description: "Code pays ISO-3166-1 alpha-2." })
  @Length(2, 2)
  pays!: string;

  @ApiProperty({ enum: ThematiqueType })
  @IsEnum(ThematiqueType)
  thematiqueType!: ThematiqueType;

  @ApiPropertyOptional({ type: ReferentielRefemiDto })
  @ValidateIf((o: CreateGenerationDto) => o.thematiqueType === ThematiqueType.REFEMI)
  @ValidateNested()
  @Type(() => ReferentielRefemiDto)
  referentielRefemi?: ReferentielRefemi;

  @ApiPropertyOptional()
  @ValidateIf((o: CreateGenerationDto) => o.thematiqueType === ThematiqueType.PERSONNALISEE)
  @IsNotEmpty({ message: "La thématique personnalisée est requise lorsque thematiqueType = PERSONNALISEE." })
  thematiqueLibre?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: CreateGenerationDto) => o.thematiqueType === ThematiqueType.PERSONNALISEE)
  @IsNotEmpty({ message: "Les objectifs sont requis lorsque thematiqueType = PERSONNALISEE." })
  objectifsLibres?: string;

  @ApiProperty()
  @IsNotEmpty()
  public!: string;

  @ApiProperty({ example: "2h" })
  @IsNotEmpty()
  duree!: string;

  @ApiProperty({ enum: Modalite })
  @IsEnum(Modalite)
  modalite!: Modalite;

  @ApiProperty()
  @IsNotEmpty()
  profilFormateur!: string;

  @ApiPropertyOptional({ enum: NiveauRefemi })
  @IsOptional()
  @IsEnum(NiveauRefemi)
  niveau?: NiveauRefemi;

  @ApiProperty({ example: "fr" })
  @IsNotEmpty()
  langue!: string;

  @ApiPropertyOptional({ description: "Uniquement pour un parcours de formation." })
  @ValidateIf((o: CreateGenerationDto) => o.type === DocumentType.PARCOURS)
  @IsInt()
  @Min(1)
  nombreJours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  formatGlobal?: string;
}
