import { injectable } from "tsyringe";
import { TopicRepository } from "./topic.repository";
import { Prisma } from "@prisma/client";
import createError from "http-errors";
import { TopicCategoryRepository } from "../topic-categories/topic-category.repository";
import { CreateTopicDTO, UpdateTopicDTO } from "./topic.dto";
import { Order } from "@/utils/enums/order.enum";

@injectable()
export class TopicService {
  constructor(
    private topicRepository: TopicRepository,
    private topicCategoryRepository: TopicCategoryRepository
  ) {}

  async create(data: CreateTopicDTO, authorId: number) {
    try {
      await this.checkTopicCategory(data.categoryId);
      const createData: CreateTopicDTO & { authorId: number } = {
        ...data,
        authorId,
      };
      return await this.topicRepository.create(createData);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[])?.join(", ");
        throw createError(409, `${target} already exists`);
      }
      throw createError(500, `Failed to create topic: ${error.message}`);
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
      this.topicRepository.findAll({
        skip,
        take: limit,
        order: order,
        where,
      }),
      this.topicRepository.count(where),
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

  async findTopic(topicId: number, params: { page: number; limit: number }) {
    const topic = await this.topicRepository.findTopic(topicId, params);
    if (!topic) throw createError(404, "topic not found");
    return topic;
  }

  async findOne(topicId: number) {
    const topic = await this.topicRepository.findOne(topicId);
    if (!topic) throw createError(404, "topic not found");
    return topic;
  }

  async update(topicId: number, data: UpdateTopicDTO, authorId: number) {
    try {
      const checkTopicCategoryPromise = data.categoryId
        ? this.checkTopicCategory(data.categoryId)
        : Promise.resolve();
      const [topic] = await Promise.all([
        this.findOne(topicId),
        checkTopicCategoryPromise,
      ]);
      if (topic.authorId !== authorId)
        throw createError(401, "Unauthorized action");

      return await this.topicRepository.update(topicId, data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[])?.join(", ");
        throw createError(409, `${target} already exists`);
      }
      throw createError(500, `Failed to update topic: ${error.message}`);
    }
  }

  async remove(topicId: number, authorId: number) {
    const topic = await this.findOne(topicId);
    if (topic.authorId !== authorId)
      throw createError(401, "Unauthorized action");
    return await this.topicRepository.delete(topicId);
  }

  async toggleFavorite(topicId: number, userId: number) {
    const exist = await this.findUserFavoriteTopic(topicId, userId);
    return exist
      ? this.topicRepository.removeTopicToFavorites(exist.id)
      : this.topicRepository.addTopicToFavorites(topicId, userId);
  }

  async toggleWatch(topicId: number, userId: number) {
    const exist = await this.findUserWatchTopic(topicId, userId);
    return exist
      ? this.topicRepository.removeTopicToWatchList(exist.id)
      : this.topicRepository.addTopicToWatchList(topicId, userId);
  }

  async findFavoriteTopic(
    userId: number,
    params: {
      limit: number;
      page: number;
      order: Order;
    }
  ) {
    const { limit, page, order } = params;
    const skip = (page - 1) * limit;
    const where: any = { userId };
    const [data, total] = await Promise.all([
      this.topicRepository.findFavoriteTopics(userId, {
        skip,
        take: limit,
        order: order,
      }),
      this.topicRepository.countFavoriteTopics(where),
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

  async findWatchTopic(
    userId: number,
    params: {
      limit: number;
      page: number;
      order: Order;
    }
  ) {
    const { limit, page, order } = params;
    const skip = (page - 1) * limit;
    const where: any = { userId };
    const [data, total] = await Promise.all([
      this.topicRepository.findWatchTopics(userId, {
        skip,
        take: limit,
        order: order,
      }),
      this.topicRepository.countWatchTopics(where),
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

  private async checkTopicCategory(topicCategoryId: number) {
    const topicCategory = await this.topicCategoryRepository.findOne(
      topicCategoryId
    );
    if (!topicCategory) throw createError(404, "topic category not found");
    return topicCategory;
  }

  private async findUserFavoriteTopic(topicId: number, userId: number) {
    return await this.topicRepository.getUserFavoriteTopic({
      topicId,
      userId,
    });
  }

  private async findUserWatchTopic(topicId: number, userId: number) {
    return await this.topicRepository.getUserWatchListTopic({
      topicId,
      userId,
    });
  }
}
