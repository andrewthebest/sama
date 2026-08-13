import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";
import { SetModerationAvailabilityRequestDto } from "@sama-emi/contracts";

export class SetModerationAvailabilityDto implements SetModerationAvailabilityRequestDto {
  @ApiProperty()
  @IsBoolean()
  disponible!: boolean;
}
