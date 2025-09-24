import { parseMaybeJSON } from "@/middlewares/parse-json.middleware";
import { Transform, Type } from "class-transformer";
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @Type(() => Number)
  @IsInt()
  categoryId: number;

  @IsString()
  @MinLength(10)
  description!: string;

  @Type(() => Number)
  @IsInt()
  serviceTypeId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @Type(() => Object)
  @IsOptional()
  @Transform(({ value }) => parseMaybeJSON(value))
  @IsObject()
  values?: Record<string, any>;
}

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  serviceTypeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Object)
  @Transform(({ value }) => parseMaybeJSON(value))
  @IsObject()
  values?: Record<string, any>;

  @IsOptional()
  @Transform(({ value }) => parseMaybeJSON(value))
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  removedFiles?: string[];
}
