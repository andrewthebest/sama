import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { NiveauRefemi, ReferentielRefemi } from "@sama-emi/contracts";

/** Sélection issue du sélecteur en cascade culture → compétence → niveau → thématique. */
export class ReferentielRefemiDto implements ReferentielRefemi {
  @ApiProperty()
  @IsNotEmpty()
  culture!: string;

  @ApiProperty()
  @IsNotEmpty()
  competence!: string;

  @ApiProperty({ enum: NiveauRefemi })
  @IsEnum(NiveauRefemi)
  niveau!: NiveauRefemi;

  @ApiProperty()
  @IsNotEmpty()
  thematique!: string;
}
