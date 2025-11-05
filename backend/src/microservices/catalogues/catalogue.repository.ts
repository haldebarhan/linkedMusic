import DatabaseService from "@/utils/services/database.service";
import { PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";
import {
  CreateCategoryDTO,
  CreateFieldDto,
  CreateFieldOptionDto,
  CreateServiceTypeDTO,
  UpdateCategoryDTO,
  UpdateFieldDto,
} from "./catalogue.dto";
import { Order } from "@/utils/enums/order.enum";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class CatalogueRepository {
  async createCategory(data: CreateCategoryDTO) {
    return await prisma.category.create({ data });
  }

  async listCategories(params: {
    skip?: number;
    take?: number;
    where?: any;
    order?: Order;
  }) {
    const { skip, take, where, order } = params;
    return await prisma.category.findMany({
      skip,
      take,
      where,
      orderBy: { name: Order.ASC },
      include: {
        CategoryField: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }

  async findCategory(id: number) {
    return await prisma.category.findUnique({
      where: { id },
      include: {
        CategoryField: {
          include: {
            field: { include: { options: true } },
          },
        },
      },
    });
  }

  async countCategories(where?: any) {
    return await prisma.category.count({ where });
  }

  async updateFullReplaceCategories(
    id: number,
    data: any,
    categoryIds: number[]
  ) {
    // Remplace complètement les catégories via deleteMany + create
    return await prisma.announcement.update({
      where: { id },
      data: {
        ...data,
        categories: {
          deleteMany: {}, // supprime tous les liens existants
          create: categoryIds.map((cid) => ({
            category: { connect: { id: cid } },
          })),
        },
      },
      include: {
        serviceType: { select: { id: true, name: true, slug: true } },
        categories: { include: { category: true } },
      },
    });
  }

  async updateIncrementalCategories(
    id: number,
    data: any,
    addIds: number[] = [],
    removeIds: number[] = []
  ) {
    return await prisma.announcement.update({
      where: { id },
      data: {
        ...data,
        categories: {
          // supprime uniquement les IDs demandés
          deleteMany: removeIds.length
            ? { categoryId: { in: removeIds } }
            : undefined,
          // ajoute les nouveaux
          create: addIds.map((cid) => ({
            category: { connect: { id: cid } },
          })),
        },
      },
      include: {
        serviceType: { select: { id: true, name: true, slug: true } },
        categories: { include: { category: true } },
      },
    });
  }

  async updateCategory(id: number, data: UpdateCategoryDTO) {
    return await prisma.category.update({
      where: { id },
      data,
    });
  }

  async removeCategory(id: number) {
    return await prisma.category.delete({ where: { id } });
  }

  // Services Types
  async createServiceType(data: Omit<CreateServiceTypeDTO, "categoryIds">) {
    return await prisma.serviceType.create({ data });
  }

  async removeServiceType(id: number) {
    return await prisma.serviceType.delete({
      where: { id },
    });
  }

  async addCategoryToServiceType(data: {
    categoryId: number;
    serviceTypeId: number;
  }) {
    return await prisma.categoryServiceType.create({ data });
  }

  async findOneServiceType(id: number) {
    return await prisma.serviceType.findUnique({
      where: { id },
      include: {
        categories: {
          select: { category: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async findOneServiceTypeByParams(where: any) {
    return await prisma.serviceType.findUnique({
      where,
      include: {
        categories: {
          select: { category: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async listServiceType(params: {
    skip?: number;
    take?: number;
    where?: any;
    order?: Order;
  }) {
    const { skip, take, where, order } = params;
    return await prisma.serviceType.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: order },
      include: {
        categories: {
          select: { category: { select: { name: true, id: true } } },
        },
      },
    });
  }

  async countServiceType(where?: any) {
    return await prisma.serviceType.count({ where });
  }

  async findServiceType(id: number) {
    return await prisma.serviceType.findUnique({
      where: { id },
      include: {
        categories: {
          include: { category: { select: { name: true, id: true } } },
        },
      },
    });
  }

  // Fields
  async createField(data: Omit<CreateFieldDto, "options">) {
    return await prisma.field.create({ data });
  }

  async updateField(
    id: number,
    data: Omit<UpdateFieldDto, "options" | "optionsToRemove">
  ) {
    return await prisma.field.update({
      where: {
        id,
      },
      data,
    });
  }

  //   async upsertFieldOption(data: CreateFieldOptionDto) {
  //     return await prisma.fieldOption.upsert({
  //       where: { fieldId_value: { fieldId: data.fieldId!, value: data.label } },
  //       update: {
  //         label: data.label,
  //         value: data.value,
  //         order: data.order,
  //         fieldId: data.fieldId,
  //       },
  //       create: { label: data.label, value: data.label, fieldId: data.fieldId! },
  //     });
  //   }

  async createFieldOption(data: CreateFieldOptionDto) {
    return prisma.fieldOption.create({
      data: { ...data, fieldId: data.fieldId! },
    });
  }

  async attachFieldToCategory(data: any) {
    return prisma.categoryField.create({
      data: {
        ...data,
        required: data.required ?? false,
        visibleInForm: data.visibleInForm ?? true,
        visibleInFilter: data.visibleInFilter ?? true,
        order: data.order ?? 0,
      },
    });
  }

  async attachServiceCategory(data: any) {
    return prisma.categoryServiceType.create({
      data: {
        ...data,
      },
    });
  }

  async detachServiceToCategory(categoryId: number, serviceTypeId: number) {
    return await prisma.categoryServiceType.delete({
      where: { categoryId_serviceTypeId: { categoryId, serviceTypeId } },
    });
  }
  async detachFieldToCategory(categoryId: number, fieldId: number) {
    return await prisma.categoryField.delete({
      where: { categoryId_fieldId: { categoryId, fieldId } },
    });
  }

  async listFields(params: {
    skip?: number;
    take?: number;
    where?: any;
    order?: Order;
  }) {
    const { skip, take, where, order } = params;
    return await prisma.field.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: order },
    });
  }

  async findField(id: number) {
    return await prisma.field.findUnique({
      where: { id },
      include: {
        options: true,
        CategoryField: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }

  async countFields(where?: any) {
    return await prisma.field.count({ where });
  }

  async removeField(id: number) {
    return await prisma.field.delete({ where: { id } });
  }

  async findCategoryBySlug(slug: string) {
    return await prisma.category.findUnique({
      where: { slug },
      include: {
        services: {
          select: {
            serviceType: { select: { name: true, slug: true, id: true } },
          },
        },
        CategoryField: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            field: { include: { options: { orderBy: { order: Order.ASC } } } },
          },
        },
      },
    });
  }

  async findServiceTypeByCategory(categoryId: number) {
    return await prisma.categoryField.findMany({
      where: { visibleInFilter: true, category: { id: categoryId } },
      include: {
        field: { include: { options: { orderBy: { order: Order.ASC } } } },
        category: { select: { name: true, slug: true, id: true } },
      },
      orderBy: { order: Order.ASC },
    });
  }

  async getFilterSchema(categorySlug: string) {
    return await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });
  }
}
