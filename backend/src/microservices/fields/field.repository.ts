import { BaseRepository } from "@/utils/classes/base.repoository";
import { Field, PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";
import { CreateFieldDTO, UpdateFieldDTO } from "../categories/category.dto";
import DatabaseService from "@/utils/services/database.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class FieldRepository extends BaseRepository<
  Field,
  Omit<CreateFieldDTO, "fields"> & { serviceId: number },
  UpdateFieldDTO
> {
  constructor() {
    super(prisma.field);
  }
}
