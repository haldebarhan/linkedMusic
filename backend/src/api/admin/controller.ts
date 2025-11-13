import { AnnouncementController } from "@/microservices/annoncements/announcement.controller";
import { CatalogueController } from "@/microservices/catalogues/catalogue.controller";
import { CategoryController } from "@/microservices/categories/category.controller";
import { ConfigurationController } from "@/microservices/configurations/configuration.controller";
import { SubscriptionController } from "@/microservices/subscriptions/subscription.controller";
import { UserController } from "@/microservices/users/user.controller";
import { Request, Response } from "express";
import { injectable } from "tsyringe";

@injectable()
export class AdminController {
  constructor(
    private readonly userController: UserController,
    private readonly configController: ConfigurationController,
    private readonly catalogueController: CatalogueController,
    private readonly subscriptionController: SubscriptionController,
    private readonly announcementController: AnnouncementController,
    private readonly categoryController: CategoryController
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

  async removeServiceType(req: Request, res: Response) {
    return await this.catalogueController.removeServiceTypes(req, res);
  }

  async createServiceType(req: Request, res: Response) {
    return await this.catalogueController.createServiceType(req, res);
  }

  async findServiceType(req: Request, res: Response) {
    return await this.catalogueController.findServiceTypes(req, res);
  }

  async updateField(req: Request, res: Response) {
    return await this.catalogueController.updateField(req, res);
  }

  async createFieldOption(req: Request, res: Response) {
    return await this.catalogueController.createFieldOption(req, res);
  }

  async listFields(req: Request, res: Response) {
    return await this.catalogueController.listFields(req, res);
  }

  async removeField(req: Request, res: Response) {
    return await this.catalogueController.removeFields(req, res);
  }

  async attachService(req: Request, res: Response) {
    return await this.catalogueController.attachService(req, res);
  }

  async createPlan(req: Request, res: Response) {
    return await this.subscriptionController.createPlan(req, res);
  }
  async updatePlan(req: Request, res: Response) {
    return await this.subscriptionController.updatePlan(req, res);
  }

  async listSubscriptionPlans(req: Request, res: Response) {
    return await this.subscriptionController.findSubscriptionPlans(req, res);
  }

  async findSubscriptionPlan(req: Request, res: Response) {
    return await this.subscriptionController.findSubscriptionPlan(req, res);
  }
  async removePlan(req: Request, res: Response) {
    return await this.subscriptionController.removePlan(req, res);
  }

  // Announcements

  async listPendingAnnouncement(req: Request, res: Response) {
    return await this.announcementController.listPendingAnnouncements(req, res);
  }

  async approuveAnnouncement(req: Request, res: Response) {
    return await this.announcementController.approveAnnouncement(req, res);
  }

  async rejectAnnouncement(req: Request, res: Response) {
    return await this.announcementController.rejectAnnouncement(req, res);
  }

  // Fields

  async createField(req: Request, res: Response) {
    return await this.categoryController.createField(req, res);
  }

  async findField(req: Request, res: Response) {
    return await this.categoryController.findFieldById(req, res);
  }

  async attachField(req: Request, res: Response) {
    return await this.categoryController.addFieldToCategory(req, res);
  }

  async detachField(req: Request, res: Response) {
    return await this.categoryController.removeFieldFromCategory(req, res);
  }
}
