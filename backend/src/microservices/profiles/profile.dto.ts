import { IsOptional } from "class-validator";

export class CreateProfileDTO {
  userId: number;
  displayName: string;
}

export class UpdateProfileDTO {
  @IsOptional()
  displayName?: string;

  @IsOptional()
  bio?: string;

  @IsOptional()
  location?: string;
}
