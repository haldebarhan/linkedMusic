import DatabaseService from "@/utils/services/database.service";
import { PrismaClient, SubscriptionStatus } from "@prisma/client";
import { injectable } from "tsyringe";
import createError from "http-errors";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

type Eligibility = {
  paidMatching: boolean;
  hasActivePass: boolean;
  alreadyPaid: boolean;
  isOwner: boolean;
};

@injectable()
export class MatchingService {
  async getEligibility(
    userId: number,
    announcementId: number
  ): Promise<Eligibility> {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      select: { ownerId: true },
    });

    if (!announcement) throw createError(404, "Announcement not found");

    const isOwner = announcement.ownerId === userId;
    const paidMatching = await this.getBooleanConfig("paid_matching", false);
    const hasActivePass = await this.hasActiveSubscription(userId);
    const alreadyPaid = await this.hasAlreadyPaidForAnnouncement(
      userId,
      announcementId
    );

    return { paidMatching, hasActivePass, alreadyPaid, isOwner };
  }

  async grantAccessFromPayment(
    userId: number,
    announcementId: number,
    paymentId?: number
  ) {
    await prisma.matchingAccess.upsert({
      where: { userId_announcementId: { userId, announcementId } },
      update: { paymentId: paymentId ?? undefined },
      create: { userId, announcementId, paymentId },
    });
  }

  private async hasActiveSubscription(userId: number): Promise<boolean> {
    const now = new Date();
    const active = await prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { gt: now },
      },
      select: { id: true },
    });
    return !!active;
  }

  private async getBooleanConfig(key: string, fallback = false) {
    const row = await prisma.appConfig
      .findUnique({ where: { key } })
      .catch(() => null);
    if (!row) return fallback;
    const v = String(row.value ?? "")
      .trim()
      .toLowerCase();
    return v === "true" || v === "1" || v === "yes";
  }

  private async hasAlreadyPaidForAnnouncement(
    userId: number,
    announcementId: number
  ): Promise<boolean> {
    const access = await prisma.matchingAccess
      .findUnique({
        where: { userId_announcementId: { userId, announcementId } },
        select: { id: true },
      })
      .catch(() => null);
    return !!access;
  }
}
