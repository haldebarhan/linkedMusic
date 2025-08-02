import { Request, Response, Router } from "express";
import { container } from "tsyringe";
import { ValidateDtoMiddleware } from "../../middlewares/validate-dto.middleware";

import { AuthController } from "./controller";
import { AuthenticatedRequest } from "../../utils/interfaces/authenticated-request";
import {
  ChangePasswordDTO,
  CreateUserDTO,
  ForgotPasswordDTO,
  LoginDTO,
  ResetPasswordDTO,
  UpdateUserDTO,
  VerifyToken,
} from "@/microservices/users/user.dto";
import authMiddleware from "@/middlewares/auth.middleware";
import refreshTokenMiddleware from "@/middlewares/refresh-token";
import uploads from "@/multer-config";
import UserAndProviderMiddleware from "@/middlewares/user-provider.middleware";

const router: Router = Router();
const authController = container.resolve(AuthController);

router.post(
  "/auth/activate",
  ValidateDtoMiddleware(VerifyToken),
  async (req: Request, res: Response) =>
    authController.activateAccount(req, res)
);
router.post(
  "/auth/login",
  ValidateDtoMiddleware(LoginDTO),
  async (req: Request, res: Response) => authController.signIn(req, res)
);

router.post("/auth/logout", async (req: AuthenticatedRequest, res: Response) =>
  authController.logout(req, res)
);

router.post(
  "/auth/me/approval-request",
  UserAndProviderMiddleware,
  uploads.array("files", 5),
  async (req: AuthenticatedRequest, res: Response) =>
    authController.approvalRequest(req, res)
);

router.put(
  "/auth/me/change-password",
  ValidateDtoMiddleware(ChangePasswordDTO),
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) =>
    authController.changePassword(req, res)
);

router.put(
  "/auth/me/close-account",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) =>
    authController.closeAccount(req, res)
);

router.put(
  "/auth/me/update-profile",
  uploads.single("profileImage"),
  ValidateDtoMiddleware(UpdateUserDTO),
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) =>
    authController.updateProfile(req, res)
);

router.post(
  "/auth/forgot-password",
  ValidateDtoMiddleware(ForgotPasswordDTO),
  async (req: Request, res: Response) => authController.forgotPassword(req, res)
);

router.post(
  "/auth/reset-password",
  ValidateDtoMiddleware(ResetPasswordDTO),
  async (req: Request, res: Response) => authController.resetPassword(req, res)
);

router.post(
  "/auth/refresh-token",
  refreshTokenMiddleware,
  async (req: AuthenticatedRequest, res: Response) =>
    authController.refreshToken(req, res)
);

router.post(
  "/auth/register",
  uploads.single("profileImage"),
  ValidateDtoMiddleware(CreateUserDTO),
  async (req: Request, res: Response) => authController.signUp(req, res)
);
router.get(
  "/auth/me",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) =>
    authController.getMe(req, res)
);

router.get("/announcements", async (req: Request, res: Response) =>
  authController.searchAd(req, res)
);

export default router;
