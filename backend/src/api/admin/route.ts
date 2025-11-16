import adminMiddleware from "@/middlewares/admin.middleware";
import { Request, Response, Router } from "express";
import { container } from "tsyringe";
import { AdminController } from "./controller";
import { ValidateDtoMiddleware } from "@/middlewares/validate-dto.middleware";
import { UpdateUserDTO } from "@/microservices/users/user.dto";
import { cache } from "@/middlewares/cache.middleware";
import { CreateConfigDTO } from "@/microservices/configurations/configuration.dto";
import {
  AttachServicesDTO,
  CreateCategoryDTO,
  CreateFieldDto,
  CreateFieldOptionDto,
  CreateServiceTypeDTO,
  UpdateCategoryDTO,
  UpdateFieldDto,
} from "@/microservices/catalogues/catalogue.dto";
import {
  CreatePlanDTO,
  UpdatePlanDTO,
} from "@/microservices/subscriptions/dto/plan.dto";
import {
  CreateCategoryFieldDto,
  LinkFieldsToCategoryDTO,
} from "@/microservices/categories/category.dto";
import uploads from "@/multer-config";

const router: Router = Router();
const adminController = container.resolve(AdminController);

router.use(adminMiddleware);

// Users
router.get("/users", cache, async (req: Request, res: Response) =>
  adminController.getAllUsers(req, res)
);

router.get("/users/:id", async (req: Request, res: Response) =>
  adminController.findUserById(req, res)
);

router.put("/users/:id/close-account", async (req: Request, res: Response) =>
  adminController.closeUserAccount(req, res)
);

router.put(
  "/users/:id/update-profile",
  ValidateDtoMiddleware(UpdateUserDTO),
  async (req: Request, res: Response) => adminController.updateUser(req, res)
);

router.post(
  "/configurations",
  ValidateDtoMiddleware(CreateConfigDTO),
  async (req: Request, res: Response) => adminController.createConfig(req, res)
);
router.get("/configurations", async (req: Request, res: Response) =>
  adminController.findConfigs(req, res)
);
router.get("/configurations/:id", async (req: Request, res: Response) =>
  adminController.findConfig(req, res)
);

router.delete("/configurations/:id", async (req: Request, res: Response) =>
  adminController.removeConfig(req, res)
);

// Catalogues

router.post(
  "/catalog/categories",
  ValidateDtoMiddleware(CreateCategoryDTO),
  async (req: Request, res: Response) =>
    adminController.createCategory(req, res)
);

router.put(
  "/catalog/categories/:id",
  ValidateDtoMiddleware(UpdateCategoryDTO),
  async (req: Request, res: Response) =>
    adminController.updateCategory(req, res)
);

router.delete("/catalog/categories/:id", async (req: Request, res: Response) =>
  adminController.removeCategory(req, res)
);

router.post(
  "/catalog/service-types",
  ValidateDtoMiddleware(CreateServiceTypeDTO),
  async (req: Request, res: Response) =>
    adminController.createServiceType(req, res)
);

router.get("/catalog/service-types/:id", async (req: Request, res: Response) =>
  adminController.findServiceType(req, res)
);

router.delete(
  "/catalog/service-types/:id",
  async (req: Request, res: Response) =>
    adminController.removeServiceType(req, res)
);

router.post(
  "/catalog/fields",
  ValidateDtoMiddleware(CreateFieldDto),
  async (req: Request, res: Response) => adminController.createField(req, res)
);

router.get("/catalog/fields", async (req: Request, res: Response) =>
  adminController.listFields(req, res)
);

router.get("/catalog/fields/:id", async (req: Request, res: Response) =>
  adminController.findField(req, res)
);
router.put(
  "/catalog/fields/:id",
  ValidateDtoMiddleware(UpdateFieldDto),
  async (req: Request, res: Response) => adminController.updateField(req, res)
);

router.delete("/catalog/fields/:id", async (req: Request, res: Response) =>
  adminController.removeField(req, res)
);

router.post(
  "/catalog/field-options",
  ValidateDtoMiddleware(CreateFieldOptionDto),
  async (req: Request, res: Response) =>
    adminController.createFieldOption(req, res)
);

router.post(
  "/catalog/attach-services",
  ValidateDtoMiddleware(AttachServicesDTO),
  async (req: Request, res: Response) => adminController.attachService(req, res)
);

router.post(
  "/catalog/attach-fields",
  ValidateDtoMiddleware(LinkFieldsToCategoryDTO),
  async (req: Request, res: Response) => adminController.attachField(req, res)
);

router.post(
  "/catalog/detach-fields",
  ValidateDtoMiddleware(CreateCategoryFieldDto),
  async (req: Request, res: Response) => adminController.detachField(req, res)
);

// SUBSCRIPTION PLAN
router.get("/subscription-plans", async (req: Request, res: Response) =>
  adminController.listSubscriptionPlans(req, res)
);

router.post(
  "/subscription-plans",
  ValidateDtoMiddleware(CreatePlanDTO),
  async (req: Request, res: Response) => adminController.createPlan(req, res)
);

router.get("/subscription-plans/:id", async (req: Request, res: Response) =>
  adminController.findSubscriptionPlan(req, res)
);

router.put(
  "/subscription-plans/:id",
  ValidateDtoMiddleware(UpdatePlanDTO),
  async (req: Request, res: Response) => adminController.updatePlan(req, res)
);

router.delete("/subscription-plans/:id", async (req: Request, res: Response) =>
  adminController.removePlan(req, res)
);

// Announcements

router.get("/announcements", async (req: Request, res: Response) =>
  adminController.listPendingAnnouncement(req, res)
);

router.put("/announcements/approuve/:id", async (req: Request, res: Response) =>
  adminController.approuveAnnouncement(req, res)
);
router.put("/announcements/reject/:id", async (req: Request, res: Response) =>
  adminController.rejectAnnouncement(req, res)
);

// Banner Slides

router.post(
  "/banner-slides",
  uploads.single("file"),
  async (req: Request, res: Response) => adminController.createSlides(req, res)
);

router.get("/banner-slides", async (req: Request, res: Response) =>
  adminController.findSlides(req, res)
);

router.put("/banner-slides/reorder/:id", async (req: Request, res: Response) =>
  adminController.reOrderSlide(req, res)
);

router.put("/banner-slides/status/:id", async (req: Request, res: Response) =>
  adminController.toggleSlideStatus(req, res)
);

router.delete("/banner-slides/:id", async (req: Request, res: Response) =>
  adminController.removeSlide(req, res)
);

export default router;
