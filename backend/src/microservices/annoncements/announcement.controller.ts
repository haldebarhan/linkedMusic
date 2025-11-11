import { injectable } from "tsyringe";
import { AnnouncementService } from "./announcement.service";
import { handleError } from "@/utils/helpers/handle-error";
import { Request, Response } from "express";
import {
  AnnouncementQueryDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from "./announcement.dto";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { Order } from "@/utils/enums/order.enum";
import { saveAnnouncementFiles } from "@/utils/functions/save-file";
import { MinioService } from "@/utils/services/minio.service";
import { ENV } from "@/config/env";
const minioService: MinioService = MinioService.getInstance();

@injectable()
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  async searchAnnouncements(req: Request, res: Response) {
    try {
      const dto: AnnouncementQueryDto = Object.assign(
        new AnnouncementQueryDto(),
        req.query
      );

      const result = await this.announcementService.searchAnnouncements(dto);
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getHighlighted(req: Request, res: Response) {
    try {
      const categorySlug = req.query.categorySlug as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const announcements =
        await this.announcementService.getHighlightedAnnouncements(
          categorySlug,
          limit
        );
      const response = formatResponse(200, announcements);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const announcement = await this.announcementService.getAnnouncementById(
        id
      );
      const response = formatResponse(200, announcement);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getSimilar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const announcements =
        await this.announcementService.getSimilarAnnouncements(id, limit);
      const response = formatResponse(200, announcements);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
  async createAnnouncement(req: AuthenticatedRequest, res: Response) {
    try {
      const dto: CreateAnnouncementDto = Object.assign(
        new CreateAnnouncementDto(),
        req.body
      );
      const files = req.files as Express.Multer.File[];
      const { images, audios, videos } = await saveAnnouncementFiles(files);
      dto.images = images;
      dto.audios = audios;
      dto.videos = videos;
      const userId = req.user.id;
      const announcement = await this.announcementService.createAnnouncement(
        userId,
        dto
      );
      const response = formatResponse(200, announcement);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateAnnouncement(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const dto: UpdateAnnouncementDto = Object.assign(
        new UpdateAnnouncementDto(),
        req.body
      );
      const files = req.files as Express.Multer.File[];
      const { images, audios, videos } = await saveAnnouncementFiles(files);
      dto.images = images;
      dto.audios = audios;
      dto.videos = videos;
      const userId = req.user.id as number;
      const announcement = await this.announcementService.updateAnnouncement(
        id,
        dto,
        userId
      );
      const response = formatResponse(200, announcement);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async deleteAnnouncement(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id as number;
      await this.announcementService.deleteAnnouncement(id, userId);
      const result = { message: "Annonce supprimée avec succès" };
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async publishAnnouncement(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id as number;
      await this.announcementService.publishAnnouncement(id, userId);
      const result = { message: "Annonce publiée avec succès" };
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async archiveAnnouncement(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id as number;
      await this.announcementService.archiveAnnouncement(id, userId);
      const result = { message: "Annonce archivée avec succès" };
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getMyAnnouncements(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id as number;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const sortOrder =
        (req.query.sortOrder as Order.ASC | Order.DESC) || Order.DESC;
      const pagination = {
        page,
        limit,
        sortBy,
        sortOrder,
      };
      const result = await this.announcementService.getUserAnnouncements(
        userId,
        pagination
      );
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getMyAnnouncement(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id as number;
      const id = parseInt(req.params.id);

      const result = await this.announcementService.getUserAnnouncementById(
        id,
        userId
      );
      const fichiers = result.audios.concat(
        result.images.concat(result.videos)
      );
      const pressignedUrl = await Promise.all(
        fichiers.map(async (f) => {
          if (f.startsWith("https")) return f;
          else {
            const url = await minioService.generatePresignedUrl(
              ENV.MINIO_BUCKET_NAME,
              f
            );
            return url;
          }
        })
      );
      const response = formatResponse(200, {
        ...result,
        fichiers: pressignedUrl,
      });
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
