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

export default router;
