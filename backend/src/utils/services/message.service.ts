import { PrismaClient } from "@prisma/client";
import DatabaseService from "./database.service";
import { Order } from "../enums/order.enum";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

export class MessageService {
  async createMessage(data: {
    conversationId: number;
    senderId: number;
    content: string;
  }) {
    return prisma.message.create({ data });
  }

  async getMessagesByConversationId(conversationId: number) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: Order.DESC },
    });
  }
}
