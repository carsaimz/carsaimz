/**
 * Carsai Mozambique — Email Service
 *
 * Uses SMTP (Gmail) via nodemailer for sending transactional emails.
 * Gmail SMTP is free (up to 500 emails/day) and works with any Gmail account.
 *
 * Setup:
 * 1. Enable 2FA on your Google account
 * 2. Generate an App Password at https://myaccount.google.com/apppasswords
 * 3. Set the environment variables or update the config below
 *
 * Firebase does NOT provide email sending on the free Spark plan.
 * SMTP via Gmail is the best free option for this project.
 */

import nodemailer from 'nodemailer';

// ─── SMTP Configuration ───

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

// Default SMTP config — can be overridden via environment variables
// or via the admin settings API (stored in Firestore)
function getSmtpConfig(): SmtpConfig {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true' || false,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromName: process.env.SMTP_FROM_NAME || 'Carsai Mozambique',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@carsaimz.vercel.app',
  };
}

// ─── Transporter ───

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(config?: SmtpConfig): nodemailer.Transporter | null {
  const cfg = config || getSmtpConfig();

  if (!cfg.user || !cfg.pass) {
    console.warn('[Email] SMTP credentials not configured. Set SMTP_USER and SMTP_PASS env vars.');
    return null;
  }

  if (cachedTransporter) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
    // Gmail-specific pooling for better performance
    pool: true,
    maxConnections: 5,
    rateLimit: true,
    maxMessages: 100,
  } as any);

  return cachedTransporter;
}

// ─── Email Types ───

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Core Send Function ───

export async function sendEmail(options: EmailOptions, smtpConfig?: SmtpConfig): Promise<EmailResult> {
  const cfg = smtpConfig || getSmtpConfig();
  const transporter = getTransporter(cfg);

  if (!transporter) {
    return {
      success: false,
      error: 'SMTP not configured. Set SMTP_USER and SMTP_PASS environment variables.',
    };
  }

  try {
    const result = await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      replyTo: options.replyTo,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      html: options.html,
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    console.error('[Email] Failed to send:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

// ─── Email Templates ───

/**
 * Generate a contact form notification email
 */
export function contactFormTemplate(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): EmailOptions {
  return {
    to: cfg().fromEmail, // Send to self (admin)
    replyTo: data.email,
    subject: data.subject || `Novo contato de ${data.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Carsai Mozambique</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Nova mensagem de contato</p>
        </div>
        <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p><strong>Nome:</strong> ${escapeHtml(data.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
          ${data.subject ? `<p><strong>Assunto:</strong> ${escapeHtml(data.subject)}</p>` : ''}
          <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; margin-top: 10px;">
            <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
          </div>
        </div>
        <div style="background: #f3f4f6; padding: 10px 20px; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            Enviado via formulário de contato CarsaiMz
          </p>
        </div>
      </div>
    `,
  };
}

/**
 * Generate a support ticket notification email
 */
export function ticketNotificationTemplate(data: {
  userName: string;
  userEmail: string;
  ticketSubject: string;
  ticketId: string;
  message: string;
  isAdminCopy: boolean;
}): EmailOptions {
  const title = data.isAdminCopy
    ? 'Novo ticket de suporte'
    : 'Seu ticket foi recebido';

  return {
    to: data.isAdminCopy ? cfg().fromEmail : data.userEmail,
    replyTo: data.isAdminCopy ? data.userEmail : undefined,
    subject: data.isAdminCopy
      ? `[Suporte] ${data.ticketSubject}`
      : `Ticket recebido: ${data.ticketSubject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Carsai Mozambique</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">${title}</p>
        </div>
        <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p><strong>Ticket:</strong> #${escapeHtml(data.ticketId.slice(0, 8))}</p>
          <p><strong>Assunto:</strong> ${escapeHtml(data.ticketSubject)}</p>
          ${data.isAdminCopy ? `<p><strong>Usuário:</strong> ${escapeHtml(data.userName)} (${escapeHtml(data.userEmail)})</p>` : ''}
          <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; margin-top: 10px;">
            <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
          </div>
        </div>
        <div style="background: #f3f4f6; padding: 10px 20px; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            CarsaiMz — Sistema de Suporte
          </p>
        </div>
      </div>
    `,
  };
}

/**
 * Generate a welcome email for new users
 */
export function welcomeEmailTemplate(data: {
  userName: string;
  userEmail: string;
}): EmailOptions {
  return {
    to: data.userEmail,
    subject: 'Bem-vindo ao Carsai Mozambique!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Bem-vindo!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Obrigado por se juntar ao Carsai Mozambique</p>
        </div>
        <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p>Olá <strong>${escapeHtml(data.userName)}</strong>,</p>
          <p>A sua conta foi criada com sucesso! Agora pode:</p>
          <ul style="color: #374151;">
            <li>Solicitar serviços de transformação digital</li>
            <li>Acompanhar projectos em tempo real</li>
            <li>Participar no nosso fórum</li>
            <li>Receber suporte técnico dedicado</li>
          </ul>
          <div style="text-align: center; margin: 20px 0;">
            <a href="https://carsaimz.vercel.app" style="background: linear-gradient(135deg, #059669, #0d9488); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Explorar Plataforma
            </a>
          </div>
        </div>
        <div style="background: #f3f4f6; padding: 10px 20px; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            Carsai Mozambique — Transformação Digital para Moçambique
          </p>
        </div>
      </div>
    `,
  };
}

/**
 * Generate a ticket reply notification email
 */
export function ticketReplyTemplate(data: {
  userName: string;
  userEmail: string;
  ticketSubject: string;
  ticketId: string;
  replyContent: string;
  replierName: string;
}): EmailOptions {
  return {
    to: data.userEmail,
    subject: `Atualização do ticket: ${data.ticketSubject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Atualização do Ticket</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">#${escapeHtml(data.ticketId.slice(0, 8))}</p>
        </div>
        <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p>Olá <strong>${escapeHtml(data.userName)}</strong>,</p>
          <p><strong>${escapeHtml(data.replierName)}</strong> respondeu ao seu ticket:</p>
          <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; margin-top: 10px;">
            <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(data.replyContent)}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="https://carsaimz.vercel.app/user/support" style="background: linear-gradient(135deg, #059669, #0d9488); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Ver Ticket
            </a>
          </div>
        </div>
        <div style="background: #f3f4f6; padding: 10px 20px; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            CarsaiMz — Sistema de Suporte
          </p>
        </div>
      </div>
    `,
  };
}

// ─── Helpers ───

function cfg() {
  return getSmtpConfig();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Check if SMTP is configured
 */
export function isEmailConfigured(): boolean {
  const config = getSmtpConfig();
  return !!(config.user && config.pass);
}

/**
 * Verify SMTP connection
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    return { success: false, error: 'SMTP not configured' };
  }
  try {
    await transporter.verify();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
