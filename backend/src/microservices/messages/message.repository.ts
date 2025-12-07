import { Order } from "../../utils/enums/order.enum";
import DatabaseService from "../../utils/services/database.service";
import { PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class MessageRepository {
  async getUserMessages(params: {
    skip?: number;
    take?: number;
    where?: any;
    order?: Order;
  }) {
    const { where, skip, take, order } = params;
    return await prisma.conversation.findMany({
      where,
      skip,
      take,
      include: {
        messages: {
          orderBy: { createdAt: Order.DESC },
          include: {
            sender: {
              select: {
                profileImage: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: order ?? Order.DESC },
    });
  }

  async findConversation(id: number) {
    return await prisma.conversation.findUnique({ where: { id } });
  }

  async getConversation(id: number) {
    return await prisma.conversation.findFirst({
      where: { id },
      include: {
        messages: true,
      },
    });
  }

  async findMessage(id: number) {
    return await prisma.message.findUnique({
      where: { id },
      include: { conversation: true },
    });
  }

  async markConversationAsRead(id: number, userId: number) {
    return await prisma.conversation.update({
      where: { id },
      data: {
        messages: {
          updateMany: {
            where: {
              readAt: null,
              senderId: { not: userId },
            },
            data: {
              readAt: new Date(),
            },
          },
        },
      },
    });
  }

  async countUserRelationshipRequestsSent(userId: number) {
    return await prisma.conversation.count({
      where: { receiverId: userId },
    });
  }

  async countUserRelationshipRequestsReceived(userId: number) {
    return await prisma.conversation.count({
      where: { senderId: userId },
    });
  }

  async count(where?: any) {
    return await prisma.conversation.count({ where });
  }

  async listThreadsForUser(userId: number, take?: number, skip?: number) {
    return await prisma.conversation.findMany({
      where: { OR: [{ senderId: userId }, { receiver: { id: userId } }] },
      take,
      skip,
      select: {
        id: true,
        senderId: true,
        sender: {
          select: {
            id: true,
            profileImage: true,
            displayName: true,
            badge: true,
          },
        },
        receiver: {
          select: {
            id: true,
            displayName: true,
            profileImage: true,
            badge: true,
          },
        },
        messages: {
          orderBy: { createdAt: Order.DESC },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderId: true,
            readAt: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: { readAt: null, senderId: { not: userId } },
            },
          },
        },
      },
    });
  }

  async countListThread(userId: number) {
    return await prisma.conversation.count({
      where: { OR: [{ senderId: userId }, { receiver: { id: userId } }] },
    });
  }

  async computeUnread(userId: number) {
    return prisma.message.count({
      where: {
        readAt: null,
        conversation: { receiverId: userId },
        senderId: { not: userId },
      },
    });
  }
}
