import { DashBoardController } from "../../microservices/dashboard/dashboard.controller";
import { MatchingController } from "../../microservices/matching/matching.controller";
import { MessageController } from "../../microservices/messages/message.controller";
import { PaymentController } from "../../microservices/payments/payment.controller";
import { SubscriptionController } from "../../microservices/subscriptions/subscription.controller";
import { AuthenticatedRequest } from "../../utils/interfaces/authenticated-request";
import { Response, Request } from "express";
import { injectable } from "tsyringe";
import { AnnouncementController } from "../../microservices/annoncements/announcement.controller";
import { ContactRequestController } from "../../microservices/contact-requests/contact-request.controller";

@injectable()
export class UserController {
  constructor(
    private readonly matchingController: MatchingController,
    private readonly messageController: MessageController,
    private readonly subscriptionController: SubscriptionController,
    private readonly payementController: PaymentController,
    private readonly dashboardController: DashBoardController,
    private readonly announcementController: AnnouncementController,
    private readonly contactController: ContactRequestController,
    private readonly paimentController: PaymentController
  ) {}

  // Announcement New Version

  async createAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.createAnnouncement(req, res);
  }
  async updateAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.updateAnnouncement(req, res);
  }

  async removeAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.deleteAnnouncement(req, res);
  }

  async publishAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.publishAnnouncement(req, res);
  }
  async archiveAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.archiveAnnouncement(req, res);
  }
  async myAnnouncements(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.getMyAnnouncements(req, res);
  }
  async myAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.getMyAnnouncement(req, res);
  }

  async myRecentViews(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.userRecentViews(req, res);
  }

  async addToRecentViews(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.addToRecentViews(req, res);
  }

  async likeAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.likeAnnouncement(req, res);
  }
  async unlikeAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.unlikeAnnouncement(req, res);
  }
  async announcementlikeStatus(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.likeStatus(req, res);
  }

  async removeToRecentViews(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.removeToRecentViews(req, res);
  }

  async removeAllRecentViews(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.removeALLRecentViews(req, res);
  }

  async myLikedAnnouncements(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.mylikedAnnouncements(req, res);
  }

  // Matching

  async eligibility(req: AuthenticatedRequest, res: Response) {
    return await this.matchingController.eligibility(req, res);
  }

  // Messaging

  async createMessage(req: AuthenticatedRequest, res: Response) {
    return await this.messageController.create(req, res);
  }
  async getMessages(req: AuthenticatedRequest, res: Response) {
    return await this.messageController.getUserMessages(req, res);
  }

  async getConversationMessages(req: AuthenticatedRequest, res: Response) {
    return await this.messageController.getConversation(req, res);
  }

  async markConversationAsRead(req: AuthenticatedRequest, res: Response) {
    return await this.messageController.markConversationAsRead(req, res);
  }
  async replyToConversation(req: AuthenticatedRequest, res: Response) {
    return await this.messageController.replyToConversation(req, res);
  }

  // SUBSCRIPTION PLAN

  async subscribe(req: AuthenticatedRequest, res: Response) {
    return await this.subscriptionController.subscribe(req, res);
  }

  // PAIMENTS
  async makePayment(req: AuthenticatedRequest, res: Response) {
    return await this.payementController.makePayment(req, res);
  }
  async checkReference(req: AuthenticatedRequest, res: Response) {
    return await this.payementController.checkPaymentStatus(req, res);
  }

  // Dashboard

  async getDashboard(req: AuthenticatedRequest, res: Response) {
    return await this.dashboardController.getUserDashboard(req, res);
  }

  // Contact Request

  async createContract(req: AuthenticatedRequest, res: Response) {
    return await this.contactController.createRequest(req, res);
  }
  async getMyRequest(req: AuthenticatedRequest, res: Response) {
    return await this.contactController.getMyRequest(req, res);
  }
  async getAnnouncementRequests(req: AuthenticatedRequest, res: Response) {
    return await this.contactController.getAnnouncementRequests(req, res);
  }
  async acceptRequest(req: AuthenticatedRequest, res: Response) {
    return await this.contactController.acceptRequest(req, res);
  }
  async rejectRequest(req: AuthenticatedRequest, res: Response) {
    return await this.contactController.rejectRequest(req, res);
  }
  async cancelRequest(req: AuthenticatedRequest, res: Response) {
    return await this.contactController.cancelRequest(req, res);
  }

  // Paiments
  async myPayments(req: AuthenticatedRequest, res: Response) {
    return await this.paimentController.getUserPayments(req, res);
  }
}
