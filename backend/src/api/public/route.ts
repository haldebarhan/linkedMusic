import { Request, Response, Router } from "express";
import { container } from "tsyringe";
import { AuthController } from "../auth/controller";
import { cache } from "../../middlewares/cache.middleware";

const router: Router = Router();
const authController = container.resolve(AuthController);

// Announcements
router.get(
  "/announcements/details/:id",
  cache({ ttl: 86400, prefix: "announcements" }),
  async (req: Request, res: Response) =>
    authController.getAnnouncementDetails(req, res),
);

router.get(
  "/announcements/search",
  cache({ ttl: 86400, prefix: "announcements" }),
  async (req: Request, res: Response) =>
    authController.searchAnnouncement(req, res),
);

// Subscription plans

router.get(
  "/subscription-plans",
  cache({ ttl: 86400, prefix: "subscription-plans" }),
  async (req: Request, res: Response) =>
    authController.findSubscriptionPlans(req, res),
);

router.get(
  "/subscription-plans/:id",
  cache({ ttl: 86400, prefix: "subscription-plans" }),
  async (req: Request, res: Response) =>
    authController.getSubscriptionPlan(req, res),
);

// Banner slides

router.get(
  "/banner-slides",
  cache({ ttl: 86400, prefix: "banner-slides" }),
  async (req: Request, res: Response) =>
    authController.findActiveSlides(req, res),
);

// Catalog

router.get(
  "/catalog/categories/:category/filters",
  cache({ ttl: 86400, prefix: "catalog" }),
  async (req: Request, res: Response) =>
    authController.getFilterSchema(req, res),
);

router.get(
  "/catalog/categories",
  cache({ ttl: 86400, prefix: "catalog" }),
  async (req: Request, res: Response) =>
    authController.listCategories(req, res),
);

router.get(
  "/catalog/categories/:id",
  cache({ ttl: 86400, prefix: "catalog" }),
  async (req: Request, res: Response) => authController.findCategory(req, res),
);

router.get(
  "/catalog/service-types",
  cache({ ttl: 86400, prefix: "catalog" }),
  async (req: Request, res: Response) =>
    authController.listServiceTypes(req, res),
);

// Categories
router.get(
  "/categories",
  cache({ ttl: 86400, prefix: "categories" }),
  async (req: Request, res: Response) => authController.getCategories(req, res),
);

router.get(
  "/categories/:slug",
  cache({ ttl: 86400, prefix: "categories" }),
  async (req: Request, res: Response) =>
    authController.getCategoryBySlug(req, res),
);

export default router;
