import { handleError } from "@/utils/helpers/handle-error";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { PaymentDTO } from "./payment.dto";
import { PaymentService } from "./payment.service";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { Order } from "@/utils/enums/order.enum";
import { paginatedResponse } from "@/utils/helpers/paginated-response";

@injectable()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  async makePayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const dto: PaymentDTO = Object.assign(new PaymentDTO(), req.body);
      const created = await this.paymentService.createSubscriptionPayment(
        {
          userId: user.id,
          lastName: user.lastName,
          firstName: user.firstName,
          email: user.email,
        },
        dto
      );
      const response = formatResponse(201, created);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async checkPaymentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { externalId } = req.params;
      const { user } = req;
      const payment = await this.paymentService.findPaymentByReference(
        externalId,
        user.id
      );
      const response = formatResponse(200, payment);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getUserPayments(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const {
        page: pageQuery,
        limit: limitQuery,
        sortBy: sortQuery,
        status: statusQuery,
        sortOrder: orderQuery,
      } = req.query;
      const page = parseInt(pageQuery as string) || 1;
      const limit = parseInt(limitQuery as string) || 10;
      const sortOrder = (orderQuery as Order) || Order.DESC;
      let sortBy = sortQuery as string;
      const status = statusQuery as string;
      if (sortBy === "date") sortBy = "createdAt";

      const result = await this.paymentService.findUserPayments(user.id, {
        page,
        limit,
        sortBy,
        sortOrder,
        status,
      });

      const response = paginatedResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
