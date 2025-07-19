import { UserController } from "@/microservices/users/user.controller";
import { Request, Response } from "express";
import { injectable } from "tsyringe";

@injectable()
export class AdminController {
  constructor(private readonly userController: UserController) {}

  async getAllUsers(req: Request, res: Response) {
    return this.userController.findAll(req, res);
  }

  async closeUserAccount(req: Request, res: Response) {
    return this.userController.closeAccount(req, res);
  }

  async updateUser(req: Request, res: Response) {
    return this.userController.udpate(req, res);
  }

  async findUserById(req: Request, res: Response) {
    return this.userController.findOne(req, res);
  }
}
