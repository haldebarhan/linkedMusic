import { injectable } from "tsyringe";
import { PaymentRepository } from "./payment.repository";
import { PlanRepository } from "../subscriptions/plan.repository";
import { SubscriptionRepository } from "../subscriptions/subscription.repository";
import { PaymentDTO } from "./payment.dto";
import createError from "http-errors";
import { generateRandomUUID } from "../../utils/functions/utilities";
import {
  PaymentProvider,
  PaymentStatus,
  Prisma,
  PrismaClient,
  SubscriptionStatus,
} from "@prisma/client";
import { ENV } from "../../config/env";
import { enqueuePaymentPendingJob } from "../../events/jobs/payment-pending.job";
import DatabaseService from "../../utils/services/database.service";
import { addDays } from "date-fns";
import { SubscribeOption } from "../subscriptions/dto/plan.dto";
import { Order } from "../../utils/enums/order.enum";
import { S3Service } from "../../utils/services/s3.service";
import { syncPaymentStatusByReference } from "../../utils/functions/sync-paiment-status";
import { Jeko } from "../../core/payments/Jeko/jeko";

const prisma: PrismaClient = DatabaseService.getPrismaClient();
const minioService: S3Service = S3Service.getInstance();

@injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly planRepository: PlanRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly jekoPayment: Jeko
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
    const { planId, paymentMethod, opts } = dto;
    const { userId } = userData;
    const plan = await this.checkIfPlanIsActive(planId);
    await this.checkIfUserAlreadyClaimed(plan, userId);

    const reference = generateRandomUUID();
    const priceCents = plan.priceCents * 100;
    const payment = await this.paymentRepository.createPayement({
      userId,
      reference,
      amount: plan.priceCents,
      provider: PaymentProvider.JEKO,
      planId,
      status: plan.isFree ? PaymentStatus.SUCCEEDED : PaymentStatus.PENDING,
    });

    if (!plan.isFree) {
      const createRes = await this.jekoPayment.createPaymentLink(
        reference,
        priceCents,
        paymentMethod!
      );
      await this.paymentRepository.update(payment.id, {
        externalId: createRes.transactionId,
      });

      await enqueuePaymentPendingJob(payment.externalId!);
      if (createRes.success) {
        return {
          success: createRes.success,
          paymentUrl: createRes.paymentUrl,
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
      ENV.AWS_S3_DEFAULT_BUCKET,
      user.profileImage
    );

    return {
      success: true,
      returnUrl: `${ENV.BASE_URL}/payment/success`,
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
