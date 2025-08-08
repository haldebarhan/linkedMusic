import { Response, Router } from "express";
import { container } from "tsyringe";
import { UserController } from "./controller";
import { ValidateDtoMiddleware } from "@/middlewares/validate-dto.middleware";
import {
  ChangeStatusDTO,
  CreateAnnoncementDTO,
} from "@/microservices/announcements/announcement.dto";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import UserAndProviderMiddleware from "@/middlewares/user-provider.middleware";
import uploads from "@/multer-config";
import { ParseJsonMiddleware } from "@/middlewares/parse-json.middleware";
import {
  CreateTopicDTO,
  UpdateTopicDTO,
} from "@/microservices/topics/topic.dto";
import {
  CreateCommentDTO,
  CreateCommentLikeDTO,
  UpdateCommentDTO,
} from "@/microservices/comments/comment.dto";

const router: Router = Router();
const userController = container.resolve(UserController);

router.use(UserAndProviderMiddleware);
router.post(
  "/annoncements",
  uploads.array("images", 5),
  ParseJsonMiddleware(["data"]),
  ValidateDtoMiddleware(CreateAnnoncementDTO),
  async (req: AuthenticatedRequest, res: Response) =>
    userController.createAnnoncement(req, res)
);

router.get(
  "/annoncements/my-ads",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.myAds(req, res)
);

router.get(
  "/annoncements/my-ads/:id",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.myAd(req, res)
);

router.put(
  "/annoncements/my-ads/:id",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.updateAd(req, res)
);

router.delete(
  "/annoncements/my-ads/:id",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.removeAd(req, res)
);

router.put(
  "/annoncements/my-ads/:id/status",
  ValidateDtoMiddleware(ChangeStatusDTO),
  async (req: AuthenticatedRequest, res: Response) =>
    userController.changeAdStatus(req, res)
);

// forum topic

router.post(
  "/forum/comments",
  ValidateDtoMiddleware(CreateCommentDTO),
  async (req: AuthenticatedRequest, res: Response) =>
    userController.makeComment(req, res)
);

router.put(
  "/forum/comments/:id",
  ValidateDtoMiddleware(UpdateCommentDTO),
  async (req: AuthenticatedRequest, res: Response) =>
    userController.updateComment(req, res)
);

router.delete(
  "/forum/comments/:id",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.removeComment(req, res)
);

router.post(
  "/forum/comment-likes",
  ValidateDtoMiddleware(CreateCommentLikeDTO),
  async (req: AuthenticatedRequest, res: Response) =>
    userController.likeComment(req, res)
);

router.delete(
  "/forum/comment-likes/:id",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.unlikeComment(req, res)
);

router.get(
  "/forum/favorites",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.findFavoriteTopics(req, res)
);

router.get("/forum/wathed", async (req: AuthenticatedRequest, res: Response) =>
  userController.findFavoriteTopics(req, res)
);

router.post(
  "/forum/reply-likes",
  ValidateDtoMiddleware(CreateCommentLikeDTO),
  async (req: AuthenticatedRequest, res: Response) =>
    userController.likeReply(req, res)
);

router.delete(
  "/forum/reply-likes/:id",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.unlikeReply(req, res)
);

router.post(
  "/forum/topics",
  ValidateDtoMiddleware(CreateTopicDTO),
  async (req: AuthenticatedRequest, res: Response) =>
    userController.createTopic(req, res)
);

router.put(
  "/forum/topics/:id",
  ValidateDtoMiddleware(UpdateTopicDTO),
  async (req: AuthenticatedRequest, res: Response) =>
    userController.updateTopic(req, res)
);

router.delete(
  "/forum/topics/:id",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.removeTopic(req, res)
);

router.post(
  "/forum/topics/:id/favorite",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.toggleFavorite(req, res)
);

router.post(
  "/forum/topics/:id/watch",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.toggleWatch(req, res)
);

export default router;
