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
import { firebaseMiddleware } from "@/middlewares/firebase.middleware";
import { cache } from "@/middlewares/cache.middleware";

const router: Router = Router();
const authController = container.resolve(AuthController);

// Announcements
router.get(
  "/announcements/details/:id",
  cache,
  async (req: Request, res: Response) =>
    authController.getAnnouncementDetails(req, res)
);

router.get(
  "/announcements/search",
  cache,
  async (req: Request, res: Response) =>
    authController.searchAnnouncement(req, res)
);

// Subscription plans

router.get("/subscription-plans", async (req: Request, res: Response) =>
  authController.findSubscriptionPlans(req, res)
);

router.get("/subscription-plans/:id", async (req: Request, res: Response) =>
  authController.getSubscriptionPlan(req, res)
);

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
  "/auth/refresh",
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

router.post(
  "/auth/register/social",
  firebaseMiddleware,
  async (req: AuthenticatedRequest, res: Response) =>
    authController.registerWithGoogle(req, res)
);

router.post(
  "/auth/social/verify",
  firebaseMiddleware,
  async (req: AuthenticatedRequest, res: Response) =>
    authController.socialLogin(req, res)
);

router.get(
  "/auth/me",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) =>
    authController.getMe(req, res)
);

router.get(
  "/catalog/categories/:category/filters",
  async (req: Request, res: Response) =>
    authController.getFilterSchema(req, res)
);

router.get("/catalog/categories", async (req: Request, res: Response) =>
  authController.listCategories(req, res)
);

router.get("/catalog/categories/:id", async (req: Request, res: Response) =>
  authController.findCategory(req, res)
);

router.get("/catalog/service-types", async (req: Request, res: Response) =>
  authController.listServiceTypes(req, res)
);

// Categories
router.get("/categories", cache, async (req: Request, res: Response) =>
  authController.getCategories(req, res)
);

router.get("/categories/:slug", cache, async (req: Request, res: Response) =>
  authController.getCategoryBySlug(req, res)
);

export default router;
