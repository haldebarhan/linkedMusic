import { injectable } from "tsyringe";
import { CategoryRepository } from "./category.repository";
import { FieldRepository } from "../fields/field.repository";
import { FieldOptionRepository } from "../fields/field-option.repository";
import { CategoryFieldRepository } from "../category-fields/category-field.repository";
import { AppError } from "@/utils/classes/app-error";
import { ErrorCode } from "@/utils/enums/error-code.enum";
import { FormSchema } from "@/utils/types/relation-type";
import {
  CreateCategoryDto,
  CreateCategoryFieldDto,
  CreateFieldDto,
  CreateFieldOptionDto,
  LinkFieldsToCategoryDTO,
  UpdateCategoryDto,
  UpdateCategoryFieldDto,
  UpdateFieldDto,
  UpdateFieldOptionDto,
} from "./category.dto";
import { Order } from "@/utils/enums/order.enum";

@injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly fieldRepository: FieldRepository,
    private readonly fieldOptionRepository: FieldOptionRepository,
    private readonly categoryFieldRepository: CategoryFieldRepository
  ) {}

  async getAllCategories(params: {
    limit: number;
    page: number;
    order: Order;
    where?: any;
  }) {
    const { limit, page, order, where } = params;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.categoryRepository.findAll({
        where,
        orderBy: { createdAt: order },
        take: limit,
        skip,
      }),
      this.categoryRepository.count(where),
    ]);
    return {
      data,
      metadata: {
        total,
        page,
        totalPage: Math.ceil(total / limit),
      },
    };
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.categoryRepository.findBySlugWithFields(slug);
    if (!category) {
      throw new AppError(ErrorCode.NOT_FOUND, "Catégorie non trouvée", 404);
    }
    return category;
  }

  async getFormSchema(slug: string): Promise<FormSchema> {
    const schema = await this.categoryRepository.getFormSchema(slug);
    if (!schema) {
      throw new AppError(ErrorCode.NOT_FOUND, "Catégorie non trouvée", 404);
    }
    return schema;
  }

  async createCategory(dto: CreateCategoryDto) {
    const exists = await this.categoryRepository.existsBySlug(dto.slug);
    if (exists) {
      throw new AppError(
        ErrorCode.DUPLICATE,
        "Une catégorie avec ce slug existe déjà",
        409
      );
    }

    return this.categoryRepository.create(dto);
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppError(ErrorCode.NOT_FOUND, "Catégorie non trouvée", 404);
    }

    return this.categoryRepository.update(id, dto);
  }

  async deleteCategory(id: number) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppError(ErrorCode.NOT_FOUND, "Catégorie non trouvée", 404);
    }

    return this.categoryRepository.delete(id);
  }

  async desableCategory(id: number) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppError(ErrorCode.NOT_FOUND, "Catégorie non trouvée", 404);
    }
    return this.categoryRepository.update(id, { active: false });
  }

  async createField(dto: CreateFieldDto) {
    const { options, ...fieldData } = dto;
    const field = await this.fieldRepository.create(fieldData);

    if (options && options.length > 0) {
      for (const option of options) {
        await this.fieldOptionRepository.create({
          fieldId: field.id,
          label: option.label,
          value: option.value,
          order: option.order,
          active: true,
        });
      }
    }
    return this.fieldRepository.findById(field.id);
  }

  /**
   * Met à jour un champ
   */
  async updateField(id: number, dto: UpdateFieldDto) {
    const field = await this.fieldRepository.findById(id);
    if (!field) {
      throw new AppError(ErrorCode.NOT_FOUND, "Champ non trouvé", 404);
    }

    const { options, optionsToRemove, ...fieldData } = dto;
    await this.fieldRepository.update(id, fieldData);

    if (optionsToRemove && optionsToRemove.length > 0) {
      for (const option of optionsToRemove) {
        if (option.id) {
          await this.fieldOptionRepository.delete(option.id);
        }
      }
    }

    if (options && options.length > 0) {
      for (const option of options) {
        if (option.id && option.id > 0) {
          // Option existante : mettre à jour
          await this.fieldOptionRepository.update(option.id, {
            label: option.label,
            value: option.value,
            order: option.order,
          });
        } else {
          // Nouvelle option : créer
          await this.fieldOptionRepository.create({
            fieldId: id,
            label: option.label,
            value: option.value,
            order: option.order,
            active: true,
          });
        }
      }
    }

    return this.fieldRepository.findById(id);
  }

  /**
   * Supprime un champ
   */
  async deleteField(id: number) {
    return this.fieldRepository.delete(id);
  }

  /**
   * Crée une option de champ
   */
  async createFieldOption(dto: CreateFieldOptionDto) {
    return this.fieldOptionRepository.create(dto);
  }

  /**
   * Met à jour une option de champ
   */
  async updateFieldOption(id: number, dto: UpdateFieldOptionDto) {
    return this.fieldOptionRepository.update(id, dto);
  }

  /**
   * Supprime une option de champ
   */
  async deleteFieldOption(id: number) {
    return this.fieldOptionRepository.delete(id);
  }

  /**
   * Associe un champ à une catégorie
   */
  async addFieldToCategory(dto: LinkFieldsToCategoryDTO) {
    try {
      if (!dto.fields || dto.fields.length === 0) {
        throw new AppError(ErrorCode.BAD_REQUEST, "No fields to attach", 400);
      }
      const results = await Promise.allSettled(
        dto.fields.map((field) => this.categoryFieldRepository.create(field))
      );
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        console.error(`${failed.length} fields failed to attach:`, failed);

        // Si toutes ont échoué, lever une erreur
        if (successful === 0) {
          throw new AppError(
            ErrorCode.INTERNAL_ERROR,
            "All field attachments failed",
            500
          );
        }
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
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to attach fields to category: ${error.message}`,
        error.status || 500
      );
    }
  }

  /**
   * Met à jour l'association champ-catégorie
   */
  async updateCategoryField(
    categoryId: number,
    fieldId: number,
    dto: UpdateCategoryFieldDto
  ) {
    return this.categoryFieldRepository.update(categoryId, fieldId, dto);
  }

  /**
   * Dissocie un champ d'une catégorie
   */
  async removeFieldFromCategory(categoryId: number, fieldId: number) {
    return this.categoryFieldRepository.delete(categoryId, fieldId);
  }

  async findFieldById(fieldId: number) {
    const include = {
      categoryFields: { select: { category: true } },
      options: true,
    };
    const field = await this.fieldRepository.findById(fieldId, include);
    if (!field)
      throw new AppError(ErrorCode.NOT_FOUND, "Champ non trouvé", 404);
    return field;
  }
}
