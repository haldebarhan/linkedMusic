import { FieldType } from "@/utils/enums/field-type.enum";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from "class-validator";

export class CreateFieldOptionDTO {
  @IsString({ message: "value is required" })
  value: string;
}

export class CreateFieldDTO {
  @IsString({ message: "name is required" })
  name: string;

  @IsString({ message: "label is required" })
  label: string;

  @IsEnum(FieldType, { message: "type is required" })
  type: FieldType;

  @IsBoolean({ message: "type required must be true or false" })
  required: boolean;

  @IsNumber({}, { message: "order is required" })
  order: number;

  @IsBoolean({ message: "visibleInSearch is required" })
  visibleInSearch: boolean;

  @IsOptional()
  @ValidateIf(
    (o) => o.type === FieldType.SELECT || o.type === FieldType.CHECKBOX,
    {
      message: "field type is 'select' so enter otpion values",
    }
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldOptionDTO)
  options?: CreateFieldOptionDTO[];
}

export class CreateServiceTypeDTO {
  @IsString({ message: "name is required" })
  name: string;

  @IsString({ message: "slug is required" })
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  groupId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldDTO)
  fields?: CreateFieldDTO[];
}

export class CreateCategoryDTO {
  @IsString({ message: "name is required" })
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

export class CreateRoleGroupDTO {
  @IsString({ message: "name is required" })
  name: string;
}

// Updates

export class UpdateFieldOptionDTO {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsNumber()
  fieldId?: number;
}

export class UpdateFieldDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsEnum(FieldType)
  type?: FieldType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsNumber()
  serviceId?: number;

  @IsOptional()
  @IsBoolean()
  visibleInSearch?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldOptionDTO)
  options?: CreateFieldOptionDTO[];
}

export class UpdateServiceTypeDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  groupId?: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldDTO)
  fields?: CreateFieldDTO[];
}

export class UpdateCategoryDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}
