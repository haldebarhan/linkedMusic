import { BaseRepository } from "@/utils/classes/base.repoository";
import { PrismaClient, TopicCategory } from "@prisma/client";
import { injectable } from "tsyringe";
import {} from "../topics/topic.dto";
import DatabaseService from "@/utils/services/database.service";
import {
  CreateTopicCategoryDTO,
  UpdateTopicCategoryDTO,
} from "./topic-category.dto";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class TopicCategoryRepository extends BaseRepository<
  TopicCategory,
  CreateTopicCategoryDTO,
  UpdateTopicCategoryDTO
> {
  constructor() {
    super(prisma.topicCategory);
  }
}
