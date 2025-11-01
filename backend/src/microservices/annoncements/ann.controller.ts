import { injectable } from "tsyringe";
import { AnnouncementService } from "./ann.service";
import { Request, Response } from "express";
import { handleError } from "@/utils/helpers/handle-error";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { CreateAnnouncementDto, UpdateAnnouncementDto } from "./ann.dto";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { toArray } from "@/utils/functions/utilities";
import { Order } from "@/utils/enums/order.enum";
import { saveFilesToBucket } from "@/utils/functions/save-file";
import { paginatedResponse } from "@/utils/helpers/paginated-response";
import { AnnouncementStatus } from "@prisma/client";
import { Role } from "@/utils/enums/role.enum";

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
      const files = req.files as Express.Multer.File[];
      const results = await saveFilesToBucket("announcements", files);
      const images = results.map((result) => {
        return result.objectName;
      });

      const announcement = await this.annService.create(
        user.id,
        annDTO,
        images
      );
      const response = formatResponse(201, announcement);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findAnnouncements(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const {
        page: pageQuery,
        limit: limitQuery,
        order: orderQuery,
      } = req.query;

      const where: any = {};
      if (user.role === Role.USER) where.ownerId = user.id;
      else if (user.role === Role.ADMIN)
        where.status = AnnouncementStatus.PENDING_APPROVAL;

      const page = parseInt(pageQuery as string) || 1;
      const limit = parseInt(limitQuery as string) || 10;

      const page_number = Math.max(page, 1);
      const limit_query = Math.max(limit, 10);
      const order = [Order.ASC, Order.DESC].includes(orderQuery as Order)
        ? (orderQuery as Order)
        : Order.DESC;

      const announcements = await this.annService.findAnnouncements({
        limit: limit_query,
        page: page_number,
        order,
        where,
      });

      const response = paginatedResponse(200, announcements);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const announcement = await this.annService.findAnnouncement(+id);
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

      const files = (req.files as Express.Multer.File[]) ?? [];
      const filenames: { name: string; objectName: string }[] | null =
        files && files.length
          ? await saveFilesToBucket("announcements", files)
          : null;

      const images: string[] = filenames
        ? filenames.map((file) => file.objectName)
        : [];
      const updated = await this.annService.update(
        +id,
        user.id,
        annData,
        images
      );
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
      const { category } = req.params;
      const {
        page: _p,
        limit: _l,
        q,
        order: _o,
        ...rawFilters
      } = req.query as Record<string, any>;

      this.buildTagFilter(rawFilters);
      const page = parseInt(_p as string) || 1;
      const limit = parseInt(_l as string) || 12;
      const order = [Order.ASC, Order.DESC].includes(_o as Order)
        ? (_o as Order)
        : Order.DESC;

      // Normalise les filtres :
      // - garde *_min/_max tels quels
      // - transforme le reste en array si besoin (supporte "k=a&k=b" ET "k=a,b")
      const filters: Record<string, any> = {};
      for (const [k, v] of Object.entries(rawFilters)) {
        if (k.endsWith("_min") || k.endsWith("_max")) {
          filters[k] = v;
        } else {
          const arr = toArray(v);
          filters[k] = arr.length > 1 ? arr.join(" ") : arr[0] ?? v ?? "";
        }
      }

      const results = await this.annService.listByCategory(
        category,
        filters,
        page,
        limit,
        {
          q: typeof q === "string" ? q : undefined,
          order: order,
        }
      );
      const response = paginatedResponse(200, results);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async approuveAnnouncement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await this.annService.approuveAnnouncement(+id);
      const response = formatResponse(200, updated);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
  async rejectAnnouncement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await this.annService.rejectAnnouncement(+id);
      const response = formatResponse(200, updated);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  private buildTagFilter(query: { [x: string]: any }) {
    const iam = query["iAm"] ?? undefined;
    const lookingFor = query["lookingFor"] ?? undefined;
    delete query["iAm"];
    delete query["lookingFor"];
    if (iam && lookingFor) {
      query["tag"] = `${iam} cherche ${lookingFor}`;
    } else {
      query["tag"] = iam ? iam : lookingFor ? lookingFor : undefined;
    }
  }
}
