import { PrismaClient } from "@prisma/client";
import {
  PaginationParams,
  PaginatedResponse,
} from "../../utils/interfaces/pagination";

export abstract class ReferenceBaseRepository<T> {
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  protected getModel() {
    return (this.prisma as any)[this.modelName];
  }

  async findById(id: number, include?: any): Promise<T | null> {
    return this.getModel().findUnique({
      where: { id },
      include,
    });
  }

  async findOne(where: any, include?: any): Promise<T | null> {
    return this.getModel().findFirst({
      where,
      include,
    });
  }

  async findAll(options?: {
    where?: any;
    include?: any;
    orderBy?: any;
    take?: number;
    skip?: number;
  }): Promise<T[]> {
    return this.getModel().findMany(options);
  }

  async findWithPagination(
    pagination: PaginationParams,
    where?: any,
    include?: any,
    orderBy?: any
  ): Promise<PaginatedResponse<T>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    // Construire l'orderBy si fourni dans pagination
    const finalOrderBy =
      orderBy ||
      (pagination.sortBy
        ? {
            [pagination.sortBy]: pagination.sortOrder || "desc",
          }
        : undefined);

    // Exécuter les requêtes en parallèle
    const [data, total] = await Promise.all([
      this.getModel().findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy: finalOrderBy,
      }),
      this.getModel().count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as T[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async count(where?: any): Promise<number> {
    return this.getModel().count({ where });
  }

  async create(data: any, include?: any): Promise<T> {
    return this.getModel().create({
      data,
      include,
    });
  }

  async update(id: number, data: any, include?: any): Promise<T> {
    return this.getModel().update({
      where: { id },
      data,
      include,
    });
  }

  async delete(id: number): Promise<T> {
    return this.getModel().delete({
      where: { id },
    });
  }

  async deleteMany(where: any): Promise<{ count: number }> {
    return this.getModel().deleteMany({ where });
  }

  async exists(where: any): Promise<boolean> {
    const count = await this.getModel().count({ where });
    return count > 0;
  }

  async upsert(
    where: any,
    create: any,
    update: any,
    include?: any
  ): Promise<T> {
    return this.getModel().upsert({
      where,
      create,
      update,
      include,
    });
  }

  async transaction<R>(
    callback: (prisma: PrismaClient) => Promise<R>
  ): Promise<R> {
    // Use the generic overload and cast the callback to any so TypeScript selects the callback overload
    return this.prisma.$transaction<R>(callback as any);
  }
}
