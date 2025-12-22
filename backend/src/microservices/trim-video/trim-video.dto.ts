import { Type } from "class-transformer";
import { IsNumber } from "class-validator";

export class TrimVideoDTO {
  @IsNumber({}, { message: "startTime is required" })
  @Type(() => Number)
  startTime: number;

  @IsNumber({}, { message: "endTime is required" })
  @Type(() => Number)
  endTime: number;

  @IsNumber({}, { message: "maxSizeMB is required" })
  @Type(() => Number)
  maxSizeMB: number;
}
