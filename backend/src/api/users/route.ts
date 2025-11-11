import { Response, Router } from "express";
import { container } from "tsyringe";
import { UserController } from "./controller";
import { ValidateDtoMiddleware } from "@/middlewares/validate-dto.middleware";

import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import UserAndProviderMiddleware from "@/middlewares/user-provider.middleware";

import uploads from "@/multer-config";
import {
  CreateMessageDTO,
  ReplyMessageDTO,
} from "@/microservices/messages/message.dto";
import { SubscribeDTO } from "@/microservices/subscriptions/dto/plan.dto";
import { PaymentDTO } from "@/microservices/payments/payment.dto";
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from "@/microservices/annoncements/announcement.dto";

const router: Router = Router();
const userController = container.resolve(UserController);

router.use(UserAndProviderMiddleware);

// Announcements

// router.get("/announcements", async (req: AuthenticatedRequest, res: Response) =>
//   userController.findAnnouncements(req, res)
// );

// router.get(
//   "/announcements/:id",
//   async (req: AuthenticatedRequest, res: Response) =>
//     userController.findAnnouncement(req, res)
// );

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

router.post(
  "/announcements/:id/publish",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.publishAnnouncement(req, res)
);
router.post(
  "/announcements/:id/archive",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.archiveAnnouncement(req, res)
);

router.get("/announcements", async (req: AuthenticatedRequest, res: Response) =>
  userController.myAnnouncements(req, res)
);

router.get(
  "/announcements/:id",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.myAnnouncement(req, res)
);

router.get("/dashboard", async (req: AuthenticatedRequest, res: Response) =>
  userController.getDashboard(req, res)
);
router.get(
  "/matching/eligibility",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.eligibility(req, res)
);

router.get("/messages", async (req: AuthenticatedRequest, res: Response) =>
  userController.getMessages(req, res)
);

router.put(
  "/messages/conversation/read/:id",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.markConversationAsRead(req, res)
);
router.post(
  "/messages/conversation/reply/:id",
  ValidateDtoMiddleware(ReplyMessageDTO),
  async (req: AuthenticatedRequest, res: Response) =>
    userController.replyToConversation(req, res)
);

router.get(
  "/messages/conversation/:id",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.getConversationMessages(req, res)
);

router.post(
  "/messages",
  ValidateDtoMiddleware(CreateMessageDTO),
  async (req: AuthenticatedRequest, res: Response) =>
    userController.createMessage(req, res)
);

router.post(
  "/payments",
  ValidateDtoMiddleware(PaymentDTO),
  async (req: AuthenticatedRequest, res: Response) =>
    userController.makePayment(req, res)
);
router.get(
  "/payments/:reference",
  async (req: AuthenticatedRequest, res: Response) =>
    userController.checkReference(req, res)
);

router.post(
  "/subscription-plans/subscribe",
  ValidateDtoMiddleware(SubscribeDTO),
  async (req: AuthenticatedRequest, res: Response) =>
    userController.subscribe(req, res)
);

export default router;
