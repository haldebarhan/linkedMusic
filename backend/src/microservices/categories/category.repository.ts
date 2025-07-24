import { BaseRepository } from "@/utils/classes/base.repoository";
import { Category, PrismaClient } from "@prisma/client";
import { CreateCategoryDTO, UpdateCategoryDTO } from "./category.dto";
import DatabaseService from "@/utils/services/database.service";
import { injectable } from "tsyringe";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class CategoryRepository extends BaseRepository<
  Category,
  Omit<CreateCategoryDTO, "services">,
  Omit<UpdateCategoryDTO, "services">
> {
  constructor() {
    super(prisma.category);
  }

  async findOne(id: number): Promise<Category | null> {
    return await prisma.category.findUnique({
      where: { id },
      include: {
        services: {
          include: { fields: { include: { options: true } }, group: true },
        },
      },
    });
  }

  async update(
    id: number,
    data: Omit<UpdateCategoryDTO, "services">
  ): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data,
      include: { services: true },
    });
  }
}
