import { Response, Router } from "express";
import { container } from "tsyringe";
import { UserController } from "./controller";
import { ValidateDtoMiddleware } from "@/middlewares/validate-dto.middleware";

import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import UserAndProviderMiddleware from "@/middlewares/user-provider.middleware";
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from "@/microservices/annoncements/ann.dto";
import uploads from "@/multer-config";

const router: Router = Router();
const userController = container.resolve(UserController);

router.use(UserAndProviderMiddleware);

// Announcements

router.get("/announcements", async (req: AuthenticatedRequest, res: Response) =>
  userController.findAnnouncements(req, res)
);

router.get(
  "/announcements/:id",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.findAnnouncement(req, res)
);

router.post(
  "/announcements",
  uploads.array("fichiers", 5),
  ValidateDtoMiddleware(CreateAnnouncementDto),
  async (req: AuthenticatedRequest, res: Response) =>
    userController.createAnnouncement(req, res)
);

router.put(
  "/announcements/:id",
  uploads.array("fichiers", 5),
  ValidateDtoMiddleware(UpdateAnnouncementDto),
  async (req: AuthenticatedRequest, res: Response) =>
    userController.updateAnnouncement(req, res)
);

router.delete(
  "/announcements/:id",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.removeAnnouncement(req, res)
);

export default router;
