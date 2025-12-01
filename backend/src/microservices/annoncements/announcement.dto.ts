import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsUrl,
  IsNotEmpty,
  ArrayUnique,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { AnnouncementStatus } from "@prisma/client";
import { parseMaybeJSON } from "@/middlewares/parse-json.middleware";

const toBool = (v: any) =>
  v === true || v === "true"
    ? true
    : v === false || v === "false"
    ? false
    : undefined;
const toNum = (v: any) =>
  v === "" || v === null || v === undefined ? undefined : Number(v);
const parseJSON = (v: any) => {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};
const parseIds = (v: any): number[] | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const arr = Array.isArray(v) ? v : String(v).split(",");
  const nums = arr.map((x) => Number(x)).filter((x) => !Number.isNaN(x));
  return nums.length ? nums : undefined;
};

export class FieldValueDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => toNum(value))
  fieldId: number;

  @IsOptional()
  @IsString()
  valueText?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => toNum(value))
  valueNumber?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBool(value))
  valueBoolean?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  })
  valueDate?: Date;

  @IsOptional()
  @Transform(({ value }) => parseJSON(value))
  valueJson?: any;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Transform(({ value }) => parseIds(value))
  optionIds?: number[];
}

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: "Le titre doit contenir au moins 5 caractères" })
  @MaxLength(100, { message: "Le titre ne peut pas dépasser 100 caractères" })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20, {
    message: "La description doit contenir au moins 20 caractères",
  })
  @MaxLength(2000, {
    message: "La description ne peut pas dépasser 2000 caractères",
  })
  description: string;

  @IsNotEmpty({ message: "La catégorie est obligatoire" })
  @IsNumber({})
  @Transform(({ value }) => toNum(value))
  categoryId: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: "Le prix ne peut pas être négatif" })
  @Transform(({ value }) => toNum(value))
  price?: number;

  @IsOptional()
  @IsString()
  priceUnit?: string; // "heure", "jour", "projet", etc.

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBool(value))
  negotiable?: boolean;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  videos?: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  audios?: string[];

  @Transform(({ value }) => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  fieldValues: FieldValueDto[];
}

export class likeAnnouncementDTO {
  @IsNumber({}, { message: "announcementId must be number" })
  announcementId: number;
}

// ============================================================================
// UPDATE ANNOUNCEMENT DTO
// ============================================================================

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  priceUnit?: string;

  @IsOptional()
  @IsBoolean()
  negotiable?: boolean;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  videos?: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  audios?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  fieldValues?: FieldValueDto[];

  @IsOptional()
  @IsEnum(AnnouncementStatus)
  status?: AnnouncementStatus;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isHighlighted?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseMaybeJSON(value))
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  removedFiles?: string[];
}

// ============================================================================
// QUERY/FILTER DTOS
// ============================================================================

export class AnnouncementQueryDto {
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";

  // Filtres dynamiques (JSON stringifié)
  @IsOptional()
  @IsString()
  fieldFilters?: string;
}

// ============================================================================
// RESPONSE DTOS
// ============================================================================

export class AnnouncementResponseDto {
  id: number;
  title: string;
  description: string;
  price?: number;
  priceUnit?: string;
  negotiable: boolean;
  location?: string;
  country?: string;
  city?: string;
  images: string[];
  videos: string[];
  audios: string[];
  status: AnnouncementStatus;
  isPublished: boolean;
  isHighlighted: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;

  // Relations
  category: {
    id: number;
    name: string;
    slug: string;
    icon?: string;
  };

  owner: {
    id: number;
    displayName?: string;
    profileImage?: string;
    totalAnnouncement?: number;
    badge: string;
  };

  fieldValues: Array<{
    field: {
      key: string;
      label: string;
      inputType: string;
    };
    valueText?: string;
    valueNumber?: number;
    valueBoolean?: boolean;
    valueDate?: Date;
    options?: Array<{
      label: string;
      value: string;
    }>;
  }>;
}
