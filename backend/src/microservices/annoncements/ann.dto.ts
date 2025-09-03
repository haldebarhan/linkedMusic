import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @Type(() => Number)
  @IsInt()
  serviceTypeId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  /**
   * Valeurs dynamiques (EAV) mappées par key de Field (ex: styles, instrument, pro, priceMin/Max, etc.)
   * On valide ici que c'est un objet ; la validation fine par type se fait côté service (selon Field.inputType).
   */
  @IsOptional()
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
  serviceTypeId?: number;

  @IsOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  /**
   * Valeurs dynamiques (EAV) mappées par key de Field (ex: styles, instrument, pro, priceMin/Max, etc.)
   * On valide ici que c'est un objet ; la validation fine par type se fait côté service (selon Field.inputType).
   */
  @IsOptional()
  @IsObject()
  values?: Record<string, any>;
}
