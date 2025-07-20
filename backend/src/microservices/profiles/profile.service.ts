import { injectable } from "tsyringe";
import { ProfileRepository } from "./profile.repository";
import { FileRepository } from "../files/file.repository";
import createError from "http-errors";
import { ProfileStatus as Pstatus } from "@/utils/enums/profile-status.enum";
import { ProfileStatus } from "@prisma/client";

@injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly fileRepository: FileRepository
  ) {}

  async approvalRequest(
    profileId: number,
    userId: number,
    files: { name: string; objectName: string }[]
  ) {
    const status = Pstatus.PENDING_APPROVAL;
    const profile = await this.profileRepository.findOne(profileId);
    if (!profile) throw createError(404, "Profile not found");
    if(profile.userId !== userId) throw createError(403, "You are not authorized to perform this action");
    await Promise.all([
      files.map(async (file) =>
        this.fileRepository.createFile({
          name: file.name,
          fileUrl: file.objectName,
          profileId: profile.id,
        })
      ),
      this.profileRepository.updateProfileStatus(
        profileId,
        status as ProfileStatus
      ),
    ]);
  }
}
