import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsObject, IsOptional, IsString, Max, Min } from "class-validator";
import { CreateFeedbackRequestDto } from "@sama-emi/contracts";

/**
 * DTO de création d'un retour de session, rattaché à un document généré
 * (cahier des charges, section 3.5). La note est une échelle fermée de
 * 1 à 5, cohérente avec l'affichage prévu côté frontend (étoiles).
 */
export class CreateFeedbackDto implements CreateFeedbackRequestDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  note!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commentaire?: string;

  @ApiPropertyOptional({ example: "2h30 au lieu de 2h prévues" })
  @IsOptional()
  @IsString()
  dureeReellePrevue?: string;

  @ApiPropertyOptional({ description: "Champs additionnels structurés, libres au frontend." })
  @IsOptional()
  @IsObject()
  champsStructures?: Record<string, unknown>;
}
