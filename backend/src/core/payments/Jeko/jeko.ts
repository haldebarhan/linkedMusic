import { ENV } from "@/config/env";
import { PaymentStatus } from "@/utils/enums/payment-status.enum";
import { generateRandomUUID } from "@/utils/functions/utilities";
import { JekoPaymentStatusResponse } from "@/utils/interfaces/jeko";
import {
  paymentMethod,
  status,
  transactionType,
} from "@/utils/interfaces/payment-payload";
import { Currency } from "@prisma/client";
import axios, { AxiosInstance } from "axios";

export type JekoCreatePaymentRequest = {
  amountCents: number;
  currency: string;
  reference: string;
  storeId: string;
  paymentDetails: {
    type: transactionType;
    data: {
      paymentMethod: paymentMethod;
      successUrl: string;
      errorUrl: string;
    };
  };
};

export type JekoCreatePaymentResponce = {
  id: string;
  redirectUrl?: string;
  status?: status;
  message?: string;
  extras?: any;
};

export class Jeko {
  private http: AxiosInstance;

  constructor(
    private readonly storeId = ENV.JEKO_STORE_ID,
    private readonly apiKey = ENV.JEKO_API_KEY,
    private readonly apiKeyId = ENV.JEKO_KEY_ID,
    private readonly paymentUrl = ENV.JEKO_BASE_URL
  ) {
    this.http = axios.create({
      baseURL: this.paymentUrl,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": `${this.apiKey}`,
        "X-API-KEY-ID": `${this.apiKeyId}`,
      },
    });
  }

  async createPaymentLink(
    reference: string,
    amountCents: number,
    paymentMethod: string
  ) {
    try {
      const payload = {
        amountCents,
        currency: Currency.XOF,
        reference,
        storeId: this.storeId,
        paymentDetails: {
          type: "redirect",
          data: {
            paymentMethod,
            successUrl: `${ENV.BASE_URL}/payment/success`,
            errorUrl: `${ENV.BASE_URL}/payment/error`,
          },
        },
      };

      const { data } = await this.http.post<JekoCreatePaymentResponce>(
        "/payment_requests",
        payload
      );

      const success = data.status === "success" || data.status === "pending";

      return {
        success,
        paymentUrl: data.redirectUrl,
        transactionId: data.id,
        raw: data,
      };
    } catch (error) {
      console.error("❌ ERREUR createPaymentLink:", error);

      if (error.response) {
        return {
          success: false,
          paymentUrl: null,
          transactionId: null,
          error: {
            status: error.response.status,
            message: error.response.data?.message || "Erreur API",
            details: error.response.data,
          },
          raw: error.response.data,
        };
      } else if (error.request) {
        console.error("🌐 Pas de réponse:", error.request);

        return {
          success: false,
          paymentUrl: null,
          transactionId: null,
          error: {
            status: 0,
            message: "Pas de réponse du serveur",
            details: "Timeout ou problème réseau",
          },
          raw: null,
        };
      } else {
        console.error("🐛 Erreur inattendue:", error.message);
        return {
          success: false,
          paymentUrl: null,
          transactionId: null,
          error: {
            status: -1,
            message: error.message || "Erreur inconnue",
            details: error,
          },
          raw: null,
        };
      }
    }
  }

  async checkPaymentStatus(externalId: string) {
    const { data } = await this.http.get<JekoPaymentStatusResponse>(
      `/payment_requests/${externalId}`
    );

    return {
      success: data.status === "success",
      status: data.status,
      transactionId: data.id,
      raw: data,
    };
  }
}
