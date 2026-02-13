import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.frontendUrl = config.get('FRONTEND_URL') || 'http://localhost:5173';
    
    const smtpHost = config.get('SMTP_HOST');
    const smtpPort = config.get('SMTP_PORT');
    const smtpUser = config.get('SMTP_USER');
    const smtpPass = config.get('SMTP_PASS');

    if (smtpHost && smtpPort) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: parseInt(smtpPort, 10) === 465,
        auth: smtpUser && smtpPass ? {
          user: smtpUser,
          pass: smtpPass,
        } : undefined,
      });
      this.logger.log(`Email service configured with SMTP: ${smtpHost}:${smtpPort}`);
    } else {
      this.logger.warn('SMTP not configured - emails will be logged to console only');
    }
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    const fromAddress = this.config.get('SMTP_FROM') || 'noreply@cdiagvet.local';

    // If SMTP not configured, log to console
    if (!this.transporter) {
      this.logger.log('='.repeat(60));
      this.logger.log('📧 EMAIL (SMTP NON CONFIGURÉ - LOG ONLY)');
      this.logger.log(`To: ${options.to}`);
      this.logger.log(`Subject: ${options.subject}`);
      this.logger.log('-'.repeat(60));
      this.logger.log(options.text || options.html.replace(/<[^>]*>/g, ''));
      this.logger.log('='.repeat(60));
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendPortalCredentials(email: string, clientName: string, password: string): Promise<boolean> {
    const loginUrl = `${this.frontendUrl}/login`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }
          .credentials p { margin: 10px 0; }
          .label { color: #64748b; font-size: 14px; }
          .value { font-weight: bold; color: #1e293b; font-size: 16px; }
          .btn { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CDiagVet - Portail Client</h1>
          </div>
          <div class="content">
            <h2>Bienvenue ${clientName} !</h2>
            <p>Votre compte d'accès au portail CDiagVet a été créé.</p>
            
            <div class="credentials">
              <p><span class="label">Identifiant :</span><br><span class="value">${email}</span></p>
              <p><span class="label">Mot de passe provisoire :</span><br><span class="value">${password}</span></p>
            </div>
            
            <p>Cliquez sur le bouton ci-dessous pour vous connecter :</p>
            <a href="${loginUrl}" class="btn">Se connecter au portail</a>
            
            <div class="warning">
              <strong>⚠️ Important :</strong> Lors de votre première connexion, vous devrez créer un nouveau mot de passe sécurisé.
            </div>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement par CDiagVet.<br>
            Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer ce message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Bienvenue ${clientName} !

Votre compte d'accès au portail CDiagVet a été créé.

Identifiant : ${email}
Mot de passe provisoire : ${password}

Connectez-vous sur : ${loginUrl}

Important : Lors de votre première connexion, vous devrez créer un nouveau mot de passe sécurisé.
    `;

    return this.sendMail({
      to: email,
      subject: 'CDiagVet - Vos identifiants de connexion au portail',
      html,
      text,
    });
  }
}
