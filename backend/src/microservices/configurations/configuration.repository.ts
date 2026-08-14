import { BaseRepository } from "../../utils/classes/base.repository";
import DatabaseService from "../../utils/services/database.service";
import { AppConfig, PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

type createConfig = { key: string; value: string; type: string };
type updateConfig = Partial<createConfig>;

@injectable()
export class ConfigurationRepository extends BaseRepository<
  AppConfig,
  createConfig,
  updateConfig
> {
  constructor() {
    super(prisma.appConfig);
  }
}
