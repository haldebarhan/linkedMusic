import { IsNumber } from "class-validator";

export class CreateSubscription {
  @IsNumber({}, { message: "planId is required" })
  planId: number;
  startAt: Date;
  endAt: Date | null;
  autoRenew: boolean;
}
