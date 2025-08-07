import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateTopicDTO {
  @IsString({ message: "name is required" })
  title: string;

  @IsString({ message: "content is required" })
  content: string;

  @IsNumber({}, { message: "categoryId is required" })
  categoryId: number;
}

export class UpdateTopicDTO {
  @IsOptional()
  @IsString({ message: "name is required" })
  title?: string;

  @IsOptional()
  @IsString({ message: "content is required" })
  content?: string;

  @IsOptional()
  @IsNumber({}, { message: "categoryId is required" })
  categoryId?: number;
}
