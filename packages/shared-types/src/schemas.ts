/**
 * Zod Validation Schemas
 *
 * Runtime validation schemas for all major types.
 * Use these for API request/response validation.
 */

import { z } from 'zod';

// ─── Common Schemas ─────────────────────────────────────────────────────────

export const emailSchema = z.string().email();
export const phoneSchema = z.string().regex(/^\+?[\d\s\-()]+$/);
export const urlSchema = z.string().url();
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);
export const timezoneSchema = z.string();

// ─── Booking Schemas ────────────────────────────────────────────────────────

export const bookingStatusSchema = z.enum(['pending', 'confirmed', 'cancelled', 'completed']);
export const bookingTypeSchema = z.enum(['consultation', 'assessment']);
export const calendarProviderSchema = z.enum(['google', 'caldav']);

export const bookingFormDataSchema = z.object({
  date: isoDateSchema,
  time: timeSchema,
  name: z.string().min(2),
  email: emailSchema,
  phone: phoneSchema.optional(),
  companyName: z.string().optional(),
  industry: z.string().optional(),
  employeeCount: z.string().optional(),
  challenge: z.string().optional(),
  referralSource: z.string().optional(),
  websiteUrl: urlSchema.optional(),
  timezone: timezoneSchema,
  bookingType: bookingTypeSchema.optional(),
});

export const createBookingRequestSchema = bookingFormDataSchema.extend({
  stripe_session_id: z.string().optional(),
  payment_amount_cents: z.number().optional(),
});

// Admin booking creation with all NCB fields
export const adminBookingRequestSchema = z.object({
  // Required fields
  guest_name: z.string().min(2),
  guest_email: emailSchema,
  booking_date: isoDateSchema,
  start_time: timeSchema,

  // Optional fields
  guest_phone: phoneSchema.optional(),
  timezone: timezoneSchema.optional(),
  notes: z.string().optional(),
  status: bookingStatusSchema.optional(),
  company_name: z.string().optional(),
  industry: z.string().optional(),
  employee_count: z.string().optional(),
  challenge: z.string().optional(),
  referral_source: z.string().optional(),
  website_url: urlSchema.optional(),
  booking_type: bookingTypeSchema.optional(),
  stripe_session_id: z.string().optional(),
  payment_status: z.string().optional(),
  payment_amount_cents: z.number().optional(),
  calendar_provider: calendarProviderSchema.optional(),
  calendar_event_id: z.string().optional(),
  meeting_link: urlSchema.optional(),
  duration_minutes: z.number().min(15).max(240).optional(),
});

export const availabilityRequestSchema = z.object({
  date: isoDateSchema,
  timezone: timezoneSchema,
});

export const caldavConnectRequestSchema = z.object({
  caldav_url: z.string()
    .url()
    .refine(url => url.startsWith('https://'), {
      message: 'CalDAV URL must use HTTPS protocol'
    }),
  caldav_username: z.string().min(1, 'Username is required'),
  caldav_password: z.string().min(1, 'Password is required'),
});

// ─── Voice Agent Schemas ────────────────────────────────────────────────────

export const languageSchema = z.enum(['en', 'es']);
export const messageRoleSchema = z.enum(['user', 'assistant', 'system']);

export const conversationMessageSchema = z.object({
  role: messageRoleSchema,
  content: z.string(),
  timestamp: z.string().optional(),
});

export const chatRequestSchema = z.object({
  sessionId: z.string(),
  question: z.string().min(1),
  language: languageSchema,
  pagePath: z.string().optional(),
  conversationHistory: z.array(conversationMessageSchema).optional(),
});

export const speakRequestSchema = z.object({
  text: z.string().min(1),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional(),
  language: languageSchema,
  format: z.enum(['mp3', 'opus', 'aac', 'flac']).optional(),
});

// ─── ROI Schemas ────────────────────────────────────────────────────────────

export const serviceTierSchema = z.enum(['discovery', 'foundation', 'architect']);

export const taskHoursSchema = z.record(z.string(), z.number().min(0).max(168)); // max 168 hrs/week

export const calculateROIRequestSchema = z.object({
  industry: z.string().min(1),
  employeeCount: z.string(),
  hourlyRate: z.number().positive(),
  weeklyAdminHours: z.number().min(0).max(168),
  taskHours: taskHoursSchema.optional(),
  selectedTier: serviceTierSchema.optional(),
});

// ─── Auth Schemas ───────────────────────────────────────────────────────────

export const userRoleSchema = z.enum(['admin', 'team_member', 'customer']);

export const signInRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(8),
  rememberMe: z.boolean().optional(),
});

export const signUpRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  ),
  name: z.string().min(2),
});

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  ),
});

// ─── Email Schemas ──────────────────────────────────────────────────────────

export const emailPrioritySchema = z.enum(['low', 'normal', 'high']);

export const sendEmailRequestSchema = z.object({
  to: emailSchema,
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().optional(),
  from: z.object({
    email: emailSchema,
    name: z.string(),
  }).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    contentType: z.string().optional(),
  })).optional(),
  templateId: z.string().optional(),
  templateData: z.record(z.string(), z.unknown()).optional(),
});

// ─── Payment Schemas ────────────────────────────────────────────────────────

export const paymentStatusSchema = z.enum([
  'pending',
  'processing',
  'succeeded',
  'failed',
  'canceled',
  'refunded',
]);

export const createCheckoutSessionRequestSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  customerEmail: emailSchema.optional(),
  successUrl: urlSchema.optional(),
  cancelUrl: urlSchema.optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const processPaymentRequestSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  paymentMethodId: z.string(),
  customerEmail: emailSchema,
  description: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

// ─── Type Inference Helpers ─────────────────────────────────────────────────

export type BookingFormData = z.infer<typeof bookingFormDataSchema>;
export type CreateBookingRequest = z.infer<typeof createBookingRequestSchema>;
export type AdminBookingRequest = z.infer<typeof adminBookingRequestSchema>;
export type AvailabilityRequest = z.infer<typeof availabilityRequestSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type SpeakRequest = z.infer<typeof speakRequestSchema>;
export type CalculateROIRequest = z.infer<typeof calculateROIRequestSchema>;
export type SignInRequest = z.infer<typeof signInRequestSchema>;
export type SignUpRequest = z.infer<typeof signUpRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
export type SendEmailRequest = z.infer<typeof sendEmailRequestSchema>;
export type CreateCheckoutSessionRequest = z.infer<typeof createCheckoutSessionRequestSchema>;
export type ProcessPaymentRequest = z.infer<typeof processPaymentRequestSchema>;

// ─── Validation Helper Functions ────────────────────────────────────────────

/**
 * Validate data against a Zod schema and return typed result
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Format Zod errors for API responses
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}
