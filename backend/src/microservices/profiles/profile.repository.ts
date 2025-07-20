import { BaseRepository } from "@/utils/classes/base.repoository";
import { injectable } from "tsyringe";
import { PrismaClient, Profile, ProfileStatus } from "@prisma/client";
import { CreateProfileDTO, UpdateProfileDTO } from "./profile.dto";
import DatabaseService from "@/utils/services/database.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class ProfileRepository extends BaseRepository<
  Profile,
  CreateProfileDTO,
  UpdateProfileDTO
> {
  constructor() {
    super(prisma.profile);
  }

  async updateByUserId(userId: number, data: Partial<UpdateProfileDTO>) {
    return prisma.profile.update({
      where: { userId },
      data,
    });
  }

  async updateProfileStatus(id: number, status: ProfileStatus) {
    return prisma.profile.update({
      where: { id },
      data: { status },
    });
  }
}
