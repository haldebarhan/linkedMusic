import { Response, Router } from "express";
import { container } from "tsyringe";
import { UserController } from "./controller";
import { ValidateDtoMiddleware } from "@/middlewares/validate-dto.middleware";

import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import UserAndProviderMiddleware from "@/middlewares/user-provider.middleware";

const router: Router = Router();
const userController = container.resolve(UserController);

router.use(UserAndProviderMiddleware);

// forum topic

export default router;
