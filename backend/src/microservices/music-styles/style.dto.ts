import { IsOptional, IsString } from "class-validator";

export class CreateStyleDTO {
  @IsString({ message: "name required" })
  name: string;
}

export class UpdateStyleDTO {
  @IsOptional()
  @IsString({ message: "name required" })
  name?: string;
}
