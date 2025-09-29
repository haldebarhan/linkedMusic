import { injectable } from "tsyringe";
import { MessageService } from "./message.service";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { Response } from "express";
import { handleError } from "@/utils/helpers/handle-error";
import { CreateMessageDTO, ReplyMessageDTO } from "./message.dto";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { Order } from "@/utils/enums/order.enum";
import { paginatedResponse } from "@/utils/helpers/paginated-response";

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

  async getUserMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const {
        page: pageQuery,
        limit: limitQuery,
        order: orderQuery,
      } = req.query;
      //   const where: any = {};
      //   where.receiverId = user.id;
      const page = parseInt(pageQuery as string) || 1;
      const limit = parseInt(limitQuery as string) || 10;

      const page_number = Math.max(page, 1);
      const limit_query = Math.max(limit, 10);
      //   const order = [Order.ASC, Order.DESC].includes(orderQuery as Order)
      //     ? (orderQuery as Order)
      //     : Order.DESC;

      //   const messages = await this.messageService.getMessages({
      //     limit: limit_query,
      //     page: page_number,
      //     order,
      //     where,
      //   });
      const threads = await this.messageService.listThreadsForUser(
        user.id,
        page_number,
        limit_query
      );
      const response = paginatedResponse(200, threads);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const { id } = req.params;
      const conversation = await this.messageService.getConversation(
        +id,
        user.id
      );
      const response = formatResponse(200, conversation);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async markConversationAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const { id } = req.params;
      await this.messageService.markConversationAsRead(+id, user.id);
      const response = formatResponse(200, "Action completed successfully");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async replyToConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const { id } = req.params;
      const dto: ReplyMessageDTO = Object.assign(
        new ReplyMessageDTO(),
        req.body
      );
      const created = await this.messageService.replyToConversation(
        +id,
        user.id,
        dto.content
      );
      const response = formatResponse(201, created);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
