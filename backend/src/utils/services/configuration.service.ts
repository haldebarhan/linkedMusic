import { PrismaClient } from "@prisma/client";
import DatabaseService from "./database.service";
import logger from "@/config/logger";

const prisma: PrismaClient = DatabaseService.getPrismaClient();
export type ConfigValue = string | number | boolean | object;

export class ConfigService {
  private static cache: Map<string, ConfigValue> = new Map();
  private static lastUpdate: Date | null = null;

  static async loadConfigs(): Promise<void> {
    logger.info("🔄 Chargement des configurations...");
    const configs = await prisma.appConfig.findMany();
    this.cache.clear();

    configs.forEach((config) => {
      let value: ConfigValue;
      switch (config.type) {
        case "boolean":
          value = config.value === "true";
          break;
        case "number":
          value = Number(config.value);
          break;
        case "json":
          try {
            value = JSON.parse(config.value);
          } catch {
            value = {};
          }
          break;
        default:
          value = config.value;
      }
      this.cache.set(config.key, value);
    });
    this.lastUpdate = new Date();
    logger.info(`✅ ${configs.length} configurations chargées.`);
  }

  static get<T = ConfigValue>(key: string, defaultValue?: T): T {
    return (this.cache.get(key) as T) ?? defaultValue!;
  }

  static async refresh(): Promise<void> {
    await this.loadConfigs();
  }
}
