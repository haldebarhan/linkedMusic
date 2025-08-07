import { IsOptional, IsString } from "class-validator";

export class CreateTopicCategoryDTO {
  @IsString({ message: "name is required" })
  name: string;

  @IsString({ message: "slug is required" })
  slug: string;
}

export class UpdateTopicCategoryDTO {
  @IsOptional()
  @IsString({ message: "name is required" })
  name?: string;

  @IsOptional()
  @IsString({ message: "slug is required" })
  slug?: string;
}
