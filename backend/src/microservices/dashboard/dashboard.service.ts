import { injectable } from "tsyringe";
import { MessageRepository } from "../messages/message.repository";
import { PaymentRepository } from "../payments/payment.repository";

@injectable()
export class DashboardSerice {
  constructor(
    private readonly messageRepository: MessageRepository,
    private paymentRepository: PaymentRepository
  ) {}

  async userDashboard(userId: number) {
    return await this.getGlobalStats(userId);
  }

  private async getGlobalStats(userId: number) {
    const [publications, payments, totalViews] = await Promise.all([
      this.getLastPayments(userId),
      this.countUserTotalRelationRequestReceived(userId),
      this.countUserTotalRelationRequestSent(userId),
    ]);
    return {
      publications,
      payments,
      totalViews,
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
    return await this.messageRepository.countUserRelationshipRequestsReceived(
      userId
    );
  }
  private async countUserTotalRelationRequestSent(userId: number) {
    return await this.messageRepository.countUserRelationshipRequestsSent(
      userId
    );
  }
}
