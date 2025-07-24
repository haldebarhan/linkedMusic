import { CategoryController } from "@/microservices/categories/category.controller";
import { RoleGroupController } from "@/microservices/role-groups/role-group.controller";
import { UserController } from "@/microservices/users/user.controller";
import { Request, Response } from "express";
import { injectable } from "tsyringe";

@injectable()
export class AdminController {
  constructor(
    private readonly userController: UserController,
    private readonly categoryController: CategoryController,
    private readonly roleGroupController: RoleGroupController
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
}
