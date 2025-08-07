import adminMiddleware from "@/middlewares/admin.middleware";
import { Request, Response, Router } from "express";
import { container } from "tsyringe";
import { AdminController } from "./controller";
import { ValidateDtoMiddleware } from "@/middlewares/validate-dto.middleware";
import { UpdateUserDTO } from "@/microservices/users/user.dto";
import { cache } from "@/middlewares/cache.middleware";
import {
  CreateCategoryDTO,
  CreateRoleGroupDTO,
  UpdateCategoryDTO,
} from "@/microservices/categories/category.dto";
import {
  CreateServiceDTO,
  UpdateServiceDTO,
} from "@/microservices/service-types/service.dto";
import {
  CreateStyleDTO,
  UpdateStyleDTO,
} from "@/microservices/music-styles/style.dto";
import {
  CreateTopicCategoryDTO,
  UpdateTopicCategoryDTO,
} from "@/microservices/topic-categories/topic-category.dto";

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

// Categories
router.post(
  "/categories",
  ValidateDtoMiddleware(CreateCategoryDTO),
  async (req: Request, res: Response) =>
    adminController.createCategory(req, res)
);

router.get("/categories", async (req: Request, res: Response) =>
  adminController.findCategories(req, res)
);

router.get("/categories/:id", async (req: Request, res: Response) =>
  adminController.findCategory(req, res)
);

router.put(
  "/categories/:id",
  ValidateDtoMiddleware(UpdateCategoryDTO),
  async (req: Request, res: Response) =>
    adminController.updateCategory(req, res)
);

router.delete("/categories/:id", async (req: Request, res: Response) =>
  adminController.removeCategory(req, res)
);

// Role Group

router.post(
  "/role-groups",
  ValidateDtoMiddleware(CreateRoleGroupDTO),
  async (req: Request, res: Response) =>
    adminController.createRoleGroup(req, res)
);

router.get("/role-groups", async (req: Request, res: Response) =>
  adminController.findRoleGroups(req, res)
);

router.get("/role-groups/:id", async (req: Request, res: Response) =>
  adminController.findRoleGroup(req, res)
);

router.put(
  "/role-groups/:id",
  ValidateDtoMiddleware(CreateRoleGroupDTO),
  async (req: Request, res: Response) =>
    adminController.updateRoleGroup(req, res)
);

router.delete("/role-groups/:id", async (req: Request, res: Response) =>
  adminController.removeRoleGroup(req, res)
);

// Services type

router.post(
  "/service-types",
  ValidateDtoMiddleware(CreateServiceDTO),
  async (req: Request, res: Response) =>
    adminController.createServiceType(req, res)
);

router.get("/service-types", async (req: Request, res: Response) =>
  adminController.findServiceTypes(req, res)
);

router.get("/service-types/:id", async (req: Request, res: Response) =>
  adminController.findServiceType(req, res)
);

router.put(
  "/service-types/:id",
  ValidateDtoMiddleware(UpdateServiceDTO),
  async (req: Request, res: Response) =>
    adminController.updateServiceType(req, res)
);

// Announcements

router.get("/annoncements", async (req: Request, res: Response) =>
  adminController.findPendingAds(req, res)
);

router.get("/annoncements/:id", async (req: Request, res: Response) =>
  adminController.findAd(req, res)
);

router.put("/annoncements/:id", async (req: Request, res: Response) =>
  adminController.validateAd(req, res)
);

// Music styles

router.post(
  "/styles",
  ValidateDtoMiddleware(CreateStyleDTO),
  async (req: Request, res: Response) => adminController.createStyle(req, res)
);

router.get("/styles", async (req: Request, res: Response) =>
  adminController.findStyles(req, res)
);

router.get("/styles/:id", async (req: Request, res: Response) =>
  adminController.findStyle(req, res)
);

router.put(
  "/styles/:id",
  ValidateDtoMiddleware(UpdateStyleDTO),
  async (req: Request, res: Response) => adminController.updateStyle(req, res)
);

router.delete("/styles/:id", async (req: Request, res: Response) =>
  adminController.removeStyle(req, res)
);

router.post(
  "/topic-category",
  ValidateDtoMiddleware(CreateTopicCategoryDTO),
  async (req: Request, res: Response) =>
    adminController.createTopicCategory(req, res)
);

router.put(
  "/topic-category/:id",
  ValidateDtoMiddleware(UpdateTopicCategoryDTO),
  async (req: Request, res: Response) =>
    adminController.updateTopicCategory(req, res)
);

router.delete("/topic-category/:id", async (req: Request, res: Response) =>
  adminController.removeTopicCategory(req, res)
);

export default router;
