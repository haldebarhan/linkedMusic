import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { SubscribeOption } from "../subscriptions/dto/plan.dto";

export class PaymentDTO {
  @IsString()
  address: string;

  @IsString()
  zipCode: string;

  @IsString()
  country: string;

  @IsString()
  city: string;

  @IsString()
  phone: string;

  @IsNumber({}, { message: "planId is required" })
  planId: number;

  @IsOptional()
  @Type(() => SubscribeOption)
  opts?: SubscribeOption;
}
