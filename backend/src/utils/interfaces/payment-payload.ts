export type paymentMethod = "wave" | "mtn" | "orange" | "moov" | "djamo";
export type transactionType = "payment" | "transfer";
export type status = "pending" | "success" | "error";

export interface WebhookEvent {
  id: string;
  amount: {
    amount: string;
    currency: string;
  };
  fees: {
    amount: string;
    currency: string;
  };
  status: status;
  counterpartLabel: string;
  counterpartIdentifier: string;
  paymentMethod: paymentMethod;
  transactionType: transactionType;
  businessName: string;
  storeName: string;
  description: string;
  executedAt: string;
  transactionDetails: {
    id: string;
    reference: string;
  };
}
