import { injectable } from "tsyringe";
import { AnnouncementService } from "./announcement.service";
import { handleError } from "../../utils/helpers/handle-error";
import { Request, Response } from "express";
import {
  AnnouncementQueryDto,
  CreateAnnouncementDto,
  likeAnnouncementDTO,
  UpdateAnnouncementDto,
} from "./announcement.dto";
import { formatResponse } from "../../utils/helpers/response-formatter";
import { AuthenticatedRequest } from "../../utils/interfaces/authenticated-request";
import { Order } from "../../utils/enums/order.enum";
import { saveAnnouncementFiles } from "../../utils/functions/save-file";
import { ENV } from "../../config/env";
import { AnnouncementStatus } from "@prisma/client";
import { paginatedResponse } from "../../utils/helpers/paginated-response";
import { S3Service } from "../../utils/services/s3.service";
const minioService: S3Service = S3Service.getInstance();

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
      const ownerImage = announcement.owner.profileImage;
      announcement.owner.profileImage = ownerImage
        ? await minioService.generatePresignedUrl(
            ENV.AWS_S3_DEFAULT_BUCKET,
            ownerImage
          )
        : undefined;
      const fichiers = announcement.audios.concat(
        announcement.images,
        announcement.videos
      );
      const ownerTotalAnnouncements =
        await this.announcementService.countUserTotalAnnoucements(
          announcement.owner.id
        );
      const pressignedUrl = await Promise.all(
        fichiers.map(async (f) => {
          if (f.startsWith("https")) return f;
          else {
            const url = await minioService.generatePresignedUrl(
              ENV.AWS_S3_DEFAULT_BUCKET,
              f
            );
            return url;
          }
        })
      );
      announcement.owner.totalAnnouncement = ownerTotalAnnouncements;
      const response = formatResponse(200, {
        ...announcement,
        fichiers: pressignedUrl,
      });
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async likeStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id as number;
      const result = await this.announcementService.likeStatus(userId, id);
      const response = formatResponse(200, result);
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
              ENV.AWS_S3_DEFAULT_BUCKET,
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

  async userRecentViews(req: AuthenticatedRequest, res: Response) {
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
      const recentViews = await this.announcementService.recentViews(
        userId,
        pagination
      );
      const response = formatResponse(200, recentViews);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async addToRecentViews(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id as number;
      const dto: likeAnnouncementDTO = Object.assign(
        new likeAnnouncementDTO(),
        req.body
      );
      const result = await this.announcementService.addToRecentViews(
        userId,
        dto.announcementId
      );
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeToRecentViews(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await this.announcementService.removeRecentView(id);
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
  async removeALLRecentViews(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id as number;
      const result = await this.announcementService.removeAll(userId);
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async likeAnnouncement(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id as number;
      const dto: likeAnnouncementDTO = Object.assign(
        new likeAnnouncementDTO(),
        req.body
      );
      const result = await this.announcementService.likeAnnouncement(
        userId,
        dto.announcementId
      );
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async unlikeAnnouncement(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id as number;
      const dto: likeAnnouncementDTO = Object.assign(
        new likeAnnouncementDTO(),
        req.body
      );
      const result = await this.announcementService.unlikeAnnouncement(
        userId,
        dto.announcementId
      );
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async mylikedAnnouncements(req: AuthenticatedRequest, res: Response) {
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
      const result = await this.announcementService.myLikedAnnouncement(
        userId,
        pagination
      );
      const response = paginatedResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async listPendingAnnouncements(req: Request, res: Response) {
    const { page: pageQuery, limit: limitQuery, order: orderQuery } = req.query;

    const page = parseInt(pageQuery as string) || 1;
    const limit = parseInt(limitQuery as string) || 10;

    const page_number = Math.max(page, 1);
    const limit_query = Math.max(limit, 10);
    const order = [Order.ASC, Order.DESC].includes(orderQuery as Order)
      ? (orderQuery as Order)
      : Order.DESC;

    const where: any = {
      status: AnnouncementStatus.PENDING_APPROVAL,
    };

    try {
      const announcements =
        await this.announcementService.listPendingAnnouncements({
          limit: limit_query,
          page: page_number,
          order,
          where,
        });
      const response = paginatedResponse(200, announcements);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async approveAnnouncement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const status = await this.announcementService.approveAnnouncement(+id);
      const response = formatResponse(200, status);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async rejectAnnouncement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const reason = req.body;
      const status = await this.announcementService.rejectAnnouncement(
        +id,
        reason.reason
      );
      const response = formatResponse(200, status);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
