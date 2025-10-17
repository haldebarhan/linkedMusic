import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { SubscriptionService } from "./subscription.service";
import { handleError } from "@/utils/helpers/handle-error";
import { CreatePlanDTO, SubscribeDTO, UpdatePlanDTO } from "./dto/plan.dto";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { Order } from "@/utils/enums/order.enum";
import { paginatedResponse } from "@/utils/helpers/paginated-response";

@injectable()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async createPlan(req: Request, res: Response) {
    try {
      const data: CreatePlanDTO = Object.assign(new CreatePlanDTO(), req.body);
      const created = await this.subscriptionService.createPlan(data);
      const response = formatResponse(201, created);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async updatePlan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdatePlanDTO = Object.assign(new UpdatePlanDTO(), req.body);
      const updated = await this.subscriptionService.update(+id, data);
      const response = formatResponse(201, updated);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findSubscriptionPlans(req: Request, res: Response) {
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
      const plans = await this.subscriptionService.findSubscriptionPlans({
        limit: limit_query,
        page: page_number,
        order,
        where,
      });
      const response = paginatedResponse(200, plans);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findSubscriptionPlan(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const plan = await this.subscriptionService.findOne(+id);
      const response = formatResponse(200, plan);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async subscribe(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const data: SubscribeDTO = Object.assign(new SubscribeDTO(), req.body);
      const subscribe = await this.subscriptionService.subscribe(user.id, data);
      const response = formatResponse(200, subscribe);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
