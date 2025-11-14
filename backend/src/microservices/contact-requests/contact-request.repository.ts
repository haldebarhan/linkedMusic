import DatabaseService from "@/utils/services/database.service";
import { PrismaClient, ContactRequestStatus } from "@prisma/client";
import { injectable } from "tsyringe";
import { CreateContactRequestDTO } from "./contact-request.dto";
import { Order } from "@/utils/enums/order.enum";

const prisma: PrismaClient = DatabaseService.getPrismaClient();
@injectable()
export class ContactRequestRepository {
  async create(userId: number, dto: CreateContactRequestDTO) {
    const { announcementId, message } = dto;
    return await prisma.contactRequest.create({
      data: {
        announcementId,
        requesterId: userId,
        message,
        status: ContactRequestStatus.PENDING,
      },
    });
  }

  async existingContactRequest(announcementId: number, userId: number) {
    return await prisma.contactRequest.findUnique({
      where: {
        announcementId_requesterId: {
          announcementId,
          requesterId: userId,
        },
      },
    });
  }

  async getUserRequestForAnnouncement(userId: number, announcementId: number) {
    return await prisma.contactRequest.findUnique({
      where: {
        announcementId_requesterId: {
          announcementId,
          requesterId: userId,
        },
      },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            profileImage: true,
            location: true,
          },
        },
      },
    });
  }

  async getAnnouncementRequests(announcementId: number) {
    return await prisma.contactRequest.findMany({
      where: {
        announcementId,
      },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            profileImage: true,
            location: true,
          },
        },
      },
      orderBy: [{ status: Order.ASC }, { createdAt: Order.DESC }],
    });
  }

  async findRequest(requestId: number) {
    return await prisma.contactRequest.findUnique({
      where: { id: requestId },
      include: {
        announcement: true,
        requester: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });
  }

  async countUserTotalAnnouncementRequest(userId: number) {
    return await prisma.contactRequest.count({
      where: {
        announcement: { ownerId: userId },
        requesterId: { not: userId },
      },
    });
  }

  async countUserTotalContactRequestSent(userId: number) {
    return await prisma.contactRequest.count({
      where: {
        announcement: { ownerId: { not: userId } },
        requesterId: userId,
      },
    });
  }
}
