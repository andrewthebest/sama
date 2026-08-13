import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";
import { LoginRequestDto } from "@sama-emi/contracts";

export class LoginDto implements LoginRequestDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsNotEmpty()
  motDePasse!: string;
}
