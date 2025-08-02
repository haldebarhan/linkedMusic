import { injectable } from "tsyringe";
import { ServiceTypeService } from "./service-type.service";
import { Request, Response } from "express";
import { CreateServiceDTO, UpdateServiceDTO } from "./service.dto";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { handleError } from "@/utils/helpers/handle-error";
import { Order } from "@/utils/enums/order.enum";
import { paginatedResponse } from "@/utils/helpers/paginated-response";

@injectable()
export class ServiceTypeController {
  constructor(private readonly serviceTypeService: ServiceTypeService) {}

  async create(req: Request, res: Response) {
    try {
      const createDTO: CreateServiceDTO = Object.assign(
        new CreateServiceDTO(),
        req.body
      );
      const service = await this.serviceTypeService.create(createDTO);
      const response = formatResponse(201, service);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const updateDTO: UpdateServiceDTO = Object.assign(
        new UpdateServiceDTO(),
        req.body
      );
      const { id } = req.params;
      const updated = await this.serviceTypeService.update(+id, updateDTO);
      const response = formatResponse(201, updated);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const service = await this.serviceTypeService.findOne(+id);
      const response = formatResponse(200, service);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findAll(req: Request, res: Response) {
    const {
      page: pageQuery,
      limit: limitQuery,
      order: orderQuery,
      category: categoryQuery,
    } = req.query;

    const page = parseInt(pageQuery as string) || 1;
    const limit = parseInt(limitQuery as string) || 10;
    const category = parseInt(categoryQuery as string) ?? undefined;

    const page_number = Math.max(page, 1);
    const limit_query = Math.max(limit, 10);
    const order = [Order.ASC, Order.DESC].includes(orderQuery as Order)
      ? (orderQuery as Order)
      : Order.DESC;

    const where: any = {};
    if (category) where.categoryId = category;

    try {
      const services = await this.serviceTypeService.findAll({
        limit: limit_query,
        page: page_number,
        order,
        where,
      });

      const response = paginatedResponse(200, services);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
