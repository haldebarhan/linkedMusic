import { injectable } from "tsyringe";
import { CatalogueRepository } from "./catalogue.repository";
import {
  AttachFieldDTO,
  AttachFieldsDTO,
  AttachServicedDTO,
  AttachServicesDTO,
  CreateCategoryDTO,
  CreateFieldDto,
  CreateServiceTypeDTO,
  UpdateCategoryDTO,
  UpdateFieldDto,
} from "./catalogue.dto";
import createError from "http-errors";
import { Order } from "../../utils/enums/order.enum";
import { Prisma, PrismaClient } from "@prisma/client";
import DatabaseService from "../../utils/services/database.service";
import { invalideCache } from "../../utils/functions/invalidate-cache";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class CatalogueService {
  constructor(private readonly catalogueRepository: CatalogueRepository) {}

  async createCategory(data: CreateCategoryDTO) {
    try {
      await Promise.all([invalideCache("GET:/api/catalog*")]);
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
    await invalideCache("GET:/api/catalog*");
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
      const { name, slug, categoryIds } = data;
      const where: any = { name, slug };
      await this.checkServiceType(where);
      const created = await this.catalogueRepository.createServiceType({
        name,
        slug,
      });
      //   await Promise.all(
      //     categoryIds.map(
      //       async (id) =>
      //         await this.catalogueRepository.addCategoryToServiceType({
      //           categoryId: id,
      //           serviceTypeId: created.id,
      //         })
      //     )
      //   );
      await invalideCache("GET:/api/catalog*");
      return created;
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
        totalPage: Math.max(Math.ceil(10 / limit), 1),
      },
    };
  }

  async findOneServiceType(id: number) {
    const serviceType = await this.catalogueRepository.findOneServiceType(id);
    // if (!serviceType) throw createError(404, "service type not found");
    return serviceType;
  }

  async removeServiceType(id: number) {
    const service = await this.findOneServiceType(id);
    // return await this.catalogueRepository.removeServiceType(service.id);
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

  async updateField(id: number, data: UpdateFieldDto) {
    const result = await prisma.$transaction(async (tx) => {
      const { options, optionsToRemove, ...rest } = data;

      // 1) Vérifie que le field existe (et verrouille si besoin)
      await this.findfield(id);

      // 2) Construit la liste plate d'opérations
      const ops: Promise<any>[] = [];

      // a) Upsert-like: si o.id existe => update, sinon => create
      if (options?.length) {
        for (const o of options) {
          if (o.id) {
            ops.push(
              tx.fieldOption.update({
                where: { id: o.id },
                data: {
                  label: o.label,
                  value: o.value,
                  order: o.order,
                },
              })
            );
          } else {
            // crée une nouvelle option rattachée au field
            ops.push(
              tx.fieldOption.create({
                data: {
                  label: o.label!,
                  value: o.value!,
                  order: o.order,
                  field: { connect: { id } },
                },
              })
            );
          }
        }
      }

      // b) Suppressions en bloc, et on s’assure qu’on supprime bien sur CE field
      if (optionsToRemove?.length) {
        const idsToRemove = optionsToRemove
          .map((x) => x.id)
          .filter((n): n is number => typeof n === "number");
        if (idsToRemove.length) {
          ops.push(
            tx.fieldOption.deleteMany({
              where: {
                id: { in: idsToRemove },
                fieldId: id,
              },
            })
          );
        }
      }

      // 3) Exécute toutes les opérations sur options
      if (ops.length) {
        await Promise.all(ops);
      }

      // 4) Met à jour le field lui-même
      const updated = await tx.field.update({
        where: { id },
        data: { ...rest },
      });

      return updated;
    });
    await invalideCache("GET:/api/admin/catalog/*");
    await invalideCache("GET:/api/catalog/*");
    return result;
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
    await Promise.all([invalideCache("GET:/api/admin/catalog*")]);
    return await this.catalogueRepository.removeField(field.id);
  }

  //field options
  async createFieldOption(data: any) {
    try {
      await Promise.all([invalideCache("GET:/api/admin/catalog*")]);
      return await this.catalogueRepository.createFieldOption(data);
    } catch (error) {
      throw createError(
        error.status,
        `Failed to create field option: ${error.message}`
      );
    }
  }

  async attachServiceToCategories(data: AttachServicesDTO) {
    try {
      if (!data.services || data.services.length === 0) {
        throw createError(400, "No fields to attach");
      }

      const results = await Promise.allSettled(
        data.services.map((service) =>
          this.catalogueRepository.attachServiceCategory(service)
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length > 0) {
        console.error(`${failed.length} categorie failed to attach:`, failed);

        // Si toutes ont échoué, lever une erreur
        if (successful === 0) {
          throw createError(500, "All category attachments failed");
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
  async attachFieldToService(data: AttachFieldsDTO) {
    try {
      if (!data.fields || data.fields.length === 0) {
        throw createError(400, "No fields to attach");
      }

      const results = await Promise.allSettled(
        data.fields.map((field) =>
          this.catalogueRepository.attachFieldToCategory(field)
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
      const { fieldId, categoryId } = data;
      return await this.catalogueRepository.detachFieldToCategory(
        categoryId,
        fieldId
      );
    } catch (error) {
      throw createError(
        error.status || 500,
        `Failed to detach fields to service: ${error.message}`
      );
    }
  }

  //   async getFilterSchema(slug: string) {
  //     try {
  //       const category = await this.findOneCategoryBySlug(slug);
  //       const services = category.services.map((cf: any) => {
  //         return {
  //           name: cf.serviceType.name,
  //           slug: cf.serviceType.slug,
  //           id: cf.serviceType.id,
  //         };
  //       });

  //       const fields = category.CategoryField.map((cf: any) => ({
  //         key: cf.field.key,
  //         label: cf.field.label,
  //         type: cf.field.inputType,
  //         placeholder: cf.field.placeholder || null,
  //         options: cf.field.options.map((opt: any) => ({
  //           label: opt.label,
  //           value: opt.value,
  //         })),
  //       }));
  //       return {
  //         id: category.id,
  //         category: category.name,
  //         categorySlug: category.slug,
  //         services: services,
  //         fields,
  //       };
  //     } catch (error) {
  //       throw createError(
  //         error.status,
  //         `Failed to get category schema: ${error.message}`
  //       );
  //     }
  //   }

  private async checkServiceType(where: any) {
    const serviceType =
      await this.catalogueRepository.findOneServiceTypeByParams(where);
    // if (serviceType) throw createError(409, `Ce service existe deja`);
  }
}
