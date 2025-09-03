import { CatalogueController } from "@/microservices/catalogues/catalogue.controller";
import { ConfigurationController } from "@/microservices/configurations/configuration.controller";
import { UserController } from "@/microservices/users/user.controller";
import { Request, Response } from "express";
import { injectable } from "tsyringe";

@injectable()
export class AdminController {
  constructor(
    private readonly userController: UserController,
    private readonly configController: ConfigurationController,
    private readonly catalogueController: CatalogueController
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

  // CATALOGUES

  async createCategory(req: Request, res: Response) {
    return await this.catalogueController.createCategory(req, res);
  }
  async updateCategory(req: Request, res: Response) {
    return await this.catalogueController.updateCategory(req, res);
  }

  async removeCategory(req: Request, res: Response) {
    return await this.catalogueController.removeCategory(req, res);
  }

  async createServiceType(req: Request, res: Response) {
    return await this.catalogueController.createServiceType(req, res);
  }
  async createField(req: Request, res: Response) {
    return await this.catalogueController.createField(req, res);
  }

  async createFieldOption(req: Request, res: Response) {
    return await this.catalogueController.createFieldOption(req, res);
  }

  async listFields(req: Request, res: Response) {
    return await this.catalogueController.listFields(req, res);
  }

  async findField(req: Request, res: Response) {
    return await this.catalogueController.findField(req, res);
  }

  async removeField(req: Request, res: Response) {
    return await this.catalogueController.removeFields(req, res);
  }

  async attachField(req: Request, res: Response) {
    return await this.catalogueController.attachField(req, res);
  }

  async detachField(req: Request, res: Response) {
    return await this.catalogueController.detachField(req, res);
  }
}
