import { Request, Response } from "express";
import { CategoryService } from "./category.service";
import { injectable } from "tsyringe";
import { handleError } from "@/utils/helpers/handle-error";
import { formatResponse } from "@/utils/helpers/response-formatter";
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

@injectable()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  async getAllCategories(req: Request, res: Response) {
    try {
      const categories = await this.categoryService.getAllCategories();
      const response = formatResponse(200, categories);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getCategoryBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const category = await this.categoryService.getCategoryBySlug(slug);
      const response = formatResponse(200, category);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getCategoryFormSchema(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const schema = await this.categoryService.getFormSchema(slug);
      const response = formatResponse(200, schema);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const dto: CreateCategoryDto = Object.assign(
        new CreateCategoryDto(),
        req.body
      );
      const category = await this.categoryService.createCategory(dto);
      const response = formatResponse(200, category);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
  async updateCategory(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const dto: UpdateCategoryDto = Object.assign(
        new UpdateCategoryDto(),
        req.body
      );
      const category = await this.categoryService.updateCategory(id, dto);
      const response = formatResponse(200, category);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeCategory(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await this.categoryService.deleteCategory(id);
      const result = { message: "Catégorie supprimée avec succès" };
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  // ========== FIELDS ==========

  async createField(req: Request, res: Response) {
    try {
      const dto: CreateFieldDto = Object.assign(new CreateFieldDto(), req.body);
      const field = await this.categoryService.createField(dto);
      const response = formatResponse(200, field);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateField(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const dto: UpdateFieldDto = Object.assign(new UpdateFieldDto(), req.body);
      const field = await this.categoryService.updateField(id, dto);
      const response = formatResponse(200, field);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeField(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await this.categoryService.deleteField(id);
      const result = { message: "Champ supprimée avec succès" };
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findFieldById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const field = await this.categoryService.findFieldById(id);
      const response = formatResponse(200, field);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  // ========== FIELD OPTIONS ==========

  async createFieldOption(req: Request, res: Response) {
    try {
      const dto: CreateFieldOptionDto = Object.assign(
        new CreateFieldOptionDto(),
        req.body
      );
      const fieldOption = await this.categoryService.createFieldOption(dto);
      const response = formatResponse(200, fieldOption);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateFieldOption(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const dto: UpdateFieldOptionDto = Object.assign(
        new UpdateFieldOptionDto(),
        req.body
      );
      const fieldOption = await this.categoryService.updateFieldOption(id, dto);
      const response = formatResponse(200, fieldOption);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeFieldOption(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await this.categoryService.deleteFieldOption(id);
      const result = { message: "Option supprimée avec succès" };
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  // ========== CATEGORY FIELDS ==========

  async addFieldToCategory(req: Request, res: Response) {
    try {
      const dto: LinkFieldsToCategoryDTO = Object.assign(
        new LinkFieldsToCategoryDTO(),
        req.body
      );
      const result = await this.categoryService.addFieldToCategory(dto);
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateCategoryField(req: Request, res: Response) {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const fieldId = parseInt(req.params.fieldId);
      const dto: UpdateCategoryFieldDto = Object.assign(
        new UpdateCategoryFieldDto(),
        req.body
      );
      const result = await this.categoryService.updateCategoryField(
        categoryId,
        fieldId,
        dto
      );
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeFieldFromCategory(req: Request, res: Response) {
    try {
      const dto: CreateCategoryFieldDto = Object.assign(
        new CreateCategoryFieldDto(),
        req.body
      );
      const { categoryId, fieldId } = dto;
      await this.categoryService.removeFieldFromCategory(categoryId, fieldId);
      const result = { message: "Champ dissocié de la catégorie avec succès" };
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
