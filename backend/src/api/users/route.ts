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

export default router;
