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

const router: Router = Router();
const authController = container.resolve(AuthController);

router.post(
  "/activate",
  ValidateDtoMiddleware(VerifyToken),
  async (req: Request, res: Response) =>
    authController.activateAccount(req, res)
);
router.post(
  "/login",
  ValidateDtoMiddleware(LoginDTO),
  async (req: Request, res: Response) => authController.signIn(req, res)
);

router.post("/logout", async (req: AuthenticatedRequest, res: Response) =>
  authController.logout(req, res)
);

router.put(
  "/me/change-password",
  ValidateDtoMiddleware(ChangePasswordDTO),
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) =>
    authController.changePassword(req, res)
);

router.put(
  "/me/close-account",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) =>
    authController.closeAccount(req, res)
);

router.put(
  "/me/update-profile",
  uploads.single("profileImage"),
  ValidateDtoMiddleware(UpdateUserDTO),
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) =>
    authController.updateProfile(req, res)
);

router.post(
  "/forgot-password",
  ValidateDtoMiddleware(ForgotPasswordDTO),
  async (req: Request, res: Response) => authController.forgotPassword(req, res)
);

router.post(
  "/reset-password",
  ValidateDtoMiddleware(ResetPasswordDTO),
  async (req: Request, res: Response) => authController.resetPassword(req, res)
);

router.post(
  "/refresh-token",
  refreshTokenMiddleware,
  async (req: AuthenticatedRequest, res: Response) =>
    authController.refreshToken(req, res)
);

router.post(
  "/register",
  uploads.single("profileImage"),
  ValidateDtoMiddleware(CreateUserDTO),
  async (req: Request, res: Response) => authController.signUp(req, res)
);
router.get(
  "/me",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) =>
    authController.getMe(req, res)
);

export default router;
