import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { SubscribeOption } from "../subscriptions/dto/plan.dto";

export class PaymentDTO {
  @IsString({ message: "paymentMethod is required" })
  paymentMethod: string;

  @IsNumber({}, { message: "planId is required" })
  planId: number;

  @IsOptional()
  @Type(() => SubscribeOption)
  opts?: SubscribeOption;
}
