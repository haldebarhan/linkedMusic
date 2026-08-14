import { injectable } from "tsyringe";
import { CatalogueService } from "./catalogue.service";
import { Request, Response } from "express";
import {
  AttachFieldDTO,
  AttachFieldsDTO,
  AttachServicesDTO,
  CreateCategoryDTO,
  CreateFieldDto,
  CreateFieldOptionDto,
  UpdateFieldDto,
} from "./catalogue.dto";
import { handleError } from "../../utils/helpers/handle-error";
import { formatResponse } from "../../utils/helpers/response-formatter";
import { Order } from "../../utils/enums/order.enum";
import { paginatedResponse } from "../../utils/helpers/paginated-response";
import { parseCursor } from "../../utils/helpers/cursor-pagination";

@injectable()
export class CatalogueController {
  constructor(private readonly catalogueService: CatalogueService) { }

  async createCategory(req: Request, res: Response) {
    try {
      const dto: CreateCategoryDTO = Object.assign(
        new CreateCategoryDTO(),
        req.body
      );
      const result = await this.catalogueService.createCategory(dto);
      const response = formatResponse(201, result);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  // Fields
  async createField(req: Request, res: Response) {
    try {
      const dto: CreateFieldDto = Object.assign(new CreateFieldDto(), req.body);
      const result = await this.catalogueService.createField(dto);
      const response = formatResponse(201, result);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateField(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dto: UpdateFieldDto = Object.assign(new UpdateFieldDto(), req.body);
      const result = await this.catalogueService.updateField(+id, dto);
      const response = formatResponse(201, result);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async listFields(req: Request, res: Response) {
    try {
      const {
        cursor: cursorQuery,
        limit: limitQuery,
        order: orderQuery,
      } = req.query;
      const where: any = {};

      const limit = parseInt(limitQuery as string) || 10;
      const cursor = parseCursor(cursorQuery);
      const limit_query = Math.max(limit, 10);
      const order = [Order.ASC, Order.DESC].includes(orderQuery as Order)
        ? (orderQuery as Order)
        : Order.DESC;
      const fields = await this.catalogueService.listFields({
        limit: limit_query,
        cursor,
        order,
        where,
      });
      const response = paginatedResponse(200, fields);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findField(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const field = await this.catalogueService.findfield(+id);
      const response = formatResponse(200, field);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async createFieldOption(req: Request, res: Response) {
    try {
      const dto: CreateFieldOptionDto = Object.assign(
        new CreateFieldOptionDto(),
        req.body
      );
      const result = await this.catalogueService.createFieldOption(dto);
      const response = formatResponse(201, result);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeFields(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.catalogueService.removeField(+id);
      const response = formatResponse(200, {
        message: "Action completed successfully",
      });
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async attachService(req: Request, res: Response) {
    try {
      const dto: AttachServicesDTO = Object.assign(
        new AttachServicesDTO(),
        req.body
      );
      const result = await this.catalogueService.attachServiceToCategories(dto);
      const response = formatResponse(201, result);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async attachField(req: Request, res: Response) {
    try {
      const dto: AttachFieldsDTO = Object.assign(
        new AttachFieldsDTO(),
        req.body
      );
      const result = await this.catalogueService.attachFieldToService(dto);
      const response = formatResponse(201, result);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async detachField(req: Request, res: Response) {
    try {
      const dto: AttachFieldDTO = Object.assign(new AttachFieldDTO(), req.body);
      const result = await this.catalogueService.dettachFieldToService(dto);
      const response = formatResponse(201, result);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getFilterSchema(req: Request, res: Response) {
    try {
      const { category } = req.params;
      //   const result = await this.catalogueService.getFilterSchema(category);
      const response = formatResponse(201, "result");
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
