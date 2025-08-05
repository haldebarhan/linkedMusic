import { PrismaClient } from "@prisma/client";
import DatabaseService from "./database.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

export class ChatService {
  async getOrCreateConversation(
    senderId: number,
    receiverId: number,
    announcementId?: number
  ) {
    let conversation = await prisma.conversation.findFirst({
      where: {
        senderId,
        receiverId,
        announcementId,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          senderId,
          receiverId,
          announcementId,
        },
      });
    }
    return conversation;
  }

  async getUserConversations(userId: number) {
    return prisma.conversation.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        Messages: true,
        sender: true,
        receiver: true,
        announcement: true,
      },
    });
  }
}
