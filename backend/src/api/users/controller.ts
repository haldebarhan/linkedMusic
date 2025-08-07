import { AnnoncementController } from "@/microservices/announcements/annoncement.controller";
import { CommentController } from "@/microservices/comments/comment.controller";
import { TopicController } from "@/microservices/topics/topic.controller";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { Response } from "express";
import { injectable } from "tsyringe";

@injectable()
export class UserController {
  constructor(
    private readonly annoncementController: AnnoncementController,
    private readonly commentController: CommentController,
    private readonly topicController: TopicController
  ) {}

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

  // Forum Topic

  async createTopic(req: AuthenticatedRequest, res: Response) {
    return await this.topicController.create(req, res);
  }

  async updateTopic(req: AuthenticatedRequest, res: Response) {
    return await this.topicController.update(req, res);
  }

  async removeTopic(req: AuthenticatedRequest, res: Response) {
    return await this.topicController.remove(req, res);
  }

  async toggleFavorite(req: AuthenticatedRequest, res: Response) {
    return await this.topicController.toggleFavorite(req, res);
  }

  async toggleWatch(req: AuthenticatedRequest, res: Response) {
    return await this.topicController.toggleWatch(req, res);
  }

  async findFavoriteTopics(req: AuthenticatedRequest, res: Response) {
    return await this.topicController.findFavoriteTopic(req, res);
  }

  async findWatchedTopics(req: AuthenticatedRequest, res: Response) {
    return await this.topicController.findWatchTopic(req, res);
  }

  async likeComment(req: AuthenticatedRequest, res: Response) {
    return await this.commentController.likeComment(req, res);
  }
  async unlikeComment(req: AuthenticatedRequest, res: Response) {
    return await this.commentController.unlikeComment(req, res);
  }

  async likeReply(req: AuthenticatedRequest, res: Response) {
    return await this.commentController.likeReply(req, res);
  }
  async unlikeReply(req: AuthenticatedRequest, res: Response) {
    return await this.commentController.unlikeReply(req, res);
  }

  // Comments
  async makeComment(req: AuthenticatedRequest, res: Response) {
    return await this.commentController.create(req, res);
  }

  async updateComment(req: AuthenticatedRequest, res: Response) {
    return await this.commentController.update(req, res);
  }

  async removeComment(req: AuthenticatedRequest, res: Response) {
    return await this.commentController.removeComment(req, res);
  }
}
