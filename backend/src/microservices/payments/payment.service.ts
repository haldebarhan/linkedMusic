import { injectable } from "tsyringe";
import { PaymentRepository } from "./payment.repository";
import { PlanRepository } from "../subscriptions/plan.repository";
import { SubscriptionRepository } from "../subscriptions/subscription.repository";
import { PaymentDTO } from "./payment.dto";
import createError from "http-errors";
import { generateRandomUUID } from "@/utils/functions/utilities";
import {
  PaymentStatus,
  Prisma,
  PrismaClient,
  SubscriptionStatus,
} from "@prisma/client";
import { CinetPayClient } from "@/core/payments/cinet-pay/cinet-pay";
import { ENV } from "@/config/env";
import { enqueuePaymentPendingJob } from "@/events/jobs/payment-pending.job";
import DatabaseService from "@/utils/services/database.service";
import { addDays } from "date-fns";
import { SubscribeOption } from "../subscriptions/dto/plan.dto";
import { syncPaymentStatusByReference } from "@/utils/functions/sync-paiment-status";
import { Order } from "@/utils/enums/order.enum";
import { MinioService } from "@/utils/services/minio.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();
const minioService: MinioService = MinioService.getInstance();

@injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly planRepository: PlanRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentProvider: CinetPayClient
  ) {}

  async createSubscriptionPayment(
    userData: {
      userId: number;
      firstName: string;
      lastName: string;
      email: string;
    },
    dto: PaymentDTO
  ) {
    const { planId, address, zipCode, country, city, phone, opts } = dto;
    const { userId, firstName, lastName, email } = userData;
    const plan = await this.checkIfPlanIsActive(planId);
    await this.checkIfUserAlreadyClaimed(plan, userId);

    const reference = generateRandomUUID();
    const payment = await this.paymentRepository.createPayement({
      userId,
      reference,
      amount: plan.priceCents,
      planId,
      status: plan.isFree ? PaymentStatus.SUCCEEDED : PaymentStatus.PENDING,
    });

    if (!plan.isFree) {
      const createRes = await this.paymentProvider.createPaymentLink({
        amount: plan.priceCents,
        description: `Souscription ${plan.name}`,
        reference,
        customerPhone: phone,
        customerAddress: address,
        customerCountry: country,
        customerState: country,
        customerCity: city,
        customerZipCode: zipCode,
        customerEmail: email,
        customerSurname: firstName,
        customerName: lastName,
      });

      await enqueuePaymentPendingJob(payment.reference);
      if (createRes.success) {
        return {
          success: createRes.success,
          paymentUrl: createRes.paymentUrl,
          paymentToken: createRes.paymentToken,
          transactionId: createRes.transactionId,
        };
      } else {
        throw createError(500, "Une erreur est survenue!");
      }
    }

    const user = await prisma.$transaction(async (tx) => {
      const { user } = await this.ensureSubscriptionActivated(
        tx,
        userId,
        plan,
        opts
      );
      return user;
    });
    user.profileImage = await minioService.generatePresignedUrl(
      ENV.MINIO_BUCKET_NAME,
      user.profileImage
    );

    return {
      success: true,
      returnUrl: ENV.PAYMENT_PROVIDER_RETURN_URL,
      transactionId: reference,
      user,
    };
  }

  async findPaymentByReference(reference: string, userId: number) {
    const payment = await syncPaymentStatusByReference(reference);
    if (!payment || payment.userId !== userId) {
      throw createError(404, "Reference not found");
    }
    return payment;
  }
  async findUserPayments(
    userId: number,
    params: {
      page: number;
      limit: number;
      sortBy: string;
      status: string;
      sortOrder: Order;
    }
  ) {
    const { page, limit, sortBy, status, sortOrder } = params;
    const { data, total } = await this.paymentRepository.getUserPayments(
      userId,
      { status },
      { page, limit, sortBy, sortOrder }
    );
    return {
      data,
      metadata: {
        total,
        page,
        totalPage: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  private async ensureSubscriptionActivated(
    tx: Prisma.TransactionClient,
    userId: number,
    plan: any,
    opts?: SubscribeOption
  ) {
    const endAt = this.computeEndAt(plan.durationDays);
    const autoRenew = opts?.autoRenew ?? !plan.isFree;

    const [sub] = await Promise.all([
      tx.userSubscription.create({
        data: {
          userId,
          planId: plan.id,
          startAt: new Date(),
          endAt,
          autoRenew,
        },
      }),
      plan.isFree
        ? tx.freeClaim.create({
            data: { userId },
          })
        : Promise.resolve(),
    ]);

    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          select: {
            startAt: true,
            endAt: true,
            autoRenew: true,
            status: true,
            plan: {
              select: {
                name: true,
                period: true,
                priceCents: true,
                benefits: { select: { benefit: { select: { label: true } } } },
              },
            },
          },
        },
      },
    });

    return { sub, user };
  }

  private computeEndAt(durationDays?: number | null): Date | null {
    return durationDays && durationDays > 0
      ? addDays(new Date(), durationDays)
      : null;
  }

  private async checkIfPlanIsActive(planId: number) {
    const plan = await this.planRepository.findById(planId);
    if (!plan || plan.active === false) {
      throw createError(404, "Plan not found");
    }
    return plan;
  }

  private async checkIfUserAlreadyClaimed(plan: any, userId: number) {
    if (plan.isFree) {
      const alreadyClaimed = await this.subscriptionRepository.freeClaimExists(
        userId
      );
      if (alreadyClaimed) {
        throw createError(
          409,
          "Vous avez déjà bénéficié de l'abonnement gratuit."
        );
      }
    }
  }
}
