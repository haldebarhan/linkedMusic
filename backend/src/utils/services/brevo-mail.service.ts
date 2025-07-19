import { ENV } from "@/config/env";
import logger from "@/config/logger";
import * as SibApiV3Sdk from "@sharekey/sendinblue-client";

export class BrevoMailService {
  private static instance: BrevoMailService;
  private readonly accountApi: SibApiV3Sdk.AccountApi;
  private readonly emailApi: SibApiV3Sdk.TransactionalEmailsApi;

  private constructor() {
    this.accountApi = new SibApiV3Sdk.AccountApi();
    this.emailApi = new SibApiV3Sdk.TransactionalEmailsApi();
    this.accountApi.setApiKey(
      SibApiV3Sdk.AccountApiApiKeys.apiKey,
      ENV.MAILER_API_KEY
    );
    this.emailApi.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      ENV.MAILER_API_KEY
    );
  }

  public static getInstance(): BrevoMailService {
    if (!BrevoMailService.instance) {
      BrevoMailService.instance = new BrevoMailService();
    }
    return BrevoMailService.instance;
  }

  public async getAccountInfo(): Promise<void> {
    try {
      const response = await this.accountApi.getAccount();
      logger.info("✅ Brevo account info:", response.body);
    } catch (error) {
      logger.error("❌ Error fetching Brevo account info:", error);
    }
  }

  public async sendMail(data: {
    to: string;
    name: string;
    link: string;
    password?: string;
  }): Promise<any> {
    const emailContent = new SibApiV3Sdk.SendSmtpEmail();
    emailContent.sender = {
      name: ENV.MAILER_SENDER,
      email: ENV.MAILER_SENDER,
    };
    emailContent.to = [{ email: data.to }];
    emailContent.params = {
      name: data.name,
      link: data.link,
      email: data.to,
      password: data.password,
    };
    emailContent.templateId = parseInt(ENV.MAILER_TEMPLATE_ID);
    let response = await this.emailApi.sendTransacEmail(emailContent);
    return response.response.data;
  }

  public async sendChangePasswordConfMail(data: {
    to: string;
    name: string;
  }): Promise<any> {
    const emailContent = new SibApiV3Sdk.SendSmtpEmail();
    emailContent.sender = {
      name: ENV.MAILER_SENDER,
      email: ENV.MAILER_SENDER,
    };
    emailContent.to = [{ email: data.to }];
    emailContent.params = { name: data.name, email: data.to };
    emailContent.templateId = parseInt(ENV.MAILLER_CONFIRME_RP_TEMPLATE_ID);
    let response = await this.emailApi.sendTransacEmail(emailContent);
    return response.response.data;
  }

  async sendResetPasswordMail(data: {
    to: string;
    name: string;
    link: string;
  }): Promise<any> {
    const emailContent = new SibApiV3Sdk.SendSmtpEmail();
    emailContent.sender = {
      name: ENV.MAILER_SENDER,
      email: ENV.MAILER_SENDER,
    };
    emailContent.to = [{ email: data.to }];
    emailContent.params = {
      name: data.name,
      link: data.link,
      email: data.to,
    };
    emailContent.templateId = parseInt(ENV.MAILLER_RP_TEMPLATE_ID);
    let response = await this.emailApi.sendTransacEmail(emailContent);
    return response.response.data;
  }

  public async sendActivateAccountMail(data: {
    to: string;
    name: string;
    link: string;
  }): Promise<any> {
    const emailContent = new SibApiV3Sdk.SendSmtpEmail();
    emailContent.sender = {
      name: ENV.MAILER_SENDER,
      email: ENV.MAILER_SENDER,
    };
    emailContent.to = [{ email: data.to }];
    emailContent.params = {
      name: data.name,
      link: data.link,
    };
    emailContent.templateId = parseInt(ENV.MAILER_TEMPLATE_ID);
    let response = await this.emailApi.sendTransacEmail(emailContent);
    return response.response.data;
  }
}
