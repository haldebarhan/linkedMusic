import { BaseRepository } from "@/utils/classes/base.repoository";
import { injectable } from "tsyringe";
import { CreateUserDTO, UpdateUserDTO } from "./user.dto";
import { PrismaClient, Profile, Status, User } from "@prisma/client";
import DatabaseService from "@/utils/services/database.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class UserRepository extends BaseRepository<
  User,
  Omit<CreateUserDTO, "password" | "displayName">,
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

  async findOne(id: number): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: { Profile: true },
    });
  }

  async update(id: number, data: Partial<UpdateUserDTO>): Promise<User & { Profile: Profile | null }> {
    return prisma.user.update({
      where: { id },
      data,
      include: { Profile: true }
    });
  }
}
