import { injectable } from "tsyringe";
import { AnnouncementService } from "./ann.service";
import { Request, Response } from "express";
import { handleError } from "@/utils/helpers/handle-error";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { CreateAnnouncementDto, UpdateAnnouncementDto } from "./ann.dto";
import { formatResponse } from "@/utils/helpers/response-formatter";

@injectable()
export class AnnouncementController {
  constructor(private readonly annService: AnnouncementService) {}

  async createAnnouncement(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const annDTO: CreateAnnouncementDto = Object.assign(
        new CreateAnnouncementDto(),
        req.body
      );
      const announcement = await this.annService.create(user.id, annDTO);
      const response = formatResponse(201, announcement);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const announcement = await this.annService.findOne(+id);
      const response = formatResponse(200, announcement);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;
      const annData: UpdateAnnouncementDto = Object.assign(
        new UpdateAnnouncementDto(),
        req.body
      );
      const updated = await this.annService.update(+id, user.id, annData);
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
      await this.annService.removeAnnouncement(+id, user.id);
      const response = formatResponse(200, {
        message: "Annoucement removed succefully",
      });
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async listByCategory(req: Request, res: Response) {
    try {
      const {
        page: _p,
        q: _q,
        limit: _l,
        ...filters
      } = req.query as Record<string, any>;
      const { category } = req.params;
      const page = parseInt(_p as string) || 1;
      const limit = parseInt(_l as string) || 10;
      const results = await this.annService.listByCategory(
        category,
        filters,
        page,
        limit
      );
      const response = formatResponse(200, results);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
