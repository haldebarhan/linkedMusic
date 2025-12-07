import { injectable } from "tsyringe";
import { MatchingService } from "../matching/matching.service";
import createError from "http-errors";
import { PrismaClient } from "@prisma/client";
import DatabaseService from "../../utils/services/database.service";
import { Order } from "../../utils/enums/order.enum";
import { MessageRepository } from "./message.repository";
import { ENV } from "../../config/env";
import { S3Service } from "../../utils/services/s3.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();
const minioService: S3Service = S3Service.getInstance();

@injectable()
export class MessageService {
  constructor(
    private readonly matching: MatchingService,
    private readonly messageRepository: MessageRepository
  ) {}

  async createMessage(userId: number, announcementId: number, content: string) {
    const { paidMatching, hasActivePass, alreadyPaid, isOwner } =
      await this.matching.getEligibility(userId, announcementId);
    if (isOwner)
      throw createError(409, "You cannot contact your own announcement");

    const allowed = !paidMatching || hasActivePass || alreadyPaid;
    if (!allowed) throw createError(402, "Payment required");

    const ann = await prisma.announcement.findUnique({
      where: { id: announcementId },
      select: { ownerId: true },
    });

    if (!ann) throw createError(404, "Announcement not found");

    const conversation = await prisma.conversation.upsert({
      where: {
        senderId_receiverId_announcementId: {
          senderId: userId,
          receiverId: ann.ownerId,
          announcementId,
        },
      },
      update: {},
      create: {
        senderId: userId,
        receiverId: ann.ownerId,
        announcementId,
      },
    });

    const message = await prisma.message.create({
      data: { conversationId: conversation.id, senderId: userId, content },
      include: { conversation: true },
    });
    return message;
  }

  async getMessages(params: {
    limit: number;
    page: number;
    order: Order;
    where?: any;
  }) {
    const { limit, page, order, where } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.messageRepository.getUserMessages({
        where,
        take: limit,
        skip,
        order,
      }),
      this.messageRepository.count(where),
    ]);
    const threadRow = await this.buildThreadRow(data);
    return {
      data: threadRow,
      metadata: {
        total,
        page,
        totalPage: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  async replyToConversation(
    conversationId: number,
    userId: number,
    content: string
  ) {
    const conversation = await this.getConversation(conversationId, userId);
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content,
      },
    });

    return message;
  }

  async getConversation(conversationId: number, userId: number) {
    const conversation = await this.messageRepository.getConversation(
      conversationId
    );
    if (!conversation) throw createError(404, "Conversation not found");
    if (conversation.receiverId !== userId && conversation.senderId !== userId)
      throw createError(403, "Forbidden");
    return conversation;
  }

  async markConversationAsRead(conversationId: number, userId: number) {
    const conversation = await this.getConversation(conversationId, userId);
    const marked = await this.messageRepository.markConversationAsRead(
      conversation.id,
      userId
    );
    return marked;
  }

  async listThreadsForUser(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.messageRepository.listThreadsForUser(userId, limit, skip),
      this.messageRepository.countListThread(userId),
    ]);

    const hasActiveSubscription = await this.matching.hasActiveSubscription(
      userId
    );
    const threadRow = await this.buildThreadRows(
      rows,
      userId,
      hasActiveSubscription
    );
    return {
      data: threadRow,
      metadata: {
        total,
        page,
        totalPage: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  //   private async emitToUser(conversation: any, message: any, userId: number) {
  //     const peerId =
  //       conversation.senderId === userId
  //         ? conversation.receiverId
  //         : conversation.senderId;
  //     const io = getIo();

  //     io.to(rooms.userRoom(peerId)).emit("message:new", {
  //       id: message.id,
  //       threadId: conversation.id,
  //       senderId: userId,
  //       content: message.content,
  //       createdAt: message.createdAt.toISOString(),
  //     });

  //     // 2) push "thread:updated" chez les 2 (aperçu liste de gauche)
  //     const snippet = (message.content || "").replace(/\s+/g, " ").slice(0, 120);
  //     io.to([rooms.userRoom(peerId), rooms.userRoom(userId)]).emit(
  //       "thread:updated",
  //       {
  //         threadId: conversation.id,
  //         lastSnippet: snippet,
  //         lastAt: message.createdAt.toISOString(),
  //       }
  //     );

  //     const unread = await this.messageRepository.computeUnread(peerId);
  //     io.to(rooms.userRoom(peerId)).emit("notif:unread", { total: unread });
  //   }

  private async buildThreadRows(
    data: any[],
    userId: number,
    hasActiveSubscription: boolean
  ) {
    const threadRow = await Promise.all(
      data.map(async (c) => {
        const id = c.id;
        const last = c.Messages[0];
        const peer = c.senderId === userId ? c.receiver : c.sender;
        const peerName = hasActiveSubscription
          ? peer?.displayName
          : "Utilisateur (masqué)";
        const peerAvatar = hasActiveSubscription
          ? peer.profileImage
            ? await minioService.generatePresignedUrl(
                ENV.AWS_S3_DEFAULT_BUCKET,
                peer.profileImage
              )
            : ""
          : "https://placehold.co/60x60";
        const count = c._count.Messages ?? 0;

        return {
          id,
          peerName,
          peerId: peer.id,
          threadId: id,
          peerAvatar,
          unreadCount: count,
          lastSnippet: hasActiveSubscription ? last.content : "••••••",
          lastAt: last.createdAt,
        };
      })
    );
    return threadRow;
  }

  private async buildThreadRow(data: any[]) {
    const threadRow = await Promise.all(
      data.map(async (item) => {
        try {
          const id = item.id;
          const firstMessage = item.Messages?.[0];
          if (!firstMessage) {
            return {
              id,
              peerName: "Inconnu",
              threadId: id,
              peerAvatar: "",
              unreadCount: 0,
              lastMessage: "",
              lastMessageAt: null,
            };
          }
          const peerName =
            firstMessage.sender?.Profile?.displayName || "Inconnu";
          let peerAvatar = "";
          if (firstMessage.sender?.profileImage) {
            try {
              peerAvatar = await minioService.generatePresignedUrl(
                ENV.AWS_S3_DEFAULT_BUCKET,
                firstMessage.sender.profileImage
              );
            } catch (error) {
              console.error("Erreur génération URL avatar:", error);
            }
          }
          const unreadCount = item.Messages.filter(
            (message: any) => message.readAt === null
          ).length;

          return {
            id,
            peerName,
            threadId: id,
            peerAvatar,
            unreadCount,
            lastSnippet: firstMessage.content || "",
            lastAt: firstMessage.createdAt,
            messageCount: item.Messages.length,
          };
        } catch (error) {
          console.error(`Erreur traitement thread ${item.id}:`, error);
          return {
            id: item.id,
            threadId: item.id,
            peerName: "Erreur",
            peerAvatar: "",
            unreadCount: 0,
            lastSnippet: "",
            lastAt: null,
          };
        }
      })
    );
    return threadRow;
  }
}
