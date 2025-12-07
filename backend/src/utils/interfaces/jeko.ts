import { paymentMethod, status, transactionType } from "./payment-payload";

interface ApiSuccessResponse {
  id: string;
  storeId: string;
  reference: string;
  type: transactionType;
  paymentMethod: paymentMethod;
  status: status;
  errorReason?: never;
  transaction: {
    id: string;
    amount: {
      amount: number;
      currency: string;
    };
    fees: {
      amount: number;
      currency: string;
    };
    status: status;
    counterpartLabel: string;
    counterpartIdentifier: string;
    description: string;
    executedAt: string;
  };
}

interface ApiErrorResponse {
  id: string;
  message: string;
  extras?: string;
  storeId?: never;
  reference?: never;
  type?: never;
  paymentMethod?: never;
  status?: never;
  errorReason?: never;
  transaction?: never;
}

export type JekoPaymentStatusResponse = ApiSuccessResponse | ApiErrorResponse;
