import DatabaseService from "@/utils/services/database.service";
import { PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";
import {
  CreateCategoryDTO,
  CreateFieldDto,
  CreateFieldOptionDto,
  CreateServiceTypeDTO,
  UpdateCategoryDTO,
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
      orderBy: { createdAt: order },
    });
  }

  async findCategory(id: number) {
    return await prisma.category.findUnique({ where: { id } });
  }

  async countCategories(where?: any) {
    return await prisma.category.count({ where });
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
  async createServiceType(data: CreateServiceTypeDTO) {
    return await prisma.serviceType.create({ data });
  }

  async findOneServiceType(where: any) {
    return await prisma.serviceType.findUnique({
      where,
      include: {
        fields: {
          include: { field: { include: { options: true } } },
          orderBy: { order: Order.ASC },
        },
        category: { select: { id: true } },
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
      include: { category: { select: { name: true, id: true } } },
    });
  }

  async countServiceType(where?: any) {
    return await prisma.serviceType.count({ where });
  }

  async findServiceType(id: number) {
    return await prisma.serviceType.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, slug: true } },
        fields: {
          include: { field: { include: { options: true } } },
          orderBy: { order: Order.ASC },
        },
      },
    });
  }

  // Fields
  async createField(data: Omit<CreateFieldDto, "options">) {
    return await prisma.field.create({ data });
  }

  async createFieldOption(data: CreateFieldOptionDto) {
    return prisma.fieldOption.create({
      data: { ...data, fieldId: data.fieldId! },
    });
  }

  async attachFieldToService(data: any) {
    return prisma.serviceTypeField.create({
      data: {
        ...data,
        required: data.required ?? false,
        visibleInForm: data.visibleInForm ?? true,
        visibleInFilter: data.visibleInFilter ?? true,
        order: data.order ?? 0,
      },
    });
  }

  async detachFieldToService(serviceTypeId: number, fieldId: number) {
    return await prisma.serviceTypeField.delete({
      where: { serviceTypeId_fieldId: { serviceTypeId, fieldId } },
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
        services: {
          include: { serviceType: { select: { id: true, name: true } } },
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
    return await prisma.category.findUnique({ where: { slug } });
  }

  async findServiceTypeByCategory(categoryId: number) {
    return await prisma.serviceTypeField.findMany({
      where: { visibleInFilter: true, serviceType: { categoryId } },
      include: {
        field: { include: { options: { orderBy: { order: Order.ASC } } } },
      },
      orderBy: { order: Order.ASC },
    });
  }
}
