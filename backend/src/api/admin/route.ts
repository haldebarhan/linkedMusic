import adminMiddleware from "@/middlewares/admin.middleware";
import { Request, Response, Router } from "express";
import { container } from "tsyringe";
import { AdminController } from "./controller";
import { ValidateDtoMiddleware } from "@/middlewares/validate-dto.middleware";
import { UpdateUserDTO } from "@/microservices/users/user.dto";
import { cache } from "@/middlewares/cache.middleware";
import { CreateConfigDTO } from "@/microservices/configurations/configuration.dto";
import {
  AttachFieldDTO,
  AttachFieldsDTO,
  AttachServicedDTO,
  AttachServicesDTO,
  CreateCategoryDTO,
  CreateFieldDto,
  CreateFieldOptionDto,
  CreateServiceTypeDTO,
  UpdateCategoryDTO,
} from "@/microservices/catalogues/catalogue.dto";
import {
  CreatePlanDTO,
  UpdatePlanDTO,
} from "@/microservices/subscriptions/dto/plan.dto";

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
  "/catalog/detach-services",
  ValidateDtoMiddleware(AttachServicedDTO),
  async (req: Request, res: Response) => adminController.detachService(req, res)
);

router.post(
  "/catalog/attach-fields",
  ValidateDtoMiddleware(AttachFieldsDTO),
  async (req: Request, res: Response) => adminController.attachField(req, res)
);

router.post(
  "/catalog/detach-fields",
  ValidateDtoMiddleware(AttachFieldDTO),
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

export default router;
