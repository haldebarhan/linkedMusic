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

  /**
   * Envoyer un email quand une annonce est approuvée
   */
  public async sendAnnouncementApprovedMail(data: {
    to: string;
    userName: string;
    announcementTitle: string;
    announcementId: number;
  }): Promise<any> {
    try {
      const emailContent = new SibApiV3Sdk.SendSmtpEmail();

      emailContent.sender = {
        name: ENV.MAILER_SENDER,
        email: ENV.MAILER_SENDER,
      };

      emailContent.to = [{ email: data.to }];

      emailContent.subject = "✅ Votre annonce a été publiée !";

      // HTML du mail
      emailContent.htmlContent = this.getAnnouncementApprovedTemplate(data);

      const response = await this.emailApi.sendTransacEmail(emailContent);
      logger.info(`✅ Email d'approbation envoyé à ${data.to}`);
      return response.response.data;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de l'envoi de l'email d'approbation:",
        error
      );
      throw error;
    }
  }

  /**
   * Envoyer un email quand une annonce est rejetée
   */
  public async sendAnnouncementRejectedMail(data: {
    to: string;
    userName: string;
    announcementTitle: string;
    announcementId: number;
    categoryName?: string;
    reason?: string;
  }): Promise<any> {
    try {
      const emailContent = new SibApiV3Sdk.SendSmtpEmail();

      emailContent.sender = {
        name: ENV.MAILER_SENDER,
        email: ENV.MAILER_SENDER,
      };

      emailContent.to = [{ email: data.to }];

      emailContent.subject = "⚠️ Votre annonce nécessite des modifications";

      // HTML du mail
      emailContent.htmlContent = this.getAnnouncementRejectedTemplate(data);

      const response = await this.emailApi.sendTransacEmail(emailContent);
      logger.info(`✅ Email de rejet envoyé à ${data.to}`);
      return response.response.data;
    } catch (error) {
      logger.error("❌ Erreur lors de l'envoi de l'email de rejet:", error);
      throw error;
    }
  }

  // ==========================================
  // 📬 MÉTHODES POUR LES DEMANDES DE CONTACT
  // ==========================================

  /**
   * Envoyer un email quand un user reçoit une demande de contact
   */
  public async sendContactRequestReceivedMail(data: {
    to: string;
    ownerName: string;
    requesterName: string;
    announcementTitle: string;
    announcementId: number;
    message: string;
  }): Promise<any> {
    try {
      const emailContent = new SibApiV3Sdk.SendSmtpEmail();

      emailContent.sender = {
        name: ENV.MAILER_SENDER,
        email: ENV.MAILER_SENDER,
      };

      emailContent.to = [{ email: data.to }];

      emailContent.subject = `📬 Nouvelle demande de contact pour "${data.announcementTitle}"`;

      // HTML du mail
      emailContent.htmlContent = this.getContactRequestReceivedTemplate(data);

      const response = await this.emailApi.sendTransacEmail(emailContent);
      logger.info(`✅ Email de demande de contact envoyé à ${data.to}`);
      return response.response.data;
    } catch (error) {
      logger.error("❌ Erreur lors de l'envoi de l'email de demande:", error);
      throw error;
    }
  }

  /**
   * Envoyer un email quand une demande est acceptée
   */
  public async sendContactRequestAcceptedMail(data: {
    to: string;
    requesterName: string;
    ownerName: string;
    announcementTitle: string;
    conversationId: number;
  }): Promise<any> {
    try {
      const emailContent = new SibApiV3Sdk.SendSmtpEmail();

      emailContent.sender = {
        name: ENV.MAILER_SENDER,
        email: ENV.MAILER_SENDER,
      };

      emailContent.to = [{ email: data.to }];

      emailContent.subject = `✅ Votre demande a été acceptée !`;

      // HTML du mail
      emailContent.htmlContent = this.getContactRequestAcceptedTemplate(data);

      const response = await this.emailApi.sendTransacEmail(emailContent);
      logger.info(`✅ Email d'acceptation envoyé à ${data.to}`);
      return response.response.data;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de l'envoi de l'email d'acceptation:",
        error
      );
      throw error;
    }
  }

  /**
   * Envoyer un email quand une demande est rejetée
   */
  public async sendContactRequestRejectedMail(data: {
    to: string;
    requesterName: string;
    ownerName: string;
    announcementTitle: string;
  }): Promise<any> {
    try {
      const emailContent = new SibApiV3Sdk.SendSmtpEmail();

      emailContent.sender = {
        name: ENV.MAILER_SENDER,
        email: ENV.MAILER_SENDER,
      };

      emailContent.to = [{ email: data.to }];

      emailContent.subject = `Réponse à votre demande de contact`;

      // HTML du mail
      emailContent.htmlContent = this.getContactRequestRejectedTemplate(data);

      const response = await this.emailApi.sendTransacEmail(emailContent);
      logger.info(`✅ Email de refus envoyé à ${data.to}`);
      return response.response.data;
    } catch (error) {
      logger.error("❌ Erreur lors de l'envoi de l'email de refus:", error);
      throw error;
    }
  }

  // ==========================================
  // 🎨 TEMPLATES HTML
  // ==========================================

  /**
   * Template pour approbation d'annonce
   */
  private getAnnouncementApprovedTemplate(data: {
    userName: string;
    announcementTitle: string;
    announcementId: number;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #34a853 0%, #2d8e47 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header .icon {
      font-size: 60px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #202124;
      font-size: 20px;
      margin-top: 0;
    }
    .announcement-box {
      background: #e8f5e9;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
      border-left: 4px solid #34a853;
    }
    .announcement-title {
      font-size: 18px;
      font-weight: 700;
      color: #2e7d32;
      margin: 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      opacity: 0.9;
    }
    .tips {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .tips h3 {
      color: #202124;
      margin-top: 0;
      font-size: 16px;
    }
    .tips ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .tips li {
      margin: 8px 0;
      color: #5f6368;
    }
    .footer {
      text-align: center;
      padding: 30px;
      color: #666;
      font-size: 14px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">🎉</div>
      <h1>Félicitations !</h1>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${data.userName}</strong>,</p>
      
      <p>Excellente nouvelle ! Votre annonce a été <strong>approuvée</strong> par notre équipe de modération.</p>

      <div class="announcement-box">
        <div class="announcement-title">📢 ${data.announcementTitle}</div>
      </div>

      <p>Votre annonce est maintenant <strong>publiée</strong> et visible par tous les utilisateurs de notre plateforme.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${ENV.FRONTEND_URL}/profile/announcements/${data.announcementId}" class="button">
          👀 Voir mon annonce
        </a>
      </div>

      <div class="tips">
        <h3>💡 Pour maximiser vos chances de succès :</h3>
        <ul>
          <li>Répondez rapidement aux demandes de contact</li>
          <li>Soyez professionnel dans vos échanges</li>
          <li>Tenez votre annonce à jour</li>
          <li>Partagez votre annonce sur les réseaux sociaux</li>
        </ul>
      </div>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        Vous recevrez une notification lorsque des utilisateurs vous contacteront concernant cette annonce.
      </p>
    </div>
    
    <div class="footer">
      <p>Cet email a été envoyé par <strong>ZikMuzik</strong></p>
      <p>
        <a href="${ENV.FRONTEND_URL}/profile/announcements">Gérer mes annonces</a> • 
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Template pour rejet d'annonce
   */
  private getAnnouncementRejectedTemplate(data: {
    userName: string;
    announcementTitle: string;
    announcementId: number;
    categoryName?: string;
    reason?: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #ea4335 0%, #d33b2c 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header .icon {
      font-size: 60px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
    }
    .announcement-box {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
      border-left: 4px solid #ea4335;
    }
    .announcement-title {
      font-size: 18px;
      font-weight: 700;
      color: #202124;
      margin: 0 0 8px 0;
    }
    .announcement-category {
      color: #5f6368;
      font-size: 14px;
    }
    .reason-box {
      background: #fff8e1;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
      border-left: 4px solid #fbbc04;
    }
    .reason-title {
      font-weight: 700;
      color: #f57f17;
      margin: 0 0 10px 0;
      font-size: 16px;
    }
    .reason-text {
      color: #202124;
      margin: 0;
      white-space: pre-line;
      line-height: 1.8;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .tips {
      background: #e8f5e9;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
      border-left: 4px solid #34a853;
    }
    .tips h3 {
      color: #2e7d32;
      margin: 0 0 15px 0;
      font-size: 16px;
    }
    .tips ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .tips li {
      margin: 8px 0;
      color: #202124;
    }
    .footer {
      text-align: center;
      padding: 30px;
      color: #666;
      font-size: 14px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .support-box {
      background: #f1f3f4;
      padding: 15px;
      border-radius: 6px;
      margin-top: 30px;
      font-size: 14px;
      color: #5f6368;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">⚠️</div>
      <h1>Annonce non publiée</h1>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${data.userName}</strong>,</p>
      
      <p>Nous vous informons que votre annonce n'a pas été approuvée par notre équipe de modération.</p>

      <div class="announcement-box">
        <div class="announcement-title">📢 ${data.announcementTitle}</div>
        ${
          data.categoryName
            ? `<div class="announcement-category">Catégorie : ${data.categoryName}</div>`
            : ""
        }
      </div>

      ${
        data.reason
          ? `
      <div class="reason-box">
        <div class="reason-title">📝 Raison du rejet :</div>
        <p class="reason-text">${data.reason}</p>
      </div>
      `
          : `
      <p><strong>Aucune raison spécifique n'a été fournie.</strong> Veuillez vérifier que votre annonce respecte nos conditions d'utilisation.</p>
      `
      }

      <div class="tips">
        <h3>💡 Conseils pour améliorer votre annonce :</h3>
        <ul>
          <li>Vérifiez que le contenu est clair et professionnel</li>
          <li>Assurez-vous que les photos sont de bonne qualité</li>
          <li>Évitez d'inclure des informations de contact dans la description</li>
          <li>Respectez les règles de votre catégorie</li>
          <li>Utilisez un langage approprié et respectueux</li>
          <li>Vérifiez l'orthographe et la grammaire</li>
        </ul>
      </div>

      <p style="font-size: 16px; margin: 30px 0;">
        <strong>Vous pouvez modifier votre annonce et la soumettre à nouveau pour validation.</strong>
      </p>
      
      <div style="text-align: center;">
        <a href="${ENV.FRONTEND_URL}/announcements/edit/${
      data.announcementId
    }" class="button">
          ✏️ Modifier mon annonce
        </a>
      </div>

      <div class="support-box">
        Si vous avez des questions concernant ce rejet, n'hésitez pas à contacter notre support à 
        <strong><a href="mailto:${ENV.SUPPORT_EMAIL}" style="color: #667eea;">
          ${ENV.SUPPORT_EMAIL}
        </a></strong>
      </div>
    </div>
    
    <div class="footer">
      <p>Cet email a été envoyé par <strong>ZikMuzik</strong></p>
      <p>
        <a href="${ENV.FRONTEND_URL}/profile/announcements">Mes annonces</a> • 
        <a href="${
          ENV.FRONTEND_URL
        }/help/guidelines">Guide des bonnes pratiques</a> • 
        <a href="${ENV.FRONTEND_URL}/settings/notifications">Paramètres</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Template pour demande de contact reçue
   */
  private getContactRequestReceivedTemplate(data: {
    ownerName: string;
    requesterName: string;
    announcementTitle: string;
    announcementId: number;
    message: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header .icon {
      font-size: 60px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
    }
    .announcement-box {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
      border-left: 4px solid #667eea;
    }
    .announcement-title {
      font-size: 18px;
      font-weight: 700;
      color: #202124;
      margin: 0;
    }
    .message-box {
      background: #e8f4f8;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
      border-left: 4px solid #1a73e8;
    }
    .message-author {
      font-weight: 700;
      color: #1a73e8;
      margin-bottom: 10px;
    }
    .message-text {
      color: #202124;
      white-space: pre-line;
      line-height: 1.8;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .info-box {
      background: #fff8e1;
      padding: 15px 20px;
      border-radius: 8px;
      margin: 25px 0;
      border-left: 4px solid #fbbc04;
    }
    .info-box p {
      margin: 0;
      color: #202124;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      padding: 30px;
      color: #666;
      font-size: 14px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">📬</div>
      <h1>Nouvelle demande de contact</h1>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${data.ownerName}</strong>,</p>
      
      <p>Vous avez reçu une <strong>nouvelle demande de contact</strong> pour votre annonce :</p>

      <div class="announcement-box">
        <div class="announcement-title">📢 ${data.announcementTitle}</div>
      </div>

      <div class="message-box">
        <div class="message-author">Message de ${data.requesterName} :</div>
        <div class="message-text">${data.message}</div>
      </div>

      <div class="info-box">
        <p>⏰ <strong>N'oubliez pas :</strong> Un abonnement actif est requis pour accepter les demandes de contact et échanger avec les utilisateurs.</p>
      </div>

      <p style="font-size: 16px; margin: 30px 0;">
        Connectez-vous pour <strong>accepter ou refuser</strong> cette demande :
      </p>
      
      <div style="text-align: center;">
        <a href="${ENV.FRONTEND_URL}/profile/announcements/${data.announcementId}" class="button">
          📥 Voir la demande
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>Cet email a été envoyé par <strong>ZikMuzik</strong></p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Template pour demande acceptée
   */
  private getContactRequestAcceptedTemplate(data: {
    requesterName: string;
    ownerName: string;
    announcementTitle: string;
    conversationId: number;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #34a853 0%, #2d8e47 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header .icon {
      font-size: 60px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
    }
    .success-box {
      background: #e8f5e9;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
      border-left: 4px solid #34a853;
    }
    .success-box p {
      margin: 0;
      color: #2e7d32;
      font-size: 16px;
      font-weight: 600;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .tips {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .tips h3 {
      color: #202124;
      margin-top: 0;
      font-size: 16px;
    }
    .tips ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .tips li {
      margin: 8px 0;
      color: #5f6368;
    }
    .footer {
      text-align: center;
      padding: 30px;
      color: #666;
      font-size: 14px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">✅</div>
      <h1>Demande acceptée !</h1>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${data.requesterName}</strong>,</p>
      
      <p>Excellente nouvelle ! <strong>${data.ownerName}</strong> a accepté votre demande de contact concernant l'annonce :</p>

      <div class="success-box">
        <p>📢 ${data.announcementTitle}</p>
      </div>

      <p style="font-size: 16px; margin: 30px 0;">
        Vous pouvez maintenant <strong>échanger directement</strong> avec ${data.ownerName} via notre messagerie :
      </p>
      
      <div style="text-align: center;">
        <a href="${ENV.FRONTEND_URL}/messages/${data.conversationId}" class="button">
          💬 Accéder à la conversation
        </a>
      </div>

      <div class="tips">
        <h3>💡 Conseils pour une collaboration réussie :</h3>
        <ul>
          <li>Soyez professionnel et courtois dans vos échanges</li>
          <li>Présentez clairement votre projet ou vos besoins</li>
          <li>Proposez une date et heure pour échanger si nécessaire</li>
          <li>Respectez les engagements pris</li>
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p>Cet email a été envoyé par <strong>ZikMuzik</strong></p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Template pour demande rejetée
   */
  private getContactRequestRejectedTemplate(data: {
    requesterName: string;
    ownerName: string;
    announcementTitle: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #5f6368 0%, #3c4043 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 30px;
      color: #666;
      font-size: 14px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Réponse à votre demande</h1>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${data.requesterName}</strong>,</p>
      
      <p>Nous vous informons que <strong>${data.ownerName}</strong> n'a pas pu donner suite à votre demande de contact concernant l'annonce "<strong>${data.announcementTitle}</strong>".</p>

      <p>Cela peut arriver pour diverses raisons (projet déjà finalisé, profil non correspondant, etc.).</p>

      <p style="margin-top: 30px;">
        <strong>Ne vous découragez pas !</strong> Il y a de nombreuses autres opportunités sur notre plateforme.
      </p>
      
      <div style="text-align: center;">
        <a href="${ENV.FRONTEND_URL}/search" class="button">
          🔍 Parcourir les annonces
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>Cet email a été envoyé par <strong>ZikMuzik</strong></p>
    </div>
  </div>
</body>
</html>
    `;
  }
}
