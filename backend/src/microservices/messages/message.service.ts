import { injectable } from "tsyringe";
import { MatchingService } from "../matching/matching.service";
import createError from "http-errors";
import { PrismaClient } from "@prisma/client";
import DatabaseService from "@/utils/services/database.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class MessageService {
  constructor(private readonly matching: MatchingService) {}

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

    return prisma.message.create({
      data: { conversationId: conversation.id, senderId: userId, content },
    });
  }
}
