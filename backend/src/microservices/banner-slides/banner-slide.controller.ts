import { injectable } from "tsyringe";
import { BannerSlideService } from "./banner-slide.service";
import { Request, Response } from "express";
import { handleError } from "../../utils/helpers/handle-error";
import { saveSlideFiles } from "../../utils/functions/save-file";
import { formatResponse } from "../../utils/helpers/response-formatter";
import { paginatedResponse } from "../../utils/helpers/paginated-response";
import { parsePaginationParams } from "@/utils/functions/utilities";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { Role } from "../../utils/enums/role.enum"

@injectable()
export class BannerSlideController {
  constructor(private readonly bannerSlideService: BannerSlideService) { }

  async create(req: Request, res: Response) {
    try {
      const file = req.file as Express.Multer.File;
      const upload = await saveSlideFiles(file);
      const slides = await this.bannerSlideService.create(upload);
      const response = formatResponse(201, slides);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async toggleStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const slide = await this.bannerSlideService.toggleStatus(
        +id,
        isActive as boolean
      );
      const response = formatResponse(200, slide);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findAll(req: AuthenticatedRequest, res: Response) {
    try {
      const { cursor, limit, sortOrder, where } = parsePaginationParams(req.query);
      if (!req.user || req.user.role !== Role.ADMIN) where.isActive = true
      const slides = await this.bannerSlideService.findAll({
        limit,
        cursor,
        order: sortOrder,
        where,
      });
      const response = paginatedResponse(200, slides);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await this.bannerSlideService.remove(id);
      const response = formatResponse(200, { message: "Slide removed" });
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async reorder(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { newOrder } = req.body;
      const slide = await this.bannerSlideService.reorder(id, +newOrder);
      const response = formatResponse(200, slide);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
