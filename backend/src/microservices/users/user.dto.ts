import { Role } from "@/utils/enums/role.enum";
import { Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";

export class CreateUserDTO {
  @IsEmail({}, { message: "pseudo is required" })
  email: string;

  @IsString({ message: "pseudo is required" })
  pseudo: string;

  @IsOptional()
  @IsEnum(Role, {
    message: `role must be ${Role.USER}, ${Role.ADMIN} or ${Role.PROVIDER}`,
  })
  role: Role = Role.USER;

  @IsString({ message: "password is required" })
  @MinLength(6, { message: "password must be longer than 6 characters" })
  password: string;
}

export class UpdateUserDTO {
  @IsString()
  lastName: string;

  @IsString()
  firstName: string;

  @IsString()
  displayName: string;

  @IsString()
  phone: string;

  @IsString()
  location: string;

  @IsString()
  country: string;
}

export class VerifyToken {
  @IsEmail({}, { message: "email is required" })
  email: string;

  @IsString({ message: "token is required" })
  token: string;
}

export class LoginDTO {
  @IsEmail({}, { message: "email is required" })
  email: string;

  @IsString({ message: "password is required" })
  password: string;
}

export class ForgotPasswordDTO {
  @IsNotEmpty({ message: "email is required" })
  @IsEmail({}, { message: "Please enter valid email address" })
  email: string;
}

export class ResetPasswordDTO {
  @IsNotEmpty({ message: "password is required" })
  @IsString({ message: "password must be valid string" })
  password: string;

  @IsNotEmpty({ message: "token is required" })
  @IsString({ message: "token must be valid string" })
  token: string;
}

export class ChangePasswordDTO {
  @IsNotEmpty({ message: "password is required" })
  @IsString({ message: "password must be valid string" })
  password: string;
}
