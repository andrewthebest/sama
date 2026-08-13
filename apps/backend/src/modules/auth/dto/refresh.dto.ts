import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { RefreshRequestDto } from "@sama-emi/contracts";

export class RefreshDto implements RefreshRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  refreshToken!: string;
}
