import { PlanPeriod } from "../../../utils/enums/period.enum";
import { generateRandomUUID } from "../../../utils/functions/utilities";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class CreatePlanDTO {
  @IsString({ message: "name is required" })
  name: string;

  @IsEnum(PlanPeriod, { message: "period is required" })
  period: PlanPeriod;

  @IsOptional()
  @IsNumber({}, { message: "priceCents must be number" })
  priceCents?: number;

  @IsOptional()
  @IsNumber({}, { message: "parentId must be number" })
  parentId?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBenefit)
  benefits: CreateBenefit[];
}

export class SubscribeOption {
  @IsOptional()
  @IsBoolean()
  cancelCurrent?: boolean;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}

export class UpdatePlanDTO {
  @IsOptional()
  @IsString({ message: "name is required" })
  name?: string;

  @IsOptional()
  @IsString({ message: "slug is required" })
  slug?: string;

  @IsOptional()
  @IsEnum(PlanPeriod, { message: "period is required" })
  period?: PlanPeriod;

  @IsOptional()
  @IsOptional()
  @IsNumber({}, { message: "priceCents must be number" })
  priceCents?: number;

  @IsOptional()
  @IsNumber({}, { message: "parentId must be number" })
  parentId?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBenefit)
  benefits?: CreateBenefit[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  benefitsToRemove?: number[];
}

export class CreateBenefit {
  @IsString({ message: "code is required" })
  code: string = generateRandomUUID();

  @IsString({ message: "label is required" })
  label: string;
}

export class SubscribeDTO {
  @IsNumber({}, { message: "PlanId is required" })
  planId: number;

  @IsOptional()
  @Type(() => SubscribeOption)
  opts?: SubscribeOption;
}
