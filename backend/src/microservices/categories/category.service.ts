import { injectable } from "tsyringe";
import { CategoryRepository } from "./category.repository";
import {
  CreateCategoryDTO,
  CreateFieldDTO,
  CreateFieldOptionDTO,
  CreateServiceTypeDTO,
  UpdateCategoryDTO,
} from "./category.dto";
import { Prisma } from "@prisma/client";
import createError from "http-errors";
import { Order } from "@/utils/enums/order.enum";
import { MinioService } from "@/utils/services/minio.service";
import { ENV } from "@/config/env";
import { ServiceTypeRepository } from "../service-types/service-type.repository";
import { RoleGroupRepository } from "../role-groups/role-group.repository";
import { FieldRepository } from "../fields/field.repository";
import { FieldOptionRepository } from "../field-options/field-option.repository";

const minioService: MinioService = MinioService.getInstance();

@injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly serviceRepository: ServiceTypeRepository,
    private readonly roleGroupRepository: RoleGroupRepository,
    private readonly fieldRepository: FieldRepository,
    private readonly fieldOptionRepository: FieldOptionRepository
  ) {}

  async create(data: CreateCategoryDTO) {
    try {
      const { services, ...rest } = data;
      console.log("services: ", services);
      const category = await this.categoryRepository.create(rest);
      if (services !== undefined)
        await this.createService(services, category.id);
      return category;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[])?.join(", ");
        throw createError(409, `${target} already exists`);
      }
      throw createError(500, `Failed to create category: ${error.message}`);
    }
  }

  async update(categoryId: number, data: UpdateCategoryDTO) {
    const { services, ...rest } = data;
    const category = await this.findOne(categoryId);
    const deleteOldIconPromise =
      data.icon && category.icon
        ? minioService.deleteFile(ENV.MINIO_BUCKET_NAME, category.icon)
        : Promise.resolve();
    const [updateCategory] = await Promise.all([
      this.categoryRepository.update(category.id, rest),
      deleteOldIconPromise,
    ]);

    if (services !== undefined)
      await this.createService(services, updateCategory.id);
    return updateCategory;
  }

  async findOne(categoryId: number) {
    const category = await this.categoryRepository.findOne(categoryId);
    if (!category) throw createError(404, "Category not found");
    return category;
  }

  async findAll(params: {
    limit: number;
    page: number;
    order: Order;
    where?: any;
  }) {
    const { limit, page, order, where } = params;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.categoryRepository.findAll({
        skip,
        take: limit,
        order: order,
        where,
      }),
      this.categoryRepository.count(where),
    ]);
    return {
      data,
      metadata: {
        total,
        page,
        totalPage: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    return await this.categoryRepository.delete(category.id);
  }

  private async createService(
    services: CreateServiceTypeDTO[],
    categoryId: number
  ) {
    if (services && services.length > 0) {
      await this.serviceRepository.deleteByCategoryId(categoryId);
      await Promise.all(
        services.map(async (service) => {
          let groupId: number | undefined = undefined;
          const { fields, ...rest } = service;

          if (service.groupId) {
            const roleGroup = await this.roleGroupRepository.findOne(
              service.groupId
            );

            if (!roleGroup) {
              throw createError(
                404,
                `Group role with id: ${service.groupId} not found`
              );
            }
            groupId = roleGroup.id;
          }
          const createdService = await this.serviceRepository.create({
            ...rest,
            categoryId,
            groupId,
          });
          if (fields) await this.createServiceField(fields, createdService.id);
        })
      );
    } else {
      await this.serviceRepository.deleteByCategoryId(categoryId);
    }
  }

  private async createServiceField(
    fields: CreateFieldDTO[],
    serviceId: number
  ) {
    await Promise.all(
      fields.map(async (field) => {
        const { options, ...rest } = field;
        const createdField = await this.fieldRepository.create({
          ...rest,
          serviceId,
        });
        if (options) await this.createFieldOptions(options, createdField.id);
      })
    );
  }

  private async createFieldOptions(
    fieldOption: CreateFieldOptionDTO[],
    fieldId: number
  ) {
    await Promise.all(
      fieldOption.map(
        async (option) =>
          await this.fieldOptionRepository.create({ ...option, fieldId })
      )
    );
  }
}
