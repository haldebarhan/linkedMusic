import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { AuthenticatedRequest } from "../../utils/interfaces/authenticated-request";
import { UserController } from "@/microservices/users/user.controller";
import { ProfileController } from "@/microservices/profiles/profile.controller";
import { AnnoncementController } from "@/microservices/announcements/annoncement.controller";
import { TopicController } from "@/microservices/topics/topic.controller";
import { TopicCategoryController } from "@/microservices/topic-categories/topic-category.controller";

@injectable()
export class AuthController {
  constructor(
    private readonly userController: UserController,
    private readonly profileController: ProfileController,
    private readonly adController: AnnoncementController,
    private readonly topicController: TopicController,
    private readonly topicCategoryController: TopicCategoryController
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

  async approvalRequest(req: AuthenticatedRequest, res: Response) {
    return await this.profileController.approvalRequest(req, res);
  }

  async searchAd(req: Request, res: Response) {
    return this.adController.search(req, res);
  }

  // Forum Topics

  async getTopics(req: Request, res: Response) {
    return await this.topicController.findAll(req, res);
  }

  async findTopic(req: Request, res: Response) {
    return await this.topicController.findOne(req, res);
  }

  async findTopicCategories(req: Request, res: Response) {
    return await this.topicCategoryController.findAll(req, res);
  }
}
