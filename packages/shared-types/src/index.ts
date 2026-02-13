/**
 * @kre8tion/shared-types
 *
 * Shared TypeScript types and interfaces for the KRE8TION platform.
 * Single source of truth for types used across:
 * - Landing Page (ai-smb-partners)
 * - CRM (ai_smb_crm_frontend)
 *
 * Version: 1.0.0
 * Last Updated: February 13, 2026
 */

// Core exports
export * from './booking';
export * from './voice-agent';
export * from './roi';
export * from './auth';
export * from './email';
export * from './payment';
export * from './common';
export * from './ncb';
export * from './crm';

// Validation schemas (export only schemas and utilities, not duplicate types)
export {
  // Common schemas
  emailSchema,
  phoneSchema,
  urlSchema,
  isoDateSchema,
  timeSchema,
  timezoneSchema,
  languageSchema,
  messageRoleSchema,
  userRoleSchema,
  emailPrioritySchema,

  // Booking schemas
  bookingStatusSchema,
  bookingTypeSchema,
  calendarProviderSchema,
  bookingFormDataSchema,
  createBookingRequestSchema,
  adminBookingRequestSchema,
  availabilityRequestSchema,
  caldavConnectRequestSchema,

  // Voice agent schemas
  conversationMessageSchema,
  chatRequestSchema,
  speakRequestSchema,

  // ROI schemas
  serviceTierSchema,
  taskHoursSchema,
  calculateROIRequestSchema,

  // Auth schemas
  signInRequestSchema,
  signUpRequestSchema,
  changePasswordRequestSchema,

  // Email schemas
  sendEmailRequestSchema,

  // Payment schemas
  paymentStatusSchema,
  createCheckoutSessionRequestSchema,
  processPaymentRequestSchema,

  // Utility functions
  validate,
  formatZodErrors,
} from './schemas';
