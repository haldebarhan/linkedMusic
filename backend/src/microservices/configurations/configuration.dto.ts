import { IsIn, IsOptional, IsString } from "class-validator";

export class CreateConfigDTO {
  @IsString({ message: "key is required" })
  key: string;

  @IsString({ message: "value is required" })
  value: string;

  @IsIn(["string", "number", "boolean", "object"], {
    message: "type must be one of: string, number, boolean, object",
  })
  type: "string" | "number" | "boolean" | "object";
}

export class UpdateConfigDTO {
  @IsOptional()
  @IsString({ message: "key is required" })
  key?: string;

  @IsOptional()
  @IsString({ message: "value is required" })
  value?: string;

  @IsOptional()
  @IsIn(["string", "number", "boolean", "object"], {
    message: "type must be one of: string, number, boolean, object",
  })
  type?: "string" | "number" | "boolean" | "object";
}
