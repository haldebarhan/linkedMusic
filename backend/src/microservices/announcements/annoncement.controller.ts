import { injectable } from "tsyringe";
import { AnnouncementService } from "./announcement.service";
import { Request, Response } from "express";
import { handleError } from "@/utils/helpers/handle-error";
import { saveFilesToBucket } from "@/utils/functions/save-file";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { CreateAnnoncementDTO, UpdateAnnoncementDTO } from "./announcement.dto";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { Order } from "@/utils/enums/order.enum";
import { paginatedResponse } from "@/utils/helpers/paginated-response";
import { AnnouncementStatus } from "@/utils/enums/announcement-status.enum";
import { AnnouncementStatus as Status } from "@prisma/client";

@injectable()
export class AnnoncementController {
  constructor(private readonly annoncementService: AnnouncementService) {}

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      const files = req.files as Express.Multer.File[];
      const data = Object.assign(new CreateAnnoncementDTO(), req.body);
      const saveFiles = await saveFilesToBucket("annoncements", files);
      const images = saveFiles.map((image) => image.objectName);
      await this.annoncementService.create(data, user.id, images);
      const response = formatResponse(201, {
        message: "ad created and submitted for approval",
      });
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async search(req: Request, res: Response) {
    try {
      const { q, serviceTypeId, isHighlighted, location, order, page, limit } =
        req.query;
      const filters: string[] = [];

      const service: number | undefined = parseInt(serviceTypeId as string);
      const orderQuery = [Order.ASC, Order.DESC].includes(order as Order)
        ? (order as Order)
        : Order.DESC;
      const pageNumber = parseInt(page as string) || 1;
      const limitQuery = parseInt(limit as string) || 10;

      const page_number = Math.max(pageNumber, 1);
      const limit_query = Math.max(limitQuery, 10);

      filters.push(`isPublished = ${true}`);
      if (isHighlighted !== undefined)
        filters.push(`isHighlighted = ${isHighlighted}`);
      if (location) filters.push(`location = "${location}"`);
      if (serviceTypeId) filters.push(`serviceTypeId = ${service}`);

      const results = await this.annoncementService.search(q as string, {
        filters,
        limit: limit_query,
        page: page_number,
        order: orderQuery,
      });

      const response = paginatedResponse(200, results);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async myAds(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        page: pageQuery,
        limit: limitQuery,
        order: orderQuery,
      } = req.query;
      const user = req.user;
      const where: any = {};

      const page = parseInt(pageQuery as string) || 1;
      const limit = parseInt(limitQuery as string) || 10;

      const page_number = Math.max(page, 1);
      const limit_query = Math.max(limit, 10);
      const order = [Order.ASC, Order.DESC].includes(orderQuery as Order)
        ? (orderQuery as Order)
        : Order.DESC;
      where.ownerId = user.id;
      const ads = await this.annoncementService.findAll({
        limit: limit_query,
        page: page_number,
        order,
        where,
      });
      const response = paginatedResponse(200, ads);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async myAd(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const ad = await this.annoncementService.findOne(+id);
      const response = formatResponse(200, ad);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeAd(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;
      await this.annoncementService.removeAd(+id, user.id);
      const response = formatResponse(200, "ad removed successfully");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      const { id } = req.params;
      const files = req.files as Express.Multer.File[] | undefined;
      const data = Object.assign(new UpdateAnnoncementDTO(), req.body);
      const saveFiles = files
        ? await saveFilesToBucket("annoncements", files)
        : undefined;
      const images = saveFiles?.map((image) => image.objectName);
      const updated = await this.annoncementService.update(
        +id,
        data,
        user.id,
        images
      );
      const response = formatResponse(200, updated);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async changeStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { status } = req.body;
      const { user } = req;
      const { id } = req.params;
      await this.annoncementService.changeStatus(
        +id,
        user.id,
        status as AnnouncementStatus
      );
      const response = formatResponse(200, "Operation successfully completed");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findPendingAds(req: Request, res: Response) {
    try {
      const {
        page: pageQuery,
        limit: limitQuery,
        order: orderQuery,
      } = req.query;
      const where: any = { status: Status.PENDING_APPROVAL };

      const page = parseInt(pageQuery as string) || 1;
      const limit = parseInt(limitQuery as string) || 10;

      const page_number = Math.max(page, 1);
      const limit_query = Math.max(limit, 10);
      const order = [Order.ASC, Order.DESC].includes(orderQuery as Order)
        ? (orderQuery as Order)
        : Order.DESC;
      const ads = await this.annoncementService.findAll({
        limit: limit_query,
        page: page_number,
        order,
        where,
      });
      const response = paginatedResponse(200, ads);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ad = await this.annoncementService.findOne(+id, true);
      const response = formatResponse(200, ad);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async validateAd(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.annoncementService.validateAd(+id);
      const response = formatResponse(200, "Operation successfully completed");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
