import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { AuthenticatedRequest } from "../../utils/interfaces/authenticated-request";
import { UserController } from "@/microservices/users/user.controller";
import { CatalogueController } from "@/microservices/catalogues/catalogue.controller";
import { AnnouncementController } from "@/microservices/annoncements/ann.controller";
import { SubscriptionController } from "@/microservices/subscriptions/subscription.controller";

@injectable()
export class AuthController {
  constructor(
    private readonly userController: UserController,
    private readonly catalogController: CatalogueController,
    private readonly announcementController: AnnouncementController,
    private readonly subscriptionController: SubscriptionController
  ) {}

  async getMe(req: AuthenticatedRequest, res: Response) {
    return this.userController.getMe(req, res);
  }

  async signUp(req: Request, res: Response) {
    return await this.userController.create(req, res);
  }

  async signIn(req: Request, res: Response) {
    return await this.userController.login(req, res);
  }

  async activateAccount(req: Request, res: Response) {
    return await this.userController.activateAccount(req, res);
  }

  async refreshToken(req: Request, res: Response) {
    return await this.userController.refreshToken(req, res);
  }

  async forgotPassword(req: Request, res: Response) {
    return await this.userController.forgotPassword(req, res);
  }

  async resetPassword(req: Request, res: Response) {
    return await this.userController.resetPassword(req, res);
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    return await this.userController.changePassword(req, res);
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    return await this.userController.logout(req, res);
  }

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    return await this.userController.udpate(req, res);
  }

  async closeAccount(req: AuthenticatedRequest, res: Response) {
    return await this.userController.closeAccount(req, res);
  }

  async socialLogin(req: AuthenticatedRequest, res: Response) {
    return await this.userController.socialVerify(req, res);
  }

  async registerWithGoogle(req: AuthenticatedRequest, res: Response) {
    return await this.userController.registerWithGoogle(req, res);
  }

  // Catalogs
  async getFilterSchema(req: Request, res: Response) {
    return await this.catalogController.getFilterSchema(req, res);
  }

  async listCategories(req: Request, res: Response) {
    return await this.catalogController.listCategories(req, res);
  }

  async findCategory(req: Request, res: Response) {
    return await this.catalogController.findCategory(req, res);
  }

  async listServiceTypes(req: Request, res: Response) {
    return await this.catalogController.listServiceTypes(req, res);
  }

  async listByCategory(req: Request, res: Response) {
    return await this.announcementController.listByCategory(req, res);
  }

  async findAnnouncement(req: Request, res: Response) {
    return await this.announcementController.findOne(req, res);
  }

  // SUBSCRIPTION PLANS
  async findSubscriptionPlans(req: Request, res: Response) {
    return await this.subscriptionController.findSubscriptionPlans(req, res);
  }
  async getSubscriptionPlan(req: Request, res: Response) {
    return await this.subscriptionController.findSubscriptionPlan(req, res);
  }
}
