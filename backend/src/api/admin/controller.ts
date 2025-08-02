import { AnnoncementController } from "@/microservices/announcements/annoncement.controller";
import { CategoryController } from "@/microservices/categories/category.controller";
import { StyleController } from "@/microservices/music-styles/style.controller";
import { RoleGroupController } from "@/microservices/role-groups/role-group.controller";
import { ServiceTypeController } from "@/microservices/service-types/service-type.controller";
import { UserController } from "@/microservices/users/user.controller";
import { Request, Response } from "express";
import { injectable } from "tsyringe";

@injectable()
export class AdminController {
  constructor(
    private readonly userController: UserController,
    private readonly categoryController: CategoryController,
    private readonly roleGroupController: RoleGroupController,
    private readonly serviceTypeController: ServiceTypeController,
    private readonly announcementController: AnnoncementController,
    private readonly styleController: StyleController
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

  // Categories
  async createCategory(req: Request, res: Response) {
    return this.categoryController.create(req, res);
  }

  async findCategories(req: Request, res: Response) {
    return this.categoryController.findAll(req, res);
  }

  async findCategory(req: Request, res: Response) {
    return this.categoryController.findOne(req, res);
  }

  async updateCategory(req: Request, res: Response) {
    return this.categoryController.udpate(req, res);
  }

  async removeCategory(req: Request, res: Response) {
    return this.categoryController.remove(req, res);
  }

  // role group
  async createRoleGroup(req: Request, res: Response) {
    return this.roleGroupController.create(req, res);
  }

  async findRoleGroups(req: Request, res: Response) {
    return this.roleGroupController.findAll(req, res);
  }

  async findRoleGroup(req: Request, res: Response) {
    return this.roleGroupController.findOne(req, res);
  }

  async updateRoleGroup(req: Request, res: Response) {
    return this.roleGroupController.udpate(req, res);
  }

  async removeRoleGroup(req: Request, res: Response) {
    return this.roleGroupController.remove(req, res);
  }

  // services types
  async createServiceType(req: Request, res: Response) {
    return this.serviceTypeController.create(req, res);
  }

  async findServiceTypes(req: Request, res: Response) {
    return this.serviceTypeController.findAll(req, res);
  }

  async findServiceType(req: Request, res: Response) {
    return this.serviceTypeController.findOne(req, res);
  }

  async updateServiceType(req: Request, res: Response) {
    return this.serviceTypeController.update(req, res);
  }

  // Announcements
  async findPendingAds(req: Request, res: Response) {
    return this.announcementController.findPendingAds(req, res);
  }

  async findAd(req: Request, res: Response) {
    return this.announcementController.findOne(req, res);
  }

  async validateAd(req: Request, res: Response) {
    return this.announcementController.validateAd(req, res);
  }

  // Music styles
  async findStyles(req: Request, res: Response) {
    return this.styleController.findAll(req, res);
  }

  async findStyle(req: Request, res: Response) {
    return this.styleController.findOne(req, res);
  }

  async createStyle(req: Request, res: Response) {
    return this.styleController.create(req, res);
  }

  async updateStyle(req: Request, res: Response) {
    return this.styleController.update(req, res);
  }

  async removeStyle(req: Request, res: Response) {
    return this.styleController.remove(req, res);
  }
}
