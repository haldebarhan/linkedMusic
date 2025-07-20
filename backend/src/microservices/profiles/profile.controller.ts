import { injectable } from "tsyringe";
import { ProfileService } from "./profile.service";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { saveFilesToBucket } from "@/utils/functions/save-file";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { handleError } from "@/utils/helpers/handle-error";

@injectable()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  async approvalRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      const files = req.files as Express.Multer.File[];
      const savedFiles = await saveFilesToBucket("approvals", files);
      await this.profileService.approvalRequest(
        user.profile.id,
        user.id,
        savedFiles
      );
      const response = formatResponse(
        200,
        "Profile approval request sent successfully"
      );
      res.status(200).json(response);
    } catch (error) {
      handleError(error, res);
    }
  }
}
