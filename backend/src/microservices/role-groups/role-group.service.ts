import { injectable } from "tsyringe";
import { Prisma } from "@prisma/client";
import createError from "http-errors";
import { Order } from "@/utils/enums/order.enum";
import { CreateRoleGroupDTO } from "../categories/category.dto";
import { RoleGroupRepository } from "./role-group.repository";

@injectable()
export class RoleGroupService {
  constructor(private readonly roleGroupRepository: RoleGroupRepository) {}

  async create(data: CreateRoleGroupDTO) {
    try {
      return await this.roleGroupRepository.create(data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[])?.join(", ");
        throw createError(409, `${target} already exists`);
      }
      throw createError(500, `Failed to create serviceType: ${error.message}`);
    }
  }

  async update(serviceTypeId: number, data: CreateRoleGroupDTO) {
    const serviceType = await this.findOne(serviceTypeId);
    return await this.roleGroupRepository.update(serviceType.id, data);
  }

  async findOne(serviceTypeId: number) {
    const serviceType = await this.roleGroupRepository.findOne(serviceTypeId);
    if (!serviceType) throw createError(404, "role group not found");
    return serviceType;
  }

  async findAll(params: {
    limit: number;
    page: number;
    order: Order;
    where?: any;
  }) {
    const { limit, page, order, where } = params;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.roleGroupRepository.findAll({
        skip,
        take: limit,
        order: order,
        where,
      }),
      this.roleGroupRepository.count(where),
    ]);
    return {
      data,
      metadata: {
        total,
        page,
        totalPage: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  async remove(id: number) {
    const serviceType = await this.findOne(id);
    return await this.roleGroupRepository.delete(serviceType.id);
  }
}
