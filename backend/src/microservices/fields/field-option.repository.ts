import { FieldOption, PrismaClient } from "@prisma/client";
import { ReferenceBaseRepository } from "../references/reference-base.repository";
import { injectable } from "tsyringe";
import DatabaseService from "../../utils/services/database.service";
import { Order } from "../../utils/enums/order.enum";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class FieldOptionRepository extends ReferenceBaseRepository<FieldOption> {
  constructor() {
    super(prisma, "fieldOption");
  }

  async findByFieldId(
    fieldId: number,
    activeOnly: boolean = true
  ): Promise<FieldOption[]> {
    const where: any = { fieldId };
    if (activeOnly) {
      where.active = true;
    }

    return this.findAll({
      where,
      orderBy: { order: Order.ASC },
    });
  }

  async findByValue(
    fieldId: number,
    value: string
  ): Promise<FieldOption | null> {
    return this.findOne({
      fieldId,
      value,
    });
  }
  async createMany(
    options: Array<{
      fieldId: number;
      label: string;
      value: string;
      order?: number;
      active?: boolean;
      metadata?: any;
    }>
  ): Promise<number> {
    const result = await prisma.fieldOption.createMany({
      data: options,
    });
    return result.count;
  }
}
