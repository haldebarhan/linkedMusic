import { injectable } from "tsyringe";
import { ServiceTypeRepository } from "./service-type.repository";
import { CategoryRepository } from "../categories/category.repository";
import { RoleGroupRepository } from "../role-groups/role-group.repository";
import createError from "http-errors";
import { CreateServiceDTO, UpdateServiceDTO } from "./service.dto";
import { createServiceField } from "@/utils/functions/create-field-and-field-option";
import { FieldRepository } from "../fields/field.repository";
import { FieldOptionRepository } from "../field-options/field-option.repository";
import { Order } from "@/utils/enums/order.enum";

@injectable()
export class ServiceTypeService {
  constructor(
    private readonly serviceTypeRepository: ServiceTypeRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly groupRoleRepository: RoleGroupRepository,
    private readonly fieldRepository: FieldRepository,
    private readonly fieldOptionRepository: FieldOptionRepository
  ) {}

  async create(data: CreateServiceDTO) {
    const { fields, ...rest } = data;
    await this.checkCategory(rest.categoryId, rest.parentId);
    await this.checkRoleGroup(rest.groupId);
    const service = await this.serviceTypeRepository.create(rest);
    if (fields)
      await createServiceField(
        fields,
        service.id,
        this.fieldRepository,
        this.fieldOptionRepository
      );
    return service;
  }

  async update(serviceId: number, data: UpdateServiceDTO) {
    const { fields, ...rest } = data;
    await this.findOne(serviceId);
    if (rest.groupId) {
      const roleGroup = await this.groupRoleRepository.findOne(rest.groupId);
      if (!roleGroup) throw createError(404, "Group not found");
    }
    if (rest.categoryId) {
      const category = await this.categoryRepository.findOne(rest.categoryId);
      if (!category) throw createError(404, "category not found");
    }
    const updated = await this.serviceTypeRepository.update(serviceId, rest);
    if (fields)
      await createServiceField(
        fields,
        serviceId,
        this.fieldRepository,
        this.fieldOptionRepository
      );
    return updated;
  }

  async findOne(serviceId: number) {
    const service = await this.serviceTypeRepository.findOne(serviceId);
    if (!service) throw createError(404, "Service not found");
    return service;
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
      this.serviceTypeRepository.findAll({
        skip,
        take: limit,
        order: order,
        where,
      }),
      this.serviceTypeRepository.count(where),
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

  private async checkCategory(categoryId: number, serviceParentId?: number) {
    const [category, parent] = await Promise.all([
      this.categoryRepository.findOne(categoryId),
      serviceParentId
        ? this.serviceTypeRepository.findOne(serviceParentId)
        : Promise.resolve(null),
    ]);
    if (!category) throw createError(404, "category not found");
    if (serviceParentId && !parent)
      throw createError(404, "service parent not found");
  }
  private async checkRoleGroup(groupId?: number) {
    if (groupId) {
      const group = await this.groupRoleRepository.findOne(groupId);
      if (!group) throw createError(404, "group role not found");
    }
  }
}
