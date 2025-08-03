import { injectable } from "tsyringe";
import { StyleService } from "./style.service";
import { Request, Response } from "express";
import { handleError } from "@/utils/helpers/handle-error";
import { CreateStyleDTO, UpdateStyleDTO } from "./style.dto";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { Order } from "@/utils/enums/order.enum";
import { paginatedResponse } from "@/utils/helpers/paginated-response";

@injectable()
export class StyleController {
  constructor(private readonly styleService: StyleService) {}

  async create(req: Request, res: Response) {
    try {
      const data = Object.assign(new CreateStyleDTO(), req.body);
      const created = await this.styleService.create(data);
      const response = formatResponse(201, created);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findAll(req: Request, res: Response) {
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
      const styles = await this.styleService.findAll({
        limit: limit_query,
        page: page_number,
        order,
        where,
      });
      const response = paginatedResponse(200, styles);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const style = await this.styleService.findOne(+id);
      const response = formatResponse(200, style);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = Object.assign(new UpdateStyleDTO(), req.body);
      const updated = await this.styleService.update(+id, data);
      const response = formatResponse(200, updated);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.styleService.remove(+id);
      const response = formatResponse(200, "Operation successfully completed");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
