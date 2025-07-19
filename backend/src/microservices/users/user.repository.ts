import { BaseRepository } from "@/utils/classes/base.repoository";
import { injectable } from "tsyringe";
import { CreateUserDTO, UpdateUserDTO } from "./user.dto";
import { PrismaClient, Status, User } from "@prisma/client";
import DatabaseService from "@/utils/services/database.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class UserRepository extends BaseRepository<
  User,
  Omit<CreateUserDTO, "password">,
  UpdateUserDTO & { profileImage?: string }
> {
  constructor() {
    super(prisma.user);
  }

  async closeAccount(id: number, comment: string) {
    return await prisma.user.update({
      where: { id },
      data: {
        status: Status.CLOSED,
        comments: comment,
      },
    });
  }
}
