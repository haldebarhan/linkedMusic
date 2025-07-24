import { BaseRepository } from "@/utils/classes/base.repoository";
import { PrismaClient, ServiceType } from "@prisma/client";
import { injectable } from "tsyringe";
import {
  CreateServiceTypeDTO,
  UpdateServiceTypeDTO,
} from "../categories/category.dto";
import DatabaseService from "@/utils/services/database.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class ServiceTypeRepository extends BaseRepository<
  ServiceType,
  Omit<CreateServiceTypeDTO, "fields"> & { categoryId: number },
  UpdateServiceTypeDTO
> {
  constructor() {
    super(prisma.serviceType);
  }

  async deleteByCategoryId(categoryId: number) {
    return await prisma.serviceType.deleteMany({ where: { categoryId } });
  }
}
