import { BaseRepository } from "@/utils/classes/base.repoository";
import { FieldOption, PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";
import { CreateFieldOptionDTO } from "../categories/category.dto";
import DatabaseService from "@/utils/services/database.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class FieldOptionRepository extends BaseRepository<
  FieldOption,
  CreateFieldOptionDTO & { fieldId: number },
  CreateFieldOptionDTO
> {
  constructor() {
    super(prisma.fieldOption);
  }
}
