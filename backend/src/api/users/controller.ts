import { AnnoncementController } from "@/microservices/announcements/annoncement.controller";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { Response } from "express";
import { injectable } from "tsyringe";

@injectable()
export class UserController {
  constructor(private readonly annoncementController: AnnoncementController) {}

  async createAnnoncement(req: AuthenticatedRequest, res: Response) {
    return this.annoncementController.create(req, res);
  }

  async myAds(req: AuthenticatedRequest, res: Response) {
    return this.annoncementController.myAds(req, res);
  }

  async myAd(req: AuthenticatedRequest, res: Response) {
    return this.annoncementController.myAd(req, res);
  }

  async updateAd(req: AuthenticatedRequest, res: Response) {
    return this.annoncementController.update(req, res);
  }

  async removeAd(req: AuthenticatedRequest, res: Response) {
    return this.annoncementController.removeAd(req, res);
  }

  async changeAdStatus(req: AuthenticatedRequest, res: Response) {
    return this.annoncementController.changeStatus(req, res);
  }
}
