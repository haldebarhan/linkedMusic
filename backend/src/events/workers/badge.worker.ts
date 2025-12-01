import logger from "@/config/logger";
import DatabaseService from "@/utils/services/database.service";
import { Badge, PrismaClient, Status } from "@prisma/client";

interface BadgeSpecs {
  announcements: number;
  contactRequests: number;
  upgrade: Badge;
}

const badgeSpecificationsMap: Record<Badge, BadgeSpecs> = {
  [Badge.STANDARD]: {
    announcements: 3,
    contactRequests: 2,
    upgrade: Badge.BRONZE,
  },
  [Badge.BRONZE]: {
    announcements: 5,
    contactRequests: 5,
    upgrade: Badge.SILVER,
  },
  [Badge.SILVER]: { announcements: 7, contactRequests: 7, upgrade: Badge.GOLD },
  [Badge.GOLD]: { announcements: 10, contactRequests: 10, upgrade: Badge.VIP },
  [Badge.VIP]: { announcements: 20, contactRequests: 20, upgrade: Badge.VVIP },
  [Badge.VVIP]: {
    announcements: 9999,
    contactRequests: 9999,
    upgrade: Badge.VVIP,
  },
};

const prisma: PrismaClient = DatabaseService.getPrismaClient();

export const upgradeBadgeJob = async (badge: Badge) => {
  logger.info("🔁 Job démarré : Vérification utilisateur à passer en Bronze");

  const {
    announcements: requiredAnnouncements,
    contactRequests: requiredContactRequests,
    upgrade: next,
  } = getBadgeSpecifications(badge);

  const users = await prisma.user.findMany({
    where: {
      status: Status.ACTIVATED,
      badge,
      announcements: {
        some: {},
      },
      contactRequests: {
        some: {},
      },
    },
    select: {
      id: true,
      _count: {
        select: {
          announcements: true,
          contactRequests: true,
        },
      },
    },
  });

  const eligibleIds = users
    .filter(
      (user) =>
        user._count.announcements >= requiredAnnouncements &&
        user._count.contactRequests >= requiredContactRequests
    )
    .map((user) => user.id);

  if (eligibleIds.length > 0) {
    await prisma.user.updateMany({
      where: {
        id: { in: eligibleIds },
      },
      data: {
        badge: next,
      },
    });
  }

  logger.info(`✅ Job terminé : ${eligibleIds.length} utilisateur(s) promu(s)`);
};

const getBadgeSpecifications = (badge: Badge): BadgeSpecs => {
  const specs = badgeSpecificationsMap[badge];
  if (!specs) {
    throw new Error(`Unknown or terminal badge: ${badge}`);
  }
  return specs;
};
