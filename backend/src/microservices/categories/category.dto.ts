// ============================================================================
// DTOS - CATEGORIES & FIELDS
// ============================================================================

import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsNotEmpty,
  MinLength,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { FieldInputType } from "@prisma/client";
import { Type } from "class-transformer";

// ============================================================================
// CATEGORY DTOS
// ============================================================================

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

// ============================================================================
// FIELD DTOS
// ============================================================================

export class CreateFieldDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  key: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  label: string;

  @IsEnum(FieldInputType)
  @IsNotEmpty()
  inputType: FieldInputType;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsString()
  helpText?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsNumber()
  minLength?: number;

  @IsOptional()
  @IsNumber()
  maxLength?: number;

  @IsOptional()
  @IsNumber()
  minValue?: number;

  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @IsOptional()
  @IsString()
  pattern?: string;

  @IsOptional()
  @IsString()
  dependsOn?: string;

  @IsOptional()
  @IsString()
  showWhen?: string;

  @IsOptional()
  @IsBoolean()
  searchable?: boolean;

  @IsOptional()
  @IsBoolean()
  filterable?: boolean;

  @IsOptional()
  @IsBoolean()
  sortable?: boolean;

  @IsOptional()
  @IsString()
  externalTable?: string;

  @IsOptional()
  @IsArray()
  options?: Array<{
    id?: number;
    label: string;
    value: string;
    order: number;
  }>;
}

export class UpdateFieldDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsEnum(FieldInputType)
  inputType?: FieldInputType;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsString()
  helpText?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsNumber()
  minLength?: number;

  @IsOptional()
  @IsNumber()
  maxLength?: number;

  @IsOptional()
  @IsNumber()
  minValue?: number;

  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @IsOptional()
  @IsString()
  pattern?: string;

  @IsOptional()
  @IsString()
  dependsOn?: string;

  @IsOptional()
  @IsString()
  showWhen?: string;

  @IsOptional()
  @IsBoolean()
  searchable?: boolean;

  @IsOptional()
  @IsBoolean()
  filterable?: boolean;

  @IsOptional()
  @IsBoolean()
  sortable?: boolean;

  @IsOptional()
  @IsString()
  externalTable?: string;

  @IsOptional()
  @IsArray()
  options?: Array<{
    id?: number;
    label: string;
    value: string;
    order: number;
  }>;

  @IsOptional()
  @IsArray()
  optionsToRemove?: Array<{
    id: number;
    label: string;
    value: string;
    order: number;
  }>;
}

// ============================================================================
// FIELD OPTION DTOS
// ============================================================================

export class CreateFieldOptionDto {
  @IsNumber()
  @IsNotEmpty()
  fieldId: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  label: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  value: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  metadata?: any;
}

export class UpdateFieldOptionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  value?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  metadata?: any;
}

// ============================================================================
// CATEGORY FIELD (RELATION) DTOS
// ============================================================================

export class LinkFieldsToCategoryDTO {
  @IsArray({ message: "fields must be an array" })
  @ValidateNested({ each: true })
  @Type(() => CreateCategoryFieldDto)
  fields: CreateCategoryFieldDto[];
}

export class CreateCategoryFieldDto {
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @IsNumber()
  @IsNotEmpty()
  fieldId: number;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsBoolean()
  visibleInFilter?: boolean;

  @IsOptional()
  @IsBoolean()
  visibleInForm?: boolean;

  @IsOptional()
  @IsBoolean()
  visibleInList?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  defaultValue?: any;
}

export class UpdateCategoryFieldDto {
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsBoolean()
  visibleInFilter?: boolean;

  @IsOptional()
  @IsBoolean()
  visibleInForm?: boolean;

  @IsOptional()
  @IsBoolean()
  visibleInList?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  defaultValue?: any;
}

// ============================================================================
// RESPONSE DTOS
// ============================================================================

export class FormSchemaResponseDto {
  category: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
  };

  fields: Array<{
    field: {
      id: number;
      key: string;
      label: string;
      inputType: FieldInputType;
      placeholder?: string;
      helpText?: string;
      unit?: string;
      minLength?: number;
      maxLength?: number;
      minValue?: number;
      maxValue?: number;
      pattern?: string;
      dependsOn?: string;
      showWhen?: string;
      externalTable?: string;
      options?: Array<{
        id: number;
        label: string;
        value: string;
        metadata?: any;
      }>;
    };
    required: boolean;
    visibleInFilter: boolean;
    visibleInForm: boolean;
    order: number;
    defaultValue?: any;
  }>;
}
