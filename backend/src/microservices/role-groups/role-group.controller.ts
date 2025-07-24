import { injectable } from "tsyringe";
import { Request, Response } from "express";
import { handleError } from "@/utils/helpers/handle-error";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { Order } from "@/utils/enums/order.enum";
import { paginatedResponse } from "@/utils/helpers/paginated-response";
import { CreateRoleGroupDTO } from "../categories/category.dto";
import { RoleGroupService } from "./role-group.service";

@injectable()
export class RoleGroupController {
  constructor(private readonly roleGroupService: RoleGroupService) {}

  async create(req: Request, res: Response) {
    try {
      const data = Object.assign(new CreateRoleGroupDTO(), req.body);
      const created = await this.roleGroupService.create(data);
      const response = formatResponse(201, created);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const serviceType = await this.roleGroupService.findOne(+id);
      const response = formatResponse(200, serviceType);
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
      const serviceTypes = await this.roleGroupService.findAll({
        limit: limit_query,
        page: page_number,
        order,
        where,
      });

      const response = paginatedResponse(200, serviceTypes);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async udpate(req: Request, res: Response) {
    const { id } = req.params;
    const data = Object.assign(new CreateRoleGroupDTO(), req.body);
    try {
      const updated = await this.roleGroupService.update(+id, data);
      const response = formatResponse(200, updated);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.roleGroupService.remove(+id);
      const response = formatResponse(200, "role group removed successfully");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
