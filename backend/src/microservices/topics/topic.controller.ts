import { injectable } from "tsyringe";
import { Request, Response } from "express";

import { formatResponse } from "@/utils/helpers/response-formatter";
import { handleError } from "@/utils/helpers/handle-error";
import { Order } from "@/utils/enums/order.enum";
import { paginatedResponse } from "@/utils/helpers/paginated-response";
import { TopicService } from "./topic.service";
import { CreateTopicDTO, UpdateTopicDTO } from "./topic.dto";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";

@injectable()
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      const data = Object.assign(new CreateTopicDTO(), req.body);
      const created = await this.topicService.create(data, user.id);
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
      const topics = await this.topicService.findAll({
        limit: limit_query,
        page: page_number,
        order,
        where,
      });
      const response = paginatedResponse(200, topics);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findFavoriteTopic(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        page: pageQuery,
        limit: limitQuery,
        order: orderQuery,
      } = req.query;
      const { user } = req;
      const page = parseInt(pageQuery as string) || 1;
      const limit = parseInt(limitQuery as string) || 10;

      const page_number = Math.max(page, 1);
      const limit_query = Math.max(limit, 10);
      const order = [Order.ASC, Order.DESC].includes(orderQuery as Order)
        ? (orderQuery as Order)
        : Order.DESC;
      const topics = await this.topicService.findFavoriteTopic(user.id, {
        limit: limit_query,
        page: page_number,
        order,
      });
      const response = paginatedResponse(200, topics);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findWatchTopic(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        page: pageQuery,
        limit: limitQuery,
        order: orderQuery,
      } = req.query;
      const { user } = req;
      const page = parseInt(pageQuery as string) || 1;
      const limit = parseInt(limitQuery as string) || 10;

      const page_number = Math.max(page, 1);
      const limit_query = Math.max(limit, 10);
      const order = [Order.ASC, Order.DESC].includes(orderQuery as Order)
        ? (orderQuery as Order)
        : Order.DESC;
      const topics = await this.topicService.findWatchTopic(user.id, {
        limit: limit_query,
        page: page_number,
        order,
      });
      const response = paginatedResponse(200, topics);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const { page: pageQuery, limit: limitQuery } = req.query;

      const page = parseInt(pageQuery as string) || 1;
      const limit = parseInt(limitQuery as string) || 10;

      const page_number = Math.max(page, 1);
      const limit_query = Math.max(limit, 10);

      const { id } = req.params;
      const topic = await this.topicService.findTopic(+id, {
        page: page_number,
        limit: limit_query,
      });
      const response = formatResponse(200, topic);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;
      const data = Object.assign(new UpdateTopicDTO(), req.body);
      const updated = await this.topicService.update(+id, data, user.id);
      const response = formatResponse(200, updated);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;
      await this.topicService.remove(+id, user.id);
      const response = formatResponse(200, "Operation successfully completed");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async toggleFavorite(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;
      await this.topicService.toggleFavorite(+id, user.id);
      const response = formatResponse(200, "Operation successfully completed");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async toggleWatch(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;
      await this.topicService.toggleWatch(+id, user.id);
      const response = formatResponse(200, "Operation successfully completed");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
