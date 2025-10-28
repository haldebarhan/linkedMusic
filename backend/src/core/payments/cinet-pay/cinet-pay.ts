import { ENV } from "@/config/env";
import { PaymentStatus } from "@/utils/enums/payment-status.enum";
import axios, { AxiosInstance } from "axios";
import crypto from "crypto";

export type CinetPayCreatePaymentInput = {
  amount: number;
  description: string;
  customerName?: string;
  customerSurname?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerCity?: string;
  customerCountry?: string;
  customerState?: string;
  customerZipCode?: string;
  customerPhone?: string;
  reference: string;
};

export type CinetPayCreatePaymentResponse = {
  success: boolean;
  paymentUrl?: string;
  paymentToken?: string;
  transactionId?: string;
  raw: any;
};

export type CinetPayCheckResponse = {
  success: boolean;
  status: PaymentStatus;
  transactionId?: string;
  raw: any;
};

export class CinetPayClient {
  private http: AxiosInstance;

  constructor(
    private readonly apiKey = ENV.PAYMENT_PROVIDER_API_KEY,
    private readonly siteId = ENV.PAYMENT_PROVIDER_SITE_ID,
    private readonly baseUrl = ENV.PAYMENT_PROVIDER_BASE_URL,
    private readonly returnUrl = ENV.PAYMENT_PROVIDER_RETURN_URL,
    private readonly notifyUrl = ENV.PAYMENT_PROVIDER_NOTIFY_URL,
    private readonly secretKey = ENV.PAYMENT_PROVIDER_SECRET_KEY
  ) {
    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async createPaymentLink(
    input: CinetPayCreatePaymentInput
  ): Promise<CinetPayCreatePaymentResponse> {
    const payload = {
      apikey: this.apiKey,
      site_id: this.siteId,
      transaction_id: input.reference,
      amount: input.amount,
      currency: "XOF",
      description: input.description,
      return_url: this.returnUrl,
      notify_url: this.notifyUrl,
      customer_name: input.customerName,
      customer_surname: input.customerSurname,
      customer_address: input.customerAddress,
      customer_city: input.customerCity,
      customer_country: input.customerCountry,
      customer_state: input.customerCountry,
      customer_zip_code: input.customerZipCode,
      customer_email: input.customerEmail,
      customer_phone_number: input.customerPhone,
      channels: "ALL",
    };

    const { data } = await this.http.post("/v2/payment", payload);

    const success = !!data?.data?.payment_url;
    return {
      success,
      paymentUrl: data?.data?.payment_url,
      paymentToken: data?.data?.payment_token,
      transactionId: input.reference,
      raw: data,
    };
  }

  async checkPaymentStatus(reference: string): Promise<CinetPayCheckResponse> {
    const payload = {
      apikey: this.apiKey,
      site_id: this.siteId,
      transaction_id: reference,
    };

    const { data } = await this.http.post("/v2/payment/check", payload);

    let status: CinetPayCheckResponse["status"] = PaymentStatus.PENDING;

    const pspStatus = data?.data?.status?.toUpperCase?.();
    if (pspStatus === "ACCEPTED" || pspStatus === "SUCCESS")
      status = PaymentStatus.SUCCESS;
    else if (pspStatus === "CANCELLED" || pspStatus === "CANCELED")
      status = PaymentStatus.CANCELED;
    else if (pspStatus === "REFUSED" || pspStatus === "FAILED")
      status = PaymentStatus.FAILED;

    return {
      success: status === PaymentStatus.SUCCESS,
      status,
      transactionId: data?.data?.transaction_id,
      raw: data,
    };
  }

  verifyWebhookSignature(body: any, signatureHeader?: string): boolean {
    try {
      const received = (signatureHeader || body?.["x-token"] || "")
        .toString()
        .trim();
      if (!this.secretKey || !received) return false;
      const pick = (k: string) => (body?.[k] ?? "").toString();
      const data =
        pick("cpm_site_id") +
        pick("cpm_trans_id") +
        pick("cpm_trans_date") +
        pick("cpm_amount") +
        pick("cpm_currency") +
        pick("signature") +
        pick("payment_method") +
        pick("cel_phone_num") +
        pick("cpm_phone_prefixe") +
        pick("cpm_language") +
        pick("cpm_version") +
        pick("cpm_payment_config") +
        pick("cpm_page_action") +
        pick("cpm_custom") +
        pick("cpm_designation") +
        pick("cpm_error_message");

      // HMAC-SHA256 en hex
      const generatedHex = crypto
        .createHmac("sha256", this.secretKey)
        .update(data, "utf8")
        .digest("hex");

      // Comparaison timing-safe (hex → Buffer)
      const a = Buffer.from(generatedHex, "hex");
      const b = Buffer.from(received, "hex");
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch (error) {
      return false;
    }
  }
}
