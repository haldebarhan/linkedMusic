import { InputType } from "../../utils/enums/input-type.enum";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";

export class CreateCategoryDTO {
  @IsNotEmpty({ message: "Category name is required" })
  @IsString({ message: "Category name must be a string" })
  @MinLength(2, { message: "Category name must be at least 2 characters long" })
  name: string;

  @IsNotEmpty({ message: "slug name is required" })
  @IsString({ message: "slug name must be a string" })
  @MinLength(2, { message: "slug name must be at least 2 characters long" })
  slug: string;
}

export class CreateServiceTypeDTO {
  @IsArray()
  @IsNumber({}, { message: "Category name must be a string", each: true })
  categoryIds: number[];

  @IsNotEmpty({ message: "name is required" })
  @IsString({ message: "name must be a string" })
  @MinLength(2, { message: "name must be at least 2 characters long" })
  name: string;

  @IsNotEmpty({ message: "slug name is required" })
  @IsString({ message: "slug name must be a string" })
  @MinLength(2, { message: "slug name must be at least 2 characters long" })
  slug: string;
}

export class CreateFieldDto {
  @IsNotEmpty({ message: "key name is required" })
  @IsString({ message: "key name must be a string" })
  @MinLength(2, { message: "key name must be at least 2 characters long" })
  key: string;

  @IsNotEmpty({ message: "label name is required" })
  @IsString({ message: "label name must be a string" })
  @MinLength(2, { message: "label name must be at least 2 characters long" })
  label: string;

  @IsEnum(InputType, { message: "Invalid input type" })
  inputType: InputType;

  @IsOptional()
  @IsNotEmpty({ message: "placeholder is required" })
  @IsString({ message: "placeholder must be a string" })
  @MinLength(2, { message: "placeholder must be at least 2 characters long" })
  placeholder?: string;

  @IsOptional()
  @IsNotEmpty({ message: "unit name is required" })
  @IsString({ message: "unit name must be a string" })
  @MinLength(2, { message: "unit name must be at least 2 characters long" })
  unit?: string;

  @IsOptional()
  @IsBoolean({ message: "searchable must be a boolean" })
  searchable?: boolean;

  @IsOptional()
  @IsBoolean({ message: "filterable must be a boolean" })
  filterable?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldOptionDto)
  options?: CreateFieldOptionDto[];
}

export class CreateFieldOptionDto {
  @IsOptional()
  @IsNumber({}, { message: "fieldId must be a number" })
  fieldId?: number;

  @IsNotEmpty({ message: "label name is required" })
  @IsString({ message: "label name must be a string" })
  @MinLength(2, { message: "label name must be at least 2 characters long" })
  label: string;

  @IsNotEmpty({ message: "value name is required" })
  @IsString({ message: "value name must be a string" })
  @MinLength(2, { message: "value name must be at least 2 characters long" })
  value: string;

  @IsOptional()
  @IsNumber({}, { message: "order must be a number" })
  order?: number;
}

export class AttachFieldsDTO {
  @IsArray({ message: "fields must be an array" })
  @ValidateNested({ each: true })
  @Type(() => AttachFieldDTO)
  fields: AttachFieldDTO[];
}

export class AttachServicesDTO {
  @IsArray({ message: "services must be an array" })
  @ValidateNested({ each: true })
  @Type(() => AttachServicedDTO)
  services: AttachServicedDTO[];
}

export class AttachFieldDTO {
  @IsNumber({}, { message: "categoryId must be a number" })
  categoryId: number;

  @IsNumber({}, { message: "fieldId must be a number" })
  fieldId: number;

  @IsOptional()
  @IsBoolean({ message: "searchable must be a boolean" })
  required?: boolean;

  @IsOptional()
  @IsBoolean({ message: "visibleInForm must be a boolean" })
  visibleInForm?: boolean;

  @IsOptional()
  @IsBoolean({ message: "visibleInFilter must be a boolean" })
  visibleInFilter?: boolean;

  @IsOptional()
  @IsNumber({}, { message: "order must be a number" })
  order?: number;
}

export class AttachServicedDTO {
  @IsNumber({}, { message: "categoryId must be a number" })
  categoryId: number;

  @IsNumber({}, { message: "fieldId must be a number" })
  serviceTypeId: number;
}

// Update DTO

export class UpdateServiceTypeDTO {
  @IsOptional()
  @IsNumber({}, { message: "Category name must be a string" })
  categoryId?: number;

  @IsOptional()
  @IsNotEmpty({ message: "name is required" })
  @IsString({ message: "name must be a string" })
  @MinLength(2, { message: "name must be at least 2 characters long" })
  name?: string;

  @IsOptional()
  @IsNotEmpty({ message: "slug name is required" })
  @IsString({ message: "slug name must be a string" })
  @MinLength(2, { message: "slug name must be at least 2 characters long" })
  slug?: string;
}

export class UpdateCategoryDTO {
  @IsOptional()
  @IsNotEmpty({ message: "Category name is required" })
  @IsString({ message: "Category name must be a string" })
  @MinLength(2, { message: "Category name must be at least 2 characters long" })
  name?: string;

  @IsOptional()
  @IsNotEmpty({ message: "slug name is required" })
  @IsString({ message: "slug name must be a string" })
  @MinLength(2, { message: "slug name must be at least 2 characters long" })
  slug?: string;
}

export class UpdateFieldDto {
  @IsOptional()
  @IsNotEmpty({ message: "key name is required" })
  @IsString({ message: "key name must be a string" })
  @MinLength(2, { message: "key name must be at least 2 characters long" })
  key?: string;

  @IsOptional()
  @IsNotEmpty({ message: "label name is required" })
  @IsString({ message: "label name must be a string" })
  @MinLength(2, { message: "label name must be at least 2 characters long" })
  label?: string;

  @IsOptional()
  @IsEnum(InputType, { message: "Invalid input type" })
  inputType?: InputType;

  @IsOptional()
  @IsNotEmpty({ message: "placeholder is required" })
  @IsString({ message: "placeholder must be a string" })
  @MinLength(2, { message: "placeholder must be at least 2 characters long" })
  placeholder?: string;

  @IsOptional()
  @IsNotEmpty({ message: "unit name is required" })
  @IsString({ message: "unit name must be a string" })
  @MinLength(2, { message: "unit name must be at least 2 characters long" })
  unit?: string;

  @IsOptional()
  @IsBoolean({ message: "searchable must be a boolean" })
  searchable?: boolean;

  @IsOptional()
  @IsBoolean({ message: "filterable must be a boolean" })
  filterable?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFieldOptionDto)
  options?: UpdateFieldOptionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFieldOptionDto)
  optionsToRemove?: UpdateFieldOptionDto[];
}

export class UpdateFieldOptionDto {
  @IsOptional()
  @IsNumber({}, { message: "id must be a number" })
  id?: number;

  @IsOptional()
  @IsNumber({}, { message: "fieldId must be a number" })
  fieldId?: number;

  @IsOptional()
  @IsNotEmpty({ message: "label name is required" })
  @IsString({ message: "label name must be a string" })
  @MinLength(2, { message: "label name must be at least 2 characters long" })
  label?: string;

  @IsOptional()
  @IsNotEmpty({ message: "value name is required" })
  @IsString({ message: "value name must be a string" })
  @MinLength(2, { message: "value name must be at least 2 characters long" })
  value?: string;

  @IsOptional()
  @IsNumber({}, { message: "order must be a number" })
  order?: number;

  @IsOptional()
  @IsArray({ each: true })
  options?: CreateFieldOptionDto[];
}
