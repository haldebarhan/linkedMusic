import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateContactRequestDTO {
  @IsInt()
  @IsNotEmpty({ message: "L'ID de l'annonce est requis" })
  announcementId: number;

  @IsString()
  @IsOptional()
  @MinLength(20, { message: "Le message doit contenir au moins 20 caractères" })
  @MaxLength(500, { message: "Le message ne peut pas dépasser 500 caractères" })
  message?: string;
}

export class ContactRequestFiltersDto {
  @IsInt()
  @IsOptional()
  announcementId?: number;

  @IsString()
  @IsOptional()
  status?: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELED";
}
