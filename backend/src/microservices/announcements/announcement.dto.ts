import {
  AnnouncementStatus,
  CHANGEABLE_STATUSES,
  ChangeableStatus,
} from "@/utils/enums/announcement-status.enum";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateAnnoncementDTO {
  @IsString({ message: "title is required" })
  title: string;

  @IsString({ message: "description is required" })
  description: string;

  @IsNumber({}, { message: "serviceTypeId is required" })
  @Type(() => Number)
  serviceTypeId: number;

  @Type(() => Object)
  @IsObject()
  data: Object;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsString({ message: "location is required" })
  location?: string;
}

export class UpdateAnnoncementDTO {
  @IsOptional()
  @IsString({ message: "title is required" })
  title?: string;

  @IsOptional()
  @IsString({ message: "title is required" })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: "serviceTypeId is required" })
  serviceTypeId?: number;

  @IsOptional()
  @IsObject()
  data?: Object;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isHighlighted?: boolean;

  @IsOptional()
  @IsString({ message: "price is required" })
  price?: number;

  @IsOptional()
  @IsString({ message: "location is required" })
  location?: string;
}

export class ChangeStatusDTO {
  @IsIn(CHANGEABLE_STATUSES, {
    message: "status must be PUBLISHED, DRAFT or ARCHIVED",
  })
  status: ChangeableStatus;
}
