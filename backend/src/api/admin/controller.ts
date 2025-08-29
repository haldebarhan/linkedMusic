import { ConfigurationController } from "@/microservices/configurations/configuration.controller";
import { UserController } from "@/microservices/users/user.controller";
import { Request, Response } from "express";
import { injectable } from "tsyringe";

@injectable()
export class AdminController {
  constructor(
    private readonly userController: UserController,
    private readonly configController: ConfigurationController
  ) {}

  // Users
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

  // CONFIGS

  async createConfig(req: Request, res: Response) {
    return await this.configController.create(req, res);
  }

  async updateConfig(req: Request, res: Response) {
    return await this.configController.update(req, res);
  }
  async findConfigs(req: Request, res: Response) {
    return await this.configController.findAll(req, res);
  }
  async findConfig(req: Request, res: Response) {
    return await this.configController.findOne(req, res);
  }
  async removeConfig(req: Request, res: Response) {
    return await this.configController.remove(req, res);
  }
}
