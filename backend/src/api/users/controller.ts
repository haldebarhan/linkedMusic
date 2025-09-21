import { AnnouncementController } from "@/microservices/annoncements/ann.controller";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { Response, Request } from "express";
import { injectable } from "tsyringe";

@injectable()
export class UserController {
  constructor(
    private readonly announcementController: AnnouncementController
  ) {}

  // Announcements

  async createAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.createAnnouncement(req, res);
  }
  async updateAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.update(req, res);
  }

  async findAnnouncements(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.findAnnouncements(req, res);
  }

  async removeAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.remove(req, res);
  }

  async findAnnouncement(req: AuthenticatedRequest, res: Response) {
    return await this.announcementController.findOne(req, res);
  }
}
