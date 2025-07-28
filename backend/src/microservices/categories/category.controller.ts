import { injectable } from "tsyringe";
import { CategoryService } from "./category.service";
import { Request, Response } from "express";
import { handleError } from "@/utils/helpers/handle-error";
import { CreateCategoryDTO, UpdateCategoryDTO } from "./category.dto";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { Order } from "@/utils/enums/order.enum";
import { paginatedResponse } from "@/utils/helpers/paginated-response";
import { saveFileToBucket } from "@/utils/functions/save-file";

@injectable()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  async create(req: Request, res: Response) {
    try {
      const data = Object.assign(new CreateCategoryDTO(), req.body);
      const file = req.file as Express.Multer.File | undefined;
      const saveFile = file ? await saveFileToBucket("icons", file) : undefined;
      if (saveFile?.objectName) {
        data.icon = saveFile.objectName;
      }
      const created = await this.categoryService.create(data);
      const response = formatResponse(201, created);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await this.categoryService.findOne(+id);
      const response = formatResponse(200, category);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findAll(req: Request, res: Response) {
    const { page: pageQuery, limit: limitQuery, order: orderQuery } = req.query;

    const page = parseInt(pageQuery as string) || 1;
    const limit = parseInt(limitQuery as string) || 10;

    const page_number = Math.max(page, 1);
    const limit_query = Math.max(limit, 10);
    const order = [Order.ASC, Order.DESC].includes(orderQuery as Order)
      ? (orderQuery as Order)
      : Order.DESC;

    const where: any = {};

    try {
      const categories = await this.categoryService.findAll({
        limit: limit_query,
        page: page_number,
        order,
        where,
      });

      const response = paginatedResponse(200, categories);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async udpate(req: Request, res: Response) {
    const { id } = req.params;
    const file = req.file as Express.Multer.File | undefined;
    const data = Object.assign(new UpdateCategoryDTO(), req.body);
    const saveFile = file ? await saveFileToBucket("icons", file) : undefined;
    if (saveFile?.objectName) {
      data.icon = saveFile.objectName;
    }
    try {
      const updated = await this.categoryService.update(+id, data);
      const response = formatResponse(200, updated);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.categoryService.remove(+id);
      const response = formatResponse(200, "Category removed successfully");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
