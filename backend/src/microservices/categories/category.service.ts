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
  UpdateCategoryDto,
  UpdateCategoryFieldDto,
  UpdateFieldDto,
  UpdateFieldOptionDto,
} from "./category.dto";

@injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly fieldRepository: FieldRepository,
    private readonly fieldOptionRepository: FieldOptionRepository,
    private readonly categoryFieldRepository: CategoryFieldRepository
  ) {}

  async getAllCategories() {
    return this.categoryRepository.findAllActive();
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

  async createField(dto: CreateFieldDto) {
    return this.fieldRepository.create(dto);
  }

  /**
   * Met à jour un champ
   */
  async updateField(id: number, dto: UpdateFieldDto) {
    const field = await this.fieldRepository.findById(id);
    if (!field) {
      throw new AppError(ErrorCode.NOT_FOUND, "Champ non trouvé", 404);
    }

    return this.fieldRepository.update(id, dto);
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
  async addFieldToCategory(dto: CreateCategoryFieldDto) {
    return this.categoryFieldRepository.create(dto);
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
}
