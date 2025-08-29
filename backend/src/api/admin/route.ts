import adminMiddleware from "@/middlewares/admin.middleware";
import { Request, Response, Router } from "express";
import { container } from "tsyringe";
import { AdminController } from "./controller";
import { ValidateDtoMiddleware } from "@/middlewares/validate-dto.middleware";
import { UpdateUserDTO } from "@/microservices/users/user.dto";
import { cache } from "@/middlewares/cache.middleware";
import { CreateConfigDTO } from "@/microservices/configurations/configuration.dto";

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

export default router;
