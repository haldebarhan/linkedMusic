import { injectable } from "tsyringe";
import { MatchingService } from "./matching.service";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { handleError } from "@/utils/helpers/handle-error";
import { formatResponse } from "@/utils/helpers/response-formatter";
import createError from "http-errors";

@injectable()
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  async eligibility(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const { id } = req.query;

      if (typeof id === "undefined")
        throw createError(400, "'id' query parameter is required");
      const result = await this.matchingService.getEligibility(user.id, +id);
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
