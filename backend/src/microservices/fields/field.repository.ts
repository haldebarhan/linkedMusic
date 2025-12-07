import { Field, PrismaClient } from "@prisma/client";
import { ReferenceBaseRepository } from "../references/reference-base.repository";
import { FieldWithOptions } from "../../utils/types/relation-type";
import { injectable } from "tsyringe";
import DatabaseService from "../../utils/services/database.service";
import { Order } from "../../utils/enums/order.enum";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class FieldRepository extends ReferenceBaseRepository<Field> {
  constructor() {
    super(prisma, "field");
  }

  async findByKeyWithOptions(key: string): Promise<FieldWithOptions | null> {
    return prisma.field.findUnique({
      where: { key },
      include: {
        options: {
          where: { active: true },
          orderBy: { order: Order.ASC },
        },
      },
    });
  }

  async findByCategoryId(categoryId: number): Promise<FieldWithOptions[]> {
    const categoryFields = await prisma.categoryField.findMany({
      where: { categoryId },
      include: {
        field: {
          include: {
            options: {
              where: { active: true },
              orderBy: { order: Order.ASC },
            },
          },
        },
      },
      orderBy: { order: Order.ASC },
    });

    return categoryFields.map((cf) => cf.field);
  }

  async findFilterable(): Promise<FieldWithOptions[]> {
    return this.findAll({
      where: { filterable: true },
      include: {
        options: {
          where: { active: true },
          orderBy: { order: Order.ASC },
        },
      },
    }) as Promise<FieldWithOptions[]>;
  }

  async findSearchable(): Promise<Field[]> {
    return this.findAll({
      where: { searchable: true },
    });
  }
}
