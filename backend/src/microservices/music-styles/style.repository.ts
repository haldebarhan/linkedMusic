import { BaseRepository } from "@/utils/classes/base.repoository";
import { injectable } from "tsyringe";
import { PrismaClient, Styles } from "@prisma/client";
import { CreateStyleDTO, UpdateStyleDTO } from "./style.dto";
import DatabaseService from "@/utils/services/database.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class StyleRepository extends BaseRepository<
  Styles,
  CreateStyleDTO,
  UpdateStyleDTO
> {
  constructor() {
    super(prisma.styles);
  }
}
