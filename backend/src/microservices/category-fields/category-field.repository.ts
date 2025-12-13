import DatabaseService from "../../utils/services/database.service";
import { CategoryField, PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class CategoryFieldRepository {
  async create(data: {
    categoryId: number;
    fieldId: number;
    required?: boolean;
    visibleInFilter?: boolean;
    visibleInForm?: boolean;
    visibleInList?: boolean;
    order?: number;
    defaultValue?: any;
  }): Promise<CategoryField> {
    return prisma.categoryField.create({ data });
  }

  async update(
    categoryId: number,
    fieldId: number,
    data: {
      required?: boolean;
      visibleInFilter?: boolean;
      visibleInForm?: boolean;
      visibleInList?: boolean;
      order?: number;
      defaultValue?: any;
    }
  ): Promise<CategoryField> {
    return prisma.categoryField.update({
      where: {
        categoryId_fieldId: {
          categoryId,
          fieldId,
        },
      },
      data,
    });
  }

  async delete(categoryId: number, fieldId: number): Promise<CategoryField> {
    return prisma.categoryField.delete({
      where: {
        categoryId_fieldId: {
          categoryId,
          fieldId,
        },
      },
    });
  }

  async findByCategoryId(categoryId: number): Promise<CategoryField[]> {
    return prisma.categoryField.findMany({
      where: { categoryId },
      include: {
        field: {
          include: {
            options: true,
          },
        },
      },
      orderBy: { order: "asc" },
    });
  }

  async findCategoryField(categoryId: number, fieldId: number) {
    return prisma.categoryField.findUnique({
      where: {
        categoryId_fieldId: {
          categoryId,
          fieldId,
        },
      },
    });
  }
}
