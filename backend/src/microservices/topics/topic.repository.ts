import { BaseRepository } from "@/utils/classes/base.repoository";
import { PrismaClient, Topic } from "@prisma/client";
import { injectable } from "tsyringe";
import { CreateTopicDTO, UpdateTopicDTO } from "./topic.dto";
import DatabaseService from "@/utils/services/database.service";
import { Order } from "@/utils/enums/order.enum";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class TopicRepository extends BaseRepository<
  Topic,
  CreateTopicDTO & { authorId: number },
  UpdateTopicDTO & { authorId?: number }
> {
  constructor() {
    super(prisma.topic);
  }

  async findTopic(id: number, params: { limit: number; page: number }) {
    const { limit, page } = params;
    const skip = (page - 1) * limit;

    return prisma.topic.findUnique({
      where: { id },
      include: {
        Comment: {
          take: limit,
          skip,
          include: { replies: true, _count: { select: { likes: true } } },
        },
        category: true,
      },
    });
  }

  async addTopicToFavorites(topicId: number, userId: number) {
    return await prisma.favoriteTopic.create({
      data: { userId, topicId, createdAt: new Date() },
    });
  }

  async removeTopicToFavorites(id: number) {
    return await prisma.favoriteTopic.delete({ where: { id } });
  }

  async getUserFavoriteTopic(where: any) {
    return await prisma.favoriteTopic.findUnique({
      where: {
        userId_topicId: {
          userId: where.userId,
          topicId: where.topicId,
        },
      },
    });
  }

  async addTopicToWatchList(topicId: number, userId: number) {
    return await prisma.watchTopic.create({
      data: { userId, topicId, createdAt: new Date() },
    });
  }

  async removeTopicToWatchList(id: number) {
    return await prisma.watchTopic.delete({ where: { id } });
  }

  async getUserWatchListTopic(where: any) {
    return await prisma.watchTopic.findUnique({
      where: {
        userId_topicId: {
          userId: where.userId,
          topicId: where.topicId,
        },
      },
    });
  }

  async findFavoriteTopics(
    userId: number,
    params: {
      skip?: number;
      take?: number;
      order?: Order;
    }
  ) {
    const { skip, take, order } = params;
    return prisma.favoriteTopic.findMany({
      skip,
      take,
      where: { userId },
      orderBy: {
        createdAt: order ?? Order.DESC,
      },
    });
  }

  async countFavoriteTopics(userId: number) {
    return await prisma.favoriteTopic.count({ where: { userId } });
  }
  async countWatchTopics(userId: number) {
    return await prisma.watchTopic.count({ where: { userId } });
  }

  async findWatchTopics(
    userId: number,
    params: {
      skip?: number;
      take?: number;
      order?: Order;
    }
  ) {
    const { skip, take, order } = params;
    return prisma.watchTopic.findMany({
      skip,
      take,
      where: { userId },
      orderBy: {
        createdAt: order ?? Order.DESC,
      },
    });
  }
}
