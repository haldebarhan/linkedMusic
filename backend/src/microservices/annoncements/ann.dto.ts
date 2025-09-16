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

/**
 * CREATE
 * - Requiert au moins 1 catégorie (categoryIds)
 * - serviceTypeId obligatoire
 */
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

  /**
   * Valeurs dynamiques (EAV) mappées par key de Field
   * La validation fine (selon Field.inputType) se fait côté service.
   */
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

  // A) Remplacement complet
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  categoryIds?: number[];

  // B) Modification incrémentale
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  categoryIdsAdd?: number[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  categoryIdsRemove?: number[];

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
  @IsObject()
  values?: Record<string, any>;
}
