import { injectable } from "tsyringe";
import { UserService } from "./user.service";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { Request, Response } from "express";
import { handleError } from "@/utils/helpers/handle-error";
import { MinioService } from "@/utils/services/minio.service";
import { Order } from "@/utils/enums/order.enum";
import { paginatedResponse } from "@/utils/helpers/paginated-response";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import createError from "http-errors";
import { saveFileToBucket } from "@/utils/functions/save-file";
import { UpdateUserDTO } from "./user.dto";

const minioService: MinioService = MinioService.getInstance();

@injectable()
export class UserController {
  constructor(private readonly userService: UserService) {}

  async create(req: Request, res: Response) {
    try {
      const file = req.file as Express.Multer.File;
      const result = await saveFileToBucket("profiles", file);
      const link = await this.userService.createUser(
        req.body,
        result.objectName
      );
      const response = formatResponse(200, {
        message:
          "a confirmation link has been sent to the address you provided",
        link,
      });
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async activateAccount(req: Request, res: Response) {
    try {
      const { user, accessToken } = await this.userService.registerTempUser(
        req.body
      );
      res.cookie("access_token", accessToken, {
        httpOnly: true,
      });
      const response = formatResponse(200, { user, accessToken });
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findAll(req: Request, res: Response) {
    const { page: pageQuery, limit: limitQuery, order: orderQuery } = req.query;

    const page = parseInt(pageQuery as string) || 1;
    const limit = parseInt(limitQuery as string) || 10;

    const page_number = Math.max(page, 1);
    const limit_query = Math.max(limit, 10);
    const order = [Order.ASC, Order.DESC].includes(orderQuery as Order)
      ? (orderQuery as Order)
      : Order.DESC;

    const where: any = {};

    try {
      const users = await this.userService.findAll({
        limit: limit_query,
        page: page_number,
        order,
        where,
      });

      const response = paginatedResponse(200, users);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async udpate(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const user = req.user;
    const data = <UpdateUserDTO>req.body;
    const userId = id ? +id : user.id;
    const file: Express.Multer.File | undefined = req.file as
      | Express.Multer.File
      | undefined;
    try {
      const result = file
        ? await saveFileToBucket("profiles", file)
        : undefined;
      const updated = await this.userService.updateUser(
        userId,
        data,
        result?.objectName
      );
      const response = formatResponse(200, updated);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findOne(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const user = await this.userService.findOne(+id);
      const response = formatResponse(200, user);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const userAgent = req.get("user-agent");
      const ip = req.ip;
      if (!userAgent || !ip) throw createError(400, "Unknown user agent or IP");
      const { accessToken, user } = await this.userService.login(req.body, {
        userAgent,
        ip,
      });
      res.cookie("access_token", accessToken, {
        httpOnly: true,
      });
      const response = formatResponse(200, { accessToken, user });
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const response = formatResponse(200, user);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async refreshToken(req: AuthenticatedRequest, res: Response) {
    try {
      const token = req.token;
      const response = formatResponse(200, { accessToken: token });
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      await this.userService.forgotPassword(email);
      const response = formatResponse(200, {
        message: "Password reset link sent to your email",
      });
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      await this.userService.resetPassword(token, password);
      const response = formatResponse(200, {
        message: "Password reset successful",
      });
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    const { password } = req.body;
    const user = req.user;
    try {
      await this.userService.changePassword(user, password);
      const response = formatResponse(200, {
        message: "Password changed successfully",
      });
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      await this.userService.logout();
      res.clearCookie("access_token");
      res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
      handleError(res, error);
    }
  }

  async closeAccount(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const user = req.user;
    const comment = id ? `Closed by admin` : `Closed by User`;
    const userId = id ? +id : user.id;
    try {
      await this.userService.closeAccount(userId, comment);
      const response = formatResponse(200, {
        message: "Account closed successfully",
      });
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
