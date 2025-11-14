import { injectable } from "tsyringe";
import { MessageRepository } from "../messages/message.repository";
import { PaymentRepository } from "../payments/payment.repository";
import { ContactRequestRepository } from "../contact-requests/contact-request.repository";
import { AnnouncementRepository } from "../annoncements/anouncement.repository";

@injectable()
export class DashboardSerice {
  constructor(
    private readonly messageRepository: MessageRepository,
    private paymentRepository: PaymentRepository,
    private readonly contactRequestRepository: ContactRequestRepository,
    private readonly announcementRepository: AnnouncementRepository
  ) {}

  async userDashboard(userId: number) {
    return await this.getGlobalStats(userId);
  }

  private async getGlobalStats(userId: number) {
    const [
      publications,
      payments,
      totalViews,
      requestReceived,
      requestSent,
      totalActive,
    ] = await Promise.all([
      this.getUserMostViewAnnouncements(userId),
      this.getLastPayments(userId),
      this.countUserTotalViews(userId),
      this.countUserTotalRelationRequestReceived(userId),
      this.countUserTotalRelationRequestSent(userId),
      this.countUserTotalActivePublication(userId),
    ]);
    return {
      publications,
      payments,
      totalViews,
      requestReceived,
      requestSent,
      totalActive,
    };
  }

  private async getLastPayments(userId: number) {
    const payments = await this.paymentRepository.getUserLastPayments(userId);
    const data = payments.map((p) => {
      return {
        id: p.id,
        transactionId: p.reference,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        method: p.provider,
        date: p.createdAt,
      };
    });
    return data;
  }

  private async countUserTotalRelationRequestReceived(userId: number) {
    return await this.contactRequestRepository.countUserTotalAnnouncementRequest(
      userId
    );
  }
  private async countUserTotalRelationRequestSent(userId: number) {
    return await this.contactRequestRepository.countUserTotalContactRequestSent(
      userId
    );
  }

  private async getUserMostViewAnnouncements(userId: number) {
    return await this.announcementRepository.getUserMostViewAnnouncement(
      userId
    );
  }

  private async countUserTotalViews(userId: number) {
    const total =
      await this.announcementRepository.countUserTotalAnnouncementViews(userId);
    return total._sum.views;
  }

  private async countUserTotalActivePublication(userId: number) {
    return await this.announcementRepository.countUserTotalActivePublications(
      userId
    );
  }
}
