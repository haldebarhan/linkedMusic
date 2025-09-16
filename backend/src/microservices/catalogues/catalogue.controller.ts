import { injectable } from "tsyringe";
import { CatalogueService } from "./catalogue.service";
import { Request, Response } from "express";
import {
  AttachFieldDTO,
  AttachFieldsDTO,
  AttachServicedDTO,
  AttachServicesDTO,
  CreateCategoryDTO,
  CreateFieldDto,
  CreateFieldOptionDto,
  CreateServiceTypeDTO,
  UpdateCategoryDTO,
} from "./catalogue.dto";
import { handleError } from "@/utils/helpers/handle-error";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { Order } from "@/utils/enums/order.enum";
import { paginatedResponse } from "@/utils/helpers/paginated-response";

@injectable()
export class CatalogueController {
  constructor(private readonly catalogueService: CatalogueService) {}

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

  async listCategories(req: Request, res: Response) {
    try {
      const {
        page: pageQuery,
        limit: limitQuery,
        order: orderQuery,
        q: searchQuery,
      } = req.query;
      const where: any = {};

      if (searchQuery) {
        where.name = {
          contains: searchQuery,
          mode: "insensitive",
        };
      }

      const page = parseInt(pageQuery as string) || 1;
      const limit = parseInt(limitQuery as string) || 10;

      const page_number = Math.max(page, 1);
      const limit_query = Math.max(limit, 10);
      const order = [Order.ASC, Order.DESC].includes(orderQuery as Order)
        ? (orderQuery as Order)
        : Order.DESC;
      const categories = await this.catalogueService.listCategories({
        limit: limit_query,
        page: page_number,
        order,
        where,
      });
      const response = paginatedResponse(200, categories);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await this.catalogueService.findCategory(+id);
      const response = formatResponse(200, category);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.catalogueService.removeCategory(+id);
      const response = formatResponse(200, {
        message: "Action completed successfully",
      });
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dto: UpdateCategoryDTO = Object.assign(
        new UpdateCategoryDTO(),
        req.body
      );
      const category = await this.catalogueService.updateCategory(+id, dto);
      const response = formatResponse(200, category);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  // Service types

  async createServiceType(req: Request, res: Response) {
    try {
      const dto: CreateServiceTypeDTO = Object.assign(
        new CreateServiceTypeDTO(),
        req.body
      );
      const result = await this.catalogueService.createServiceType(dto);
      const response = formatResponse(201, result);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async listServiceTypes(req: Request, res: Response) {
    try {
      const {
        page: pageQuery,
        limit: limitQuery,
        order: orderQuery,
        q: searchQuery,
      } = req.query;
      const where: any = {};
      if (searchQuery) {
        where.name = {
          contains: searchQuery,
          mode: "insensitive",
        };
      }

      const page = parseInt(pageQuery as string) || 1;
      const limit = parseInt(limitQuery as string) || 10;

      const page_number = Math.max(page, 1);
      const limit_query = Math.max(limit, 10);
      const order = [Order.ASC, Order.DESC].includes(orderQuery as Order)
        ? (orderQuery as Order)
        : Order.DESC;
      const services = await this.catalogueService.listServiceTypes({
        limit: limit_query,
        page: page_number,
        order,
        where,
      });
      const response = paginatedResponse(200, services);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findServiceTypes(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const service = await this.catalogueService.findOneServiceType(+id);
      const response = formatResponse(200, service);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeServiceTypes(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const service = await this.catalogueService.removeServiceType(+id);
      const response = formatResponse(200, service);
      res.status(200).json(response);
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

  async listFields(req: Request, res: Response) {
    try {
      const {
        page: pageQuery,
        limit: limitQuery,
        order: orderQuery,
      } = req.query;
      const where: any = {};

      const page = parseInt(pageQuery as string) || 1;
      const limit = parseInt(limitQuery as string) || 10;

      const page_number = Math.max(page, 1);
      const limit_query = Math.max(limit, 10);
      const order = [Order.ASC, Order.DESC].includes(orderQuery as Order)
        ? (orderQuery as Order)
        : Order.DESC;
      const fields = await this.catalogueService.listFields({
        limit: limit_query,
        page: page_number,
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

  async detachService(req: Request, res: Response) {
    try {
      const dto: AttachServicedDTO = Object.assign(
        new AttachServicedDTO(),
        req.body
      );
      const result = await this.catalogueService.dettachServiceToCategory(dto);
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
      const result = await this.catalogueService.getFilterSchema(category);
      const response = formatResponse(201, result);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
