import { AnnouncementController } from "@/microservices/annoncements/ann.controller";
import { MatchingController } from "@/microservices/matching/matching.controller";
import { MessageController } from "@/microservices/messages/message.controller";
import { PaymentController } from "@/microservices/payments/payment.controller";
import { SubscriptionController } from "@/microservices/subscriptions/subscription.controller";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { Response, Request } from "express";
import { injectable } from "tsyringe";

@injectable()
export class UserController {
  constructor(
    private readonly announcementController: AnnouncementController,
    private readonly matchingController: MatchingController,
    private readonly messageController: MessageController,
    private readonly subscriptionController: SubscriptionController,
    private readonly payementController: PaymentController
  ) {}

  // Announcements

  async createAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.createAnnouncement(req, res);
  }
  async updateAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.update(req, res);
  }

  async findAnnouncements(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.findAnnouncements(req, res);
  }

  async removeAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.remove(req, res);
  }

  async findAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.findOne(req, res);
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
}
