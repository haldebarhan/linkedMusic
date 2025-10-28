import { injectable } from "tsyringe";
import { PlanRepository } from "./plan.repository";
import { SubscriptionRepository } from "./subscription.repository";
import { addDays } from "date-fns";
import createError from "http-errors";
import { PlanPeriod } from "@/utils/enums/period.enum";
import {
  CreateBenefit,
  CreatePlanDTO,
  SubscribeDTO,
  UpdatePlanDTO,
} from "./dto/plan.dto";
import { PrismaClient } from "@prisma/client";
import DatabaseService from "@/utils/services/database.service";
import { Order } from "@/utils/enums/order.enum";
import { PaymentRepository } from "../payments/payment.repository";
import { PaymentDTO } from "../payments/payment.dto";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

// Configuration des durées en jours pour chaque période
const PERIOD_DURATION_MAP: Record<PlanPeriod, number> = {
  [PlanPeriod.ANNUAL]: 12 * 28,
  [PlanPeriod.SEMIANNUAL]: 6 * 28,
  [PlanPeriod.QUARTERLY]: 4 * 28,
  [PlanPeriod.BIMONTHLY]: 2 * 28,
  [PlanPeriod.MONTHLY]: 28,
  [PlanPeriod.FREE]: 28,
  [PlanPeriod.CUSTOM]: 28, // Ajout de la période CUSTOM avec une valeur par défaut
};

// Configuration des slugs pour chaque période
const PERIOD_SLUG_MAP: Record<PlanPeriod, string> = {
  [PlanPeriod.ANNUAL]: "ANNUAL_PLAN",
  [PlanPeriod.SEMIANNUAL]: "SEMIANNUAL_PLAN",
  [PlanPeriod.QUARTERLY]: "QUARTERLY_PLAN",
  [PlanPeriod.BIMONTHLY]: "BIMONTHLY_PLAN",
  [PlanPeriod.MONTHLY]: "MONTHLY_PLAN",
  [PlanPeriod.FREE]: "FREE_PLAN",
  [PlanPeriod.CUSTOM]: "CUSTOM_PLAN",
};

@injectable()
export class SubscriptionService {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentRepository: PaymentRepository
  ) {}

  async subscribe(userId: number, data: SubscribeDTO) {
    const { planId, opts } = data;
    const plan = await this.planRepository.findById(planId);

    if (!plan || plan.active === false) {
      throw createError(404, "Plan not found");
    }

    // Vérifier si l'utilisateur a déjà réclamé le plan gratuit
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

    // Annuler l'abonnement actif si nécessaire
    if (opts?.cancelCurrent !== false) {
      await this.subscriptionRepository.cancelActive(userId);
    }

    const endAt = this.computeEndAt(plan.durationDays);
    const autoRenew = opts?.autoRenew ?? !plan.isFree;

    // Créer l'abonnement et enregistrer la réclamation gratuite en parallèle si nécessaire
    const [sub] = await Promise.all([
      this.subscriptionRepository.create(
        userId,
        plan.id,
        new Date(),
        endAt,
        autoRenew
      ),
      plan.isFree
        ? this.subscriptionRepository.insertFreeClaim(userId)
        : Promise.resolve(),
    ]);

    return sub;
  }

  async findSubscriptionPlans(params: {
    limit: number;
    page: number;
    order: Order;
    where?: any;
  }) {
    const { limit, page, order, where } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.planRepository.findAll({ skip, take: limit, order, where }),
      this.planRepository.count(where),
    ]);

    return {
      data: this.formatSubscriptionData(data),
      metadata: {
        total,
        page,
        totalPage: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  async createPlan(input: CreatePlanDTO) {
    return await prisma.$transaction(async (tx) => {
      const { benefits, parentId, period, ...rest } = input;

      // Vérifier l'existence du plan parent si spécifié
      const parentPlan = parentId
        ? await tx.subscriptionPlan.findUnique({ where: { id: parentId } })
        : null;

      // Configuration du plan selon la période
      const planData = {
        ...rest,
        priceCents: period === PlanPeriod.FREE ? 0 : rest.priceCents,
        durationDays: this.getDurationDays(period),
        period,
        slug: this.generateSlug(period),
        isFree: period === PlanPeriod.FREE,
        parentId: parentPlan ? parentId : null,
      };

      const plan = await tx.subscriptionPlan.create({ data: planData });

      // Créer les bénéfices et les hériter du parent en parallèle
      await Promise.all([
        this.createBenefitAndAssociateToPlan(benefits, plan.id, tx),
        parentPlan
          ? this.addParentBenefitsToPlan(parentId!, plan.id, tx)
          : Promise.resolve(),
      ]);

      return plan;
    });
  }

  async findOne(id: number) {
    const plan = await this.planRepository.findById(id);
    if (!plan) {
      throw createError(404, "Plan not found");
    }
    return plan;
  }

  async update(id: number, data: UpdatePlanDTO) {
    return await prisma.$transaction(async (tx) => {
      const { benefits, benefitsToRemove, parentId, ...planData } = data;
      const plan = await this.findOne(id);

      // Gérer le changement de plan parent
      if (parentId && parentId !== plan.parentId) {
        await this.findOne(parentId); // Vérifier l'existence du nouveau parent

        // Supprimer les bénéfices hérités de l'ancien parent
        const nonInheritedBenefitIds = plan.benefits
          .filter((b: any) => b.inherited)
          .map((b: any) => b.benefit.id);

        await Promise.all([
          tx.planBenefit.deleteMany({
            where: {
              planId: id,
              benefitId: { in: nonInheritedBenefitIds },
            },
          }),
          this.addParentBenefitsToPlan(parentId, plan.id, tx),
        ]);
      }

      // Supprimer et créer les bénéfices en parallèle
      await Promise.all([
        benefitsToRemove?.length
          ? tx.planBenefit.deleteMany({
              where: {
                planId: id,
                benefitId: { in: benefitsToRemove },
              },
            })
          : Promise.resolve(),
        benefits?.length
          ? this.subscriptionRepository.createBenefit(benefits)
          : Promise.resolve(),
      ]);

      return await this.planRepository.updatePlan(id, {
        ...planData,
        parentId,
      });
    });
  }

  async removePlan(id: number) {
    await this.findOne(id);
    return await this.planRepository.removePlan(id);
  }

  formatSubscriptionData(data: any[]) {
    return data.map((subscription) => ({
      id: subscription.id,
      name: subscription.name,
      status: subscription.active,
      isFree: subscription.isFree,
      period: subscription.period,
      price: subscription.priceCents,
      benefits: this.unifiedBenefits(subscription),
    }));
  }

  private unifiedBenefits(subscription: any): string[] {
    const benefits: string[] = [];

    // Ajouter référence au plan parent
    if (subscription.parentId && subscription.parent) {
      benefits.push(`Avantage(s) du pack ${subscription.parent.name}`);
    }

    // Ajouter les bénéfices non hérités
    subscription.benefits
      ?.filter((b: any) => !b.inherited)
      .forEach((b: any) => benefits.push(b.benefit.label));

    return benefits;
  }

  private async addParentBenefitsToPlan(
    parentId: number,
    planId: number,
    tx: any
  ) {
    const parent = await tx.subscriptionPlan.findUnique({
      where: { id: parentId },
      include: { benefits: true },
    });

    if (!parent?.benefits?.length) return;

    const planBenefits = parent.benefits.map((pb: any) => ({
      planId,
      benefitId: pb.benefitId,
    }));

    await tx.planBenefit.createMany({
      data: planBenefits,
      skipDuplicates: true,
    });
  }

  private computeEndAt(durationDays?: number | null): Date | null {
    return durationDays && durationDays > 0
      ? addDays(new Date(), durationDays)
      : null;
  }

  private async createBenefitAndAssociateToPlan(
    benefits: CreateBenefit[],
    planId: number,
    tx: any
  ) {
    if (!benefits?.length) return;

    const createdBenefits = await Promise.all(
      benefits.map((benefit: any) =>
        tx.benefit.upsert({
          where: { id: benefit.id || -1 },
          update: {},
          create: benefit,
        })
      )
    );

    await tx.planBenefit.createMany({
      data: createdBenefits.map((benefit) => ({
        planId,
        benefitId: benefit.id,
      })),
      skipDuplicates: true,
    });
  }

  private getDurationDays(period: PlanPeriod): number {
    return PERIOD_DURATION_MAP[period] ?? 28;
  }

  private generateSlug(period: PlanPeriod): string {
    return PERIOD_SLUG_MAP[period] ?? "CUSTOM_PLAN";
  }
}
