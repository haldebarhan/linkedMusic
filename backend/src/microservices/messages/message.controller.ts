import { injectable } from "tsyringe";
import { MessageService } from "./message.service";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { Response } from "express";
import { handleError } from "@/utils/helpers/handle-error";
import { CreateMessageDTO } from "./message.dto";
import { formatResponse } from "@/utils/helpers/response-formatter";

@injectable()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const dto: CreateMessageDTO = Object.assign(
        new CreateMessageDTO(),
        req.body
      );
      const createdMessage = await this.messageService.createMessage(
        user.id,
        dto.announcementId,
        dto.content
      );
      const response = formatResponse(201, createdMessage);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
