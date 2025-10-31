import { injectable } from "tsyringe";
import { AnnouncementRepository } from "../annoncements/ann.repository";
import { MessageRepository } from "../messages/message.repository";
import { PaymentRepository } from "../payments/payment.repository";

@injectable()
export class DashboardSerice {
  constructor(
    private readonly announcementRepository: AnnouncementRepository,
    private readonly messageRepository: MessageRepository,
    private paymentRepository: PaymentRepository
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
      this.getTopPublication(userId),
      this.getLastPayments(userId),
      this.countUserTotalActivePublicationViews(userId),
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

  private async getTopPublication(userId: number) {
    const top = await this.announcementRepository.findUserTopPublication(
      userId,
      8
    );
    const formatdata = top.map((p) => {
      return {
        id: p.id,
        title: p.title,
        views: p.views,
        requests: p._count.Conversation,
        status: p.status,
        date: p.createdAt,
      };
    });
    return formatdata;
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
        description: `${p.purpose} ${p.plan.name}`,
      };
    });
    return data;
  }

  private async countUserTotalActivePublicationViews(userId: number) {
    const views =
      await this.announcementRepository.countUserAnnouncementTotalViews(userId);
    return views._sum.views;
  }

  private async countUserTotalRelationRequestReceived(userId: number) {
    return await this.messageRepository.countUserRelationshipRequestsReceived(
      userId
    );
  }
  private async countUserTotalRelationRequestSent(userId: number) {
    return await this.messageRepository.countUserRelationshipRequestsSent(
      userId
    );
  }

  private async countUserTotalActivePublication(userId: number) {
    return await this.announcementRepository.countUserTotalActivePublication(
      userId
    );
  }
}
