import { injectable } from "tsyringe";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { CreateContactRequestDTO } from "./contact-request.dto";
import { ContactRequestService } from "./contact-request.service";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { handleError } from "@/utils/helpers/handle-error";

@injectable()
export class ContactRequestController {
  constructor(private readonly contactService: ContactRequestService) {}

  async createRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const dto: CreateContactRequestDTO = Object.assign(
        new CreateContactRequestDTO(),
        req.body
      );
      const request = await this.contactService.create(userId, dto);
      const response = formatResponse(201, request);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getMyRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const announcementId = parseInt(req.params.announcementId, 10);

      const request = await this.contactService.getUserRequestForAnnouncement(
        userId,
        announcementId
      );

      const response = formatResponse(200, request);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getAnnouncementRequests(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const announcementId = parseInt(req.params.announcementId, 10);

      const requests = await this.contactService.getAnnouncementRequests(
        userId,
        announcementId
      );
      const response = formatResponse(200, requests);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async acceptRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const requestId = parseInt(req.params.id, 10);
      const request = await this.contactService.acceptRequest(
        userId,
        requestId
      );
      const response = formatResponse(200, request);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async rejectRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const requestId = parseInt(req.params.id, 10);
      const request = await this.contactService.rejectRequest(
        userId,
        requestId
      );
      const response = formatResponse(200, request);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async cancelRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const requestId = parseInt(req.params.id, 10);
      const request = await this.contactService.cancelRequest(
        userId,
        requestId
      );
      const response = formatResponse(200, request);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
