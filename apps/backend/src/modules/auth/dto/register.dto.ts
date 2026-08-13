import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, Length, MinLength } from "class-validator";
import { RegisterRequestDto } from "@sama-emi/contracts";

/**
 * DTO d'inscription. Le champ `pays` est obligatoire (cahier des
 * charges, section 3.1) : il sert à contextualiser les documents générés
 * et à filtrer la banque de ressources par pertinence géographique.
 * Attendu au format ISO-3166-1 alpha-2 (ex. "SN", "CI", "FR") — la liste
 * complète des pays est fournie côté frontend (voir
 * apps/frontend/src/data/pays.ts).
 */
export class RegisterDto implements RegisterRequestDto {
  @ApiProperty({ example: "formatrice@example.org" })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @MinLength(8, { message: "Le mot de passe doit contenir au moins 8 caractères." })
  motDePasse!: string;

  @ApiProperty()
  @IsNotEmpty()
  nom!: string;

  @ApiProperty()
  @IsNotEmpty()
  prenom!: string;

  @ApiProperty({ example: "SN", description: "Code pays ISO-3166-1 alpha-2." })
  @Length(2, 2, { message: "Le pays doit être un code ISO-3166-1 alpha-2 (ex. SN, CI, FR)." })
  pays!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  organisation?: string;

  @ApiPropertyOptional({ example: "fr" })
  @IsOptional()
  @IsNotEmpty()
  languePreferee?: string;

  @ApiPropertyOptional({ example: "formateur", description: "Rôle EMI déclaratif (enseignant, formateur, associatif...)." })
  @IsOptional()
  @IsNotEmpty()
  roleEmi?: string;
}
