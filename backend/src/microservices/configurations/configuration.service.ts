import { injectable } from "tsyringe";
import { ConfigurationRepository } from "./configuration.repository";
import { CreateConfigDTO, UpdateConfigDTO } from "./configuration.dto";
import { Prisma } from "@prisma/client";
import createError from "http-errors";
import { Order } from "../../utils/enums/order.enum";
import { ConfigService } from "../../utils/services/configuration.service";
import { invalideCache } from "../../utils/functions/invalidate-cache";
import { cursorPage } from "../../utils/helpers/cursor-pagination";

@injectable()
export class ConfigurationService {
  constructor(
    private readonly configurationRepository: ConfigurationRepository,
  ) {}

  async create(data: CreateConfigDTO) {
    try {
      const { key, value, type } = data;
      const formatedType = type === "object" ? "json" : type;
      const created = await this.configurationRepository.create({
        key,
        value,
        type: formatedType,
      });
      await ConfigService.refresh();
      await invalideCache("configurations*");
      return created;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[])?.join(", ");
        throw createError(409, `${target} already exists`);
      }
      throw createError(
        500,
        `Failed to create config: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async update(configId: number, data: UpdateConfigDTO) {
    try {
      const config = await this.findOne(configId);
      const updated = await this.configurationRepository.update(
        config.id,
        data,
      );
      await ConfigService.refresh();
      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[])?.join(", ");
        throw createError(409, `${target} already exists`);
      }
      throw createError(
        500,
        `Failed to update config: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async findOne(configId: number) {
    const config = await this.configurationRepository.findOne(configId);
    if (!config) throw createError(404, "config not found");
    return config;
  }

  async findAll(params: {
    limit: number;
    cursor?: number;
    order: Order;
    where?: any;
  }) {
    const { limit, cursor, order, where } = params;
    const rows = await this.configurationRepository.findAll({
        cursor,
        take: limit + 1,
        order: order,
        where,
      });
    return cursorPage(rows, limit);
  }

  async remove(id: number) {
    const config = await this.findOne(id);
    const removed = await this.configurationRepository.delete(config.id);
    await ConfigService.refresh();
    await invalideCache("configurations*");
    return removed;
  }
}
