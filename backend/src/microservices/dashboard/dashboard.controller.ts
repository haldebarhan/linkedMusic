import { injectable } from "tsyringe";
import { DashboardSerice } from "./dashboard.service";
import { Request, Response } from "express";
import { handleError } from "../../utils/helpers/handle-error";
import { AuthenticatedRequest } from "../../utils/interfaces/authenticated-request";
import { formatResponse } from "../../utils/helpers/response-formatter";

@injectable()
export class DashBoardController {
  constructor(private readonly dashboardService: DashboardSerice) {}

  async getUserDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const statistics = await this.dashboardService.userDashboard(user.id);
      const response = formatResponse(200, statistics);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
