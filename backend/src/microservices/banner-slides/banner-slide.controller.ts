import { injectable } from "tsyringe";
import { BannerSlideService } from "./banner-slide.service";
import { Request, Response } from "express";
import { handleError } from "../../utils/helpers/handle-error";
import { saveSlideFiles } from "../../utils/functions/save-file";
import { formatResponse } from "../../utils/helpers/response-formatter";
import { paginatedResponse } from "../../utils/helpers/paginated-response";

@injectable()
export class BannerSlideController {
  constructor(private readonly bannerSlideService: BannerSlideService) {}

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

  async findActive(req: Request, res: Response) {
    try {
      const slides = await this.bannerSlideService.findActive();
      const response = formatResponse(200, slides);
      res.status(200).json(response);
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

  async findAll(req: Request, res: Response) {
    try {
      const { page: pageQuery, limit: limitQuery } = req.query;
      const page = parseInt(pageQuery as string) || 1;
      const limit = parseInt(limitQuery as string) || 10;
      const page_number = Math.max(page, 1);
      const limit_query = Math.max(limit, 10);
      const where: any = {};
      const slides = await this.bannerSlideService.findAll({
        limit: limit_query,
        page: page_number,
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
