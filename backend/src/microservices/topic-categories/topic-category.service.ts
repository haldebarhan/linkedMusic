import { injectable } from "tsyringe";
import { TopicCategoryRepository } from "./topic-category.repository";
import {
  CreateTopicCategoryDTO,
  UpdateTopicCategoryDTO,
} from "./topic-category.dto";
import { Prisma } from "@prisma/client";
import createError from "http-errors";
import { Order } from "@/utils/enums/order.enum";

@injectable()
export class TopicCategoryService {
  constructor(
    private readonly topicCategoryRepository: TopicCategoryRepository
  ) {}

  async createTopicCategory(data: CreateTopicCategoryDTO) {
    try {
      return await this.topicCategoryRepository.create(data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[])?.join(", ");
        throw createError(409, `${target} already exists`);
      }
      throw createError(
        500,
        `Failed to create topic category: ${error.message}`
      );
    }
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
      this.topicCategoryRepository.findAll({
        skip,
        take: limit,
        order: order,
        where,
      }),
      this.topicCategoryRepository.count(where),
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

  async findTopicCategory(topicCategoryId: number) {
    const TopicCategory = await this.topicCategoryRepository.findOne(
      topicCategoryId
    );
    if (!TopicCategory) throw createError(404, "topic category not found");
    return TopicCategory;
  }

  async updateTopicCategory(
    topicCategoryId: number,
    data: UpdateTopicCategoryDTO
  ) {
    try {
      await this.findTopicCategory(topicCategoryId);
      return await this.topicCategoryRepository.update(topicCategoryId, data);
    } catch (error) {
      throw createError(
        500,
        `Failed to update topic category: ${error.message}`
      );
    }
  }

  async remove(topicId: number) {
    await this.findTopicCategory(topicId);
    return await this.topicCategoryRepository.delete(topicId);
  }
}
