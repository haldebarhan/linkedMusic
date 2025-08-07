import { injectable } from "tsyringe";
import { TopicCategoryService } from "./topic-category.service";
import { Request, Response } from "express";
import {
  CreateTopicCategoryDTO,
  UpdateTopicCategoryDTO,
} from "./topic-category.dto";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { handleError } from "@/utils/helpers/handle-error";
import { Order } from "@/utils/enums/order.enum";
import { paginatedResponse } from "@/utils/helpers/paginated-response";

@injectable()
export class TopicCategoryController {
  constructor(private readonly topicCategoryService: TopicCategoryService) {}

  async create(req: Request, res: Response) {
    try {
      const data = Object.assign(new CreateTopicCategoryDTO(), req.body);
      const created = await this.topicCategoryService.createTopicCategory(data);
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
      const topicCategories = await this.topicCategoryService.findAll({
        limit: limit_query,
        page: page_number,
        order,
        where,
      });
      const response = paginatedResponse(200, topicCategories);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const topicCategory = await this.topicCategoryService.findTopicCategory(
        +id
      );
      const response = formatResponse(200, topicCategory);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = Object.assign(new UpdateTopicCategoryDTO(), req.body);
      const updated = await this.topicCategoryService.updateTopicCategory(
        +id,
        data
      );
      const response = formatResponse(200, updated);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.topicCategoryService.remove(+id);
      const response = formatResponse(200, "Operation successfully completed");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
