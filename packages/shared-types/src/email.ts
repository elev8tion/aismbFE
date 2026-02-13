/**
 * Email & Notification Types
 *
 * Shared types for email templates, sending, and webhook handling.
 */

import type { EmailAddress, Language } from './common';

// ─── Email Types ────────────────────────────────────────────────────────────

export type EmailProvider = 'emailit' | 'sendgrid' | 'resend' | 'smtp';

export type EmailPriority = 'low' | 'normal' | 'high';

export type EmailStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

// ─── Email Template ─────────────────────────────────────────────────────────

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: string[]; // e.g., ['name', 'date', 'link']
  language?: Language;
}

export type TemplateId =
  | 'booking_confirmation'
  | 'booking_reminder'
  | 'booking_cancellation'
  | 'roi_report'
  | 'assessment_invoice'
  | 'welcome'
  | 'password_reset'
  | 'email_verification';

// ─── Email Message ──────────────────────────────────────────────────────────

export interface EmailMessage {
  from: {
    email: EmailAddress;
    name?: string;
  };
  to: EmailAddress | EmailAddress[];
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  replyTo?: EmailAddress;
  subject: string;
  htmlBody: string;
  textBody?: string;
  attachments?: EmailAttachment[];
  priority?: EmailPriority;
  headers?: Record<string, string>;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer; // Base64 string or Buffer
  contentType?: string;
}

// ─── Send Email Request ─────────────────────────────────────────────────────

export interface SendEmailRequest {
  to: EmailAddress;
  subject: string;
  html: string;
  text?: string;
  from?: {
    email: EmailAddress;
    name: string;
  };
  attachments?: EmailAttachment[];
  templateId?: TemplateId;
  templateData?: Record<string, unknown>;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Email Service ──────────────────────────────────────────────────────────

export interface EmailServiceConfig {
  provider: EmailProvider;
  apiKey: string;
  fromEmail: EmailAddress;
  fromName: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: EmailProvider;
  timestamp: string;
}

// ─── Webhook Events ─────────────────────────────────────────────────────────

export type EmailEventType =
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'unsubscribed';

export interface EmailWebhookPayload {
  eventType: EmailEventType;
  messageId: string;
  recipient: EmailAddress;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface EmailWebhookResult {
  success: boolean;
  processed: boolean;
  error?: string;
}

// ─── Email Analytics ────────────────────────────────────────────────────────

export interface EmailAnalytics {
  messageId: string;
  sent: boolean;
  delivered: boolean;
  opened: boolean;
  clicked: boolean;
  bounced: boolean;
  complained: boolean;
  unsubscribed: boolean;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
}

// ─── Email Templates (Pre-defined) ─────────────────────────────────────────

export const EMAIL_TEMPLATES: Record<TemplateId, Omit<EmailTemplate, 'id'>> = {
  booking_confirmation: {
    name: 'Booking Confirmation',
    subject: 'Your {{bookingType}} is Confirmed - {{date}}',
    htmlBody: `
      <h1>Booking Confirmed!</h1>
      <p>Hi {{name}},</p>
      <p>Your {{bookingType}} has been confirmed for:</p>
      <ul>
        <li><strong>Date:</strong> {{date}}</li>
        <li><strong>Time:</strong> {{time}} {{timezone}}</li>
      </ul>
      <p><a href="{{meetingLink}}">Join Meeting</a></p>
    `,
    textBody: `Booking Confirmed!\n\nHi {{name}},\n\nYour {{bookingType}} has been confirmed for:\n\nDate: {{date}}\nTime: {{time}} {{timezone}}\n\nJoin: {{meetingLink}}`,
    variables: ['name', 'bookingType', 'date', 'time', 'timezone', 'meetingLink'],
  },

  booking_reminder: {
    name: 'Booking Reminder',
    subject: 'Reminder: {{bookingType}} Tomorrow at {{time}}',
    htmlBody: `
      <h1>Reminder: Your {{bookingType}} is Tomorrow</h1>
      <p>Hi {{name}},</p>
      <p>This is a reminder that your {{bookingType}} is scheduled for tomorrow:</p>
      <ul>
        <li><strong>Date:</strong> {{date}}</li>
        <li><strong>Time:</strong> {{time}} {{timezone}}</li>
      </ul>
      <p><a href="{{meetingLink}}">Join Meeting</a></p>
    `,
    textBody: `Reminder: Your {{bookingType}} is Tomorrow\n\nHi {{name}},\n\nDate: {{date}}\nTime: {{time}} {{timezone}}\n\nJoin: {{meetingLink}}`,
    variables: ['name', 'bookingType', 'date', 'time', 'timezone', 'meetingLink'],
  },

  booking_cancellation: {
    name: 'Booking Cancellation',
    subject: 'Booking Cancelled - {{date}}',
    htmlBody: `
      <h1>Booking Cancelled</h1>
      <p>Hi {{name}},</p>
      <p>Your {{bookingType}} scheduled for {{date}} at {{time}} has been cancelled.</p>
      <p>If you'd like to reschedule, please visit: <a href="{{bookingLink}}">{{bookingLink}}</a></p>
    `,
    textBody: `Booking Cancelled\n\nHi {{name}},\n\nYour {{bookingType}} scheduled for {{date}} at {{time}} has been cancelled.\n\nReschedule: {{bookingLink}}`,
    variables: ['name', 'bookingType', 'date', 'time', 'bookingLink'],
  },

  roi_report: {
    name: 'ROI Report',
    subject: 'Your Custom ROI Analysis',
    htmlBody: `
      <h1>Your ROI Analysis</h1>
      <p>Hi {{name}},</p>
      <p>Based on your business details, here's your potential ROI with KRE8TION:</p>
      <ul>
        <li><strong>Annual Savings:</strong> \${{annualSavings}}</li>
        <li><strong>ROI:</strong> {{roi}}%</li>
        <li><strong>Payback Period:</strong> {{paybackWeeks}} weeks</li>
      </ul>
      <p><a href="{{ctaLink}}">Schedule a Consultation</a></p>
    `,
    textBody: `Your ROI Analysis\n\nHi {{name}},\n\nAnnual Savings: \${{annualSavings}}\nROI: {{roi}}%\nPayback: {{paybackWeeks}} weeks\n\nSchedule: {{ctaLink}}`,
    variables: ['name', 'annualSavings', 'roi', 'paybackWeeks', 'ctaLink'],
  },

  assessment_invoice: {
    name: 'Assessment Invoice',
    subject: 'Invoice for AI Implementation Assessment',
    htmlBody: `
      <h1>Invoice</h1>
      <p>Hi {{name}},</p>
      <p>Thank you for your payment!</p>
      <ul>
        <li><strong>Service:</strong> AI Implementation Assessment</li>
        <li><strong>Amount:</strong> \${{amount}}</li>
        <li><strong>Date:</strong> {{date}}</li>
      </ul>
      <p><a href="{{invoiceLink}}">View Invoice</a></p>
    `,
    textBody: `Invoice\n\nHi {{name}},\n\nService: AI Implementation Assessment\nAmount: \${{amount}}\nDate: {{date}}\n\nView: {{invoiceLink}}`,
    variables: ['name', 'amount', 'date', 'invoiceLink'],
  },

  welcome: {
    name: 'Welcome Email',
    subject: 'Welcome to KRE8TION!',
    htmlBody: `
      <h1>Welcome to KRE8TION!</h1>
      <p>Hi {{name}},</p>
      <p>We're excited to have you on board. Get started by:</p>
      <ul>
        <li>Exploring our services</li>
        <li>Calculating your ROI</li>
        <li>Scheduling a consultation</li>
      </ul>
      <p><a href="{{dashboardLink}}">Go to Dashboard</a></p>
    `,
    textBody: `Welcome to KRE8TION!\n\nHi {{name}},\n\nGet started: {{dashboardLink}}`,
    variables: ['name', 'dashboardLink'],
  },

  password_reset: {
    name: 'Password Reset',
    subject: 'Reset Your Password',
    htmlBody: `
      <h1>Reset Your Password</h1>
      <p>Hi {{name}},</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="{{resetLink}}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
    `,
    textBody: `Reset Your Password\n\nHi {{name}},\n\nReset: {{resetLink}}\n\nExpires in 1 hour.`,
    variables: ['name', 'resetLink'],
  },

  email_verification: {
    name: 'Email Verification',
    subject: 'Verify Your Email Address',
    htmlBody: `
      <h1>Verify Your Email</h1>
      <p>Hi {{name}},</p>
      <p>Click the link below to verify your email address:</p>
      <p><a href="{{verificationLink}}">Verify Email</a></p>
    `,
    textBody: `Verify Your Email\n\nHi {{name}},\n\nVerify: {{verificationLink}}`,
    variables: ['name', 'verificationLink'],
  },
};
