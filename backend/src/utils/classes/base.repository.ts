import { PrismaClient } from "@prisma/client";
import { Order } from "../enums/order.enum";
import { PaginationParams, PaginatedResponse } from "../interfaces/pagination";

/** Shared CRUD and keyset-pagination foundation for every Prisma repository. */
export abstract class BaseRepository<T, TCreateDTO = any, TUpdateDTO = any> {
  protected readonly model: any;
  protected readonly prisma?: PrismaClient;

  /**
   * Accept either a Prisma model delegate (`prisma.user`) or a Prisma client plus
   * model name. The latter keeps existing specialised repositories simple.
   */
  constructor(model: any, modelName?: string) {
    this.prisma = modelName ? (model as PrismaClient) : undefined;
    this.model = modelName ? model[modelName] : model;
  }

  async findById(id: number, include?: any): Promise<T | null> {
    return this.model.findUnique({ where: { id }, include });
  }

  async findOne(where: number | any, include?: any): Promise<T | null> {
    if (typeof where === "number") return this.findById(where, include);
    return this.model.findFirst({ where, include });
  }

  async findAll(
    options: {
      where?: any;
      include?: any;
      orderBy?: any;
      order?: Order;
      take?: number;
      cursor?: number;
    } = {},
  ): Promise<T[]> {
    const { cursor, order, orderBy, ...optionsWithoutCursor } = options;
    return this.model.findMany({
      ...optionsWithoutCursor,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : undefined,
      orderBy: orderBy || { id: order ?? Order.DESC },
    });
  }

  async findWithPagination(
    pagination: PaginationParams,
    where?: any,
    include?: any,
    _orderBy?: any,
  ): Promise<PaginatedResponse<T>> {
    const limit = pagination.limit || 20;
    const rows = await this.findAll({
      where,
      include,
      cursor: pagination.cursor,
      take: limit + 1,
      order: pagination.sortOrder || Order.DESC,
    });
    const hasNext = rows.length > limit;
    const data = hasNext ? rows.slice(0, limit) : rows;

    return {
      data,
      pagination: {
        limit,
        hasNext,
        nextCursor: hasNext ? ((data.at(-1) as any)?.id ?? null) : null,
      },
    };
  }

  async count(where?: any): Promise<number> {
    return this.model.count({ where });
  }

  async create(data: TCreateDTO, include?: any): Promise<T> {
    return this.model.create({ data, include });
  }

  async update(id: number, data: TUpdateDTO, include?: any): Promise<T> {
    return this.model.update({ where: { id }, data, include });
  }

  async delete(id: number): Promise<T> {
    return this.model.delete({ where: { id } });
  }

  async deleteMany(where: any): Promise<{ count: number }> {
    return this.model.deleteMany({ where });
  }

  async exists(where: any): Promise<boolean> {
    return (await this.count(where)) > 0;
  }

  async findByParams(where: any): Promise<T | null> {
    return this.model.findUnique({ where });
  }

  async findManyByParams(where: any): Promise<T[]> {
    return this.model.findMany({ where });
  }

  async upsert(
    where: any,
    create: any,
    update: any,
    include?: any,
  ): Promise<T> {
    return this.model.upsert({ where, create, update, include });
  }

  async transaction<R>(
    callback: (prisma: PrismaClient) => Promise<R>,
  ): Promise<R> {
    if (!this.prisma) {
      throw new Error(
        "Transactions require a repository constructed with PrismaClient.",
      );
    }
    return this.prisma.$transaction<R>(callback as any);
  }
}
