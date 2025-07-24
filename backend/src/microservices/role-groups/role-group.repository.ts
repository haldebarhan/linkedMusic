import { BaseRepository } from "@/utils/classes/base.repoository";
import { PrismaClient, RoleGroup } from "@prisma/client";
import { injectable } from "tsyringe";
import { CreateRoleGroupDTO } from "../categories/category.dto";
import DatabaseService from "@/utils/services/database.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class RoleGroupRepository extends BaseRepository<
  RoleGroup,
  CreateRoleGroupDTO,
  CreateRoleGroupDTO
> {
  constructor() {
    super(prisma.roleGroup);
  }
}
