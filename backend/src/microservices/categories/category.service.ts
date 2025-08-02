import { injectable } from "tsyringe";
import { CategoryRepository } from "./category.repository";
import { CreateCategoryDTO, UpdateCategoryDTO } from "./category.dto";
import { Prisma } from "@prisma/client";
import createError from "http-errors";
import { Order } from "@/utils/enums/order.enum";
import { MinioService } from "@/utils/services/minio.service";
import { ENV } from "@/config/env";

const minioService: MinioService = MinioService.getInstance();

@injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async create(data: CreateCategoryDTO) {
    try {
      return await this.categoryRepository.create(data);
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
    const category = await this.findOne(categoryId);
    const deleteOldIconPromise =
      data.icon && category.icon
        ? minioService.deleteFile(ENV.MINIO_BUCKET_NAME, category.icon)
        : Promise.resolve();
    return await Promise.all([
      this.categoryRepository.update(category.id, data),
      deleteOldIconPromise,
    ]);
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
}
