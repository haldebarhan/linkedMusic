import { injectable } from "tsyringe";
import { CatalogueRepository } from "./catalogue.repository";
import {
  AttachFieldDTO,
  AttachFieldsDTO,
  CreateCategoryDTO,
  CreateFieldDto,
  CreateServiceTypeDTO,
  UpdateCategoryDTO,
} from "./catalogue.dto";
import { Prisma } from "@prisma/client";
import createError from "http-errors";
import { Order } from "@/utils/enums/order.enum";

@injectable()
export class CatalogueService {
  constructor(private readonly catalogueRepository: CatalogueRepository) {}

  async createCategory(data: CreateCategoryDTO) {
    try {
      return await this.catalogueRepository.createCategory(data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[])?.join(", ");
        throw createError(409, `${target} already exists`);
      }
      throw createError(500, `Failed to create user: ${error.message}`);
    }
  }

  async listCategories(params: {
    limit: number;
    page: number;
    order: Order;
    where?: any;
  }) {
    const { limit, page, order, where } = params;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.catalogueRepository.listCategories({
        skip,
        take: limit,
        order: order,
        where,
      }),
      this.catalogueRepository.countCategories(where),
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

  async findCategory(id: number) {
    const category = await this.catalogueRepository.findCategory(id);
    if (!category) throw createError(404, "category not found");
    return category;
  }

  async removeCategory(id: number) {
    const category = await this.findCategory(id);
    return await this.catalogueRepository.removeCategory(category.id);
  }

  async updateCategory(id: number, data: UpdateCategoryDTO) {
    try {
      const category = await this.findCategory(id);
      return await this.catalogueRepository.updateCategory(category.id, data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[])?.join(", ");
        throw createError(409, `${target} already exists`);
      }
      throw createError(500, `Failed to update user: ${error.message}`);
    }
  }

  async findOneCategoryBySlug(slug: string) {
    const category = await this.catalogueRepository.findCategoryBySlug(slug);
    if (!category) throw createError(404, "category not found");
    return category;
  }

  // Services Types
  async createServiceType(data: CreateServiceTypeDTO) {
    try {
      const where: any = { name: data.name, slug: data.slug };
      await this.checkServiceType(where);
      return await this.catalogueRepository.createServiceType(data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[])?.join(", ");
        throw createError(409, `${target} already exists`);
      }
      throw createError(500, `Failed to create service type: ${error.message}`);
    }
  }

  async listServiceTypes(params: {
    limit: number;
    page: number;
    order: Order;
    where?: any;
  }) {
    const { limit, page, order, where } = params;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.catalogueRepository.listServiceType({
        skip,
        take: limit,
        order: order,
        where,
      }),
      this.catalogueRepository.countServiceType(where),
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

  async findOneServiceType(where: any) {
    const serviceType = await this.catalogueRepository.findOneServiceType(
      where
    );
    if (!serviceType) throw createError(404, "service type not found");
    return serviceType;
  }

  async createField(data: CreateFieldDto) {
    try {
      const { options, ...rest } = data;
      const newField = await this.catalogueRepository.createField(rest);
      if (options && options.length > 0) {
        await Promise.all(
          options.map((opt) =>
            this.catalogueRepository.createFieldOption({
              ...opt,
              fieldId: newField.id,
            })
          )
        );
      }
    } catch (error) {
      throw createError(
        error.status,
        `Failed to create field: ${error.message}`
      );
    }
  }

  // fields
  async listFields(params: {
    limit: number;
    page: number;
    order: Order;
    where?: any;
  }) {
    const { limit, page, order, where } = params;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.catalogueRepository.listFields({
        skip,
        take: limit,
        order: order,
        where,
      }),
      this.catalogueRepository.countFields(where),
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

  async findfield(id: number) {
    const field = await this.catalogueRepository.findField(id);
    if (!field) throw createError(404, "field not found");
    return field;
  }

  async removeField(id: number) {
    const field = await this.findfield(id);
    return await this.catalogueRepository.removeField(field.id);
  }

  //field options
  async createFieldOption(data: any) {
    try {
      return await this.catalogueRepository.createFieldOption(data);
    } catch (error) {
      throw createError(
        error.status,
        `Failed to create field option: ${error.message}`
      );
    }
  }

  async attachFieldToService(data: AttachFieldsDTO) {
    try {
      if (!data.fields || data.fields.length === 0) {
        throw createError(400, "No fields to attach");
      }

      const results = await Promise.allSettled(
        data.fields.map((field) =>
          this.catalogueRepository.attachFieldToService(field)
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length > 0) {
        console.error(`${failed.length} fields failed to attach:`, failed);

        // Si toutes ont échoué, lever une erreur
        if (successful === 0) {
          throw createError(500, "All field attachments failed");
        }

        // Si partiellement réussi, retourner les résultats avec info
        return {
          successful,
          failed: failed.length,
          results: results.map((r) =>
            r.status === "fulfilled" ? r.value : { error: r.reason.message }
          ),
        };
      }

      return results.map((r) => r);
    } catch (error) {
      throw createError(
        error.status || 500,
        `Failed to attach fields to service: ${error.message}`
      );
    }
  }

  async dettachFieldToService(data: AttachFieldDTO) {
    try {
      const { fieldId, serviceTypeId } = data;
      return await this.catalogueRepository.detachFieldToService(
        serviceTypeId,
        fieldId
      );
    } catch (error) {
      throw createError(
        error.status || 500,
        `Failed to detach fields to service: ${error.message}`
      );
    }
  }

  async getFilterSchemaByCategorySlug(slug: string) {
    try {
      const category = await this.findOneCategoryBySlug(slug);
      const serviceTypeFields =
        await this.catalogueRepository.findServiceTypeByCategory(category.id);
      return {
        category: category.name,
        categorySlug: category.slug,
        fields: serviceTypeFields.map((stf) => ({
          key: stf.field.key,
          label: stf.field.label,
          type: stf.field.inputType,
          placeholder: stf.field.placeholder || null,
          options: stf.field.options.map((o) => ({
            label: o.label,
            value: o.value,
          })),
        })),
      };
    } catch (error) {
      throw createError(
        error.status,
        `Failed to get category schema: ${error.message}`
      );
    }
  }

  private async checkServiceType(where: any) {
    const serviceType = await this.catalogueRepository.findOneServiceType(
      where
    );
    if (serviceType) throw createError(409, `Ce service existe deja`);
  }
}
