import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { CreateFieldDTO } from "../categories/category.dto";
import { Type } from "class-transformer";

export class CreateServiceDTO {
  @IsString({ message: "name is required" })
  name: string;

  @IsString({ message: "slug is required" })
  slug: string;

  @IsNumber()
  categoryId: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  groupId?: number;

  @IsOptional()
  @IsNumber()
  parentId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldDTO)
  fields?: CreateFieldDTO[];
}

export class UpdateServiceDTO {
  @IsOptional()
  @IsString({ message: "name is required" })
  name?: string;

  @IsOptional()
  @IsString({ message: "slug is required" })
  slug?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  groupId?: number;

  @IsOptional()
  @IsNumber()
  parentId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldDTO)
  fields?: CreateFieldDTO[];
}
