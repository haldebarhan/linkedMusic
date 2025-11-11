import {
  PrismaClient,
  Category,
  Field,
  FieldOption,
  CategoryField,
} from "@prisma/client";
import {
  CategoryWithFields,
  FieldWithOptions,
  FormSchema,
} from "@/utils/types/relation-type";

import { ReferenceBaseRepository } from "../references/reference-base.repository";
import { injectable } from "tsyringe";
import DatabaseService from "@/utils/services/database.service";
const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class CategoryRepository extends ReferenceBaseRepository<Category> {
  constructor() {
    super(prisma, "category");
  }

  async findBySlugWithFields(slug: string): Promise<CategoryWithFields | null> {
    return prisma.category.findUnique({
      where: { slug },
      include: {
        categoryFields: {
          include: {
            field: {
              include: {
                options: {
                  where: { active: true },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    }) as Promise<CategoryWithFields | null>;
  }

  async getFormSchema(slug: string): Promise<FormSchema | null> {
    const category = await this.findBySlugWithFields(slug);

    if (!category) {
      return null;
    }

    // Enrichir les champs avec les données externes si nécessaire
    for (const cf of category.categoryFields) {
      if (cf.fields.externalTable) {
        const externalData = await this.loadExternalTableData(
          cf.fields.externalTable
        );
        cf.fields.options = externalData.map((item: any) => ({
          id: item.id,
          fieldId: cf.fields.id,
          label: item.name,
          value: item.slug || item.code || item.name,
          order: item.order || 0,
          active: item.active !== false,
          metadata: null,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));
      }
    }

    return {
      category: {
        id: category.category.id,
        name: category.category.name,
        slug: category.category.slug,
        icon: category.category.icon || "",
        order: category.category.order,
        active: category.category.active,
        createdAt: category.category.createdAt,
        updatedAt: category.category.updatedAt,
      },
      fields: category.categoryFields.map((cf) => ({
        field: cf.fields,
        required: cf.required,
        order: cf.order,
        dependsOn: cf.fields.dependsOn || undefined,
        showWhen: cf.fields.showWhen || undefined,
      })),
    };
  }
  private async loadExternalTableData(tableName: string): Promise<any[]> {
    const modelName = this.getModelNameFromTable(tableName);
    if (!modelName) return [];

    const model = (prisma as any)[modelName];
    if (!model) return [];

    return model.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
  }

  private getModelNameFromTable(tableName: string): string | null {
    const mapping: Record<string, string> = {
      MusicStyle: "musicStyle",
      Instrument: "instrument",
      Language: "language",
      Software: "software",
    };
    return mapping[tableName] || null;
  }

  async findAllActive(): Promise<Category[]> {
    return this.findAll({
      where: { active: true },
      orderBy: { order: "asc" },
    });
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return this.exists({ slug });
  }
}
