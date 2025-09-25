import { IsNumber, IsString } from "class-validator";

export class CreateMessageDTO {
  @IsString({ message: "content is required" })
  content: string;

  @IsNumber({}, { message: "announcementId is required" })
  announcementId: number;
}
