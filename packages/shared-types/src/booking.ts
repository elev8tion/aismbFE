/**
 * Booking System Types
 *
 * Unified booking interfaces for both Landing Page and CRM.
 * Handles consultations, assessments, calendar integrations, and availability.
 */

import type {
  ISODateString,
  TimeString,
  Timezone,
  EmailAddress,
  PhoneNumber,
  URL,
  TimestampFields,
  Nullable,
} from './common';
import type { PaymentStatus } from './payment';

// ─── Enums & Constants ──────────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type BookingType = 'consultation' | 'assessment';

export type CalendarProvider = 'google' | 'caldav';

// Assessment pricing constants
export const ASSESSMENT_FEE_CENTS = 25000; // $250.00
export const ASSESSMENT_DURATION = 180; // minutes (3 hours)
export const CONSULTATION_DURATION = 30; // minutes (30 min)
export const MEETING_DURATION = CONSULTATION_DURATION; // Backward compatibility alias

// ─── Unified Booking Interface ─────────────────────────────────────────────

export interface UnifiedBooking {
  id: string;
  type: BookingType;
  status: BookingStatus;

  // Guest information
  guest: {
    name: string;
    email: EmailAddress;
    phone?: PhoneNumber;
  };

  // Company information (optional)
  company?: {
    name: string;
    industry?: string;
    employeeCount?: string;
    website?: URL;
  };

  // Booking details
  booking: {
    date: ISODateString;
    startTime: TimeString;
    endTime: TimeString;
    timezone: Timezone;
  };

  // Additional information
  notes?: string;
  challenge?: string;
  referralSource?: string;

  // Payment (for assessments)
  payment?: {
    stripeSessionId: string;
    amountCents: number;
    status: PaymentStatus;
  };

  // Calendar integration
  calendar?: {
    provider: CalendarProvider;
    eventId: string;
    meetingLink?: URL;
  };

  // Timestamps
  createdAt: string;
  updatedAt?: string;
}

// ─── Landing Page Booking Format ───────────────────────────────────────────

export interface LandingPageBooking {
  id: string | number;
  guest_name: string;
  guest_email: string;
  guest_phone: Nullable<string>;
  booking_date: ISODateString;
  start_time: TimeString;
  end_time: TimeString;
  timezone: string;
  notes: Nullable<string>;
  company_name: Nullable<string>;
  industry: Nullable<string>;
  employee_count: Nullable<string>;
  challenge: Nullable<string>;
  referral_source: Nullable<string>;
  website_url: Nullable<string>;
  status: BookingStatus;
  booking_type: BookingType;
  stripe_session_id: Nullable<string>;
  payment_status: Nullable<string>;
  payment_amount_cents: Nullable<number>;
  calendar_provider: Nullable<CalendarProvider>;
  calendar_event_id: Nullable<string>;
  meeting_link: Nullable<string>;
  created_at: string;
}

// ─── CRM Booking Format ────────────────────────────────────────────────────

export interface CRMBooking extends TimestampFields {
  id: number;
  user_id: number;
  contact_email: string;
  contact_name: string;
  contact_phone: Nullable<string>;
  service_type: string;
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  status: string;
  notes: Nullable<string>;
  company_name: Nullable<string>;
  industry: Nullable<string>;
  employee_count: Nullable<string>;
}

// ─── Transformation Utilities ───────────────────────────────────────────────

export function toUnifiedBooking(
  source: LandingPageBooking | CRMBooking
): UnifiedBooking {
  // Type guard
  if ('guest_name' in source) {
    // Landing page format
    return {
      id: String(source.id),
      type: source.booking_type,
      status: source.status,
      guest: {
        name: source.guest_name,
        email: source.guest_email,
        phone: source.guest_phone || undefined,
      },
      company: source.company_name
        ? {
            name: source.company_name,
            industry: source.industry || undefined,
            employeeCount: source.employee_count || undefined,
            website: source.website_url || undefined,
          }
        : undefined,
      booking: {
        date: source.booking_date,
        startTime: source.start_time,
        endTime: source.end_time,
        timezone: source.timezone,
      },
      notes: source.notes || undefined,
      challenge: source.challenge || undefined,
      referralSource: source.referral_source || undefined,
      payment:
        source.stripe_session_id && source.payment_amount_cents
          ? {
              stripeSessionId: source.stripe_session_id,
              amountCents: source.payment_amount_cents,
              status: (source.payment_status as PaymentStatus) || 'pending',
            }
          : undefined,
      calendar:
        source.calendar_event_id && source.calendar_provider
          ? {
              provider: source.calendar_provider,
              eventId: source.calendar_event_id,
              meetingLink: source.meeting_link || undefined,
            }
          : undefined,
      createdAt: source.created_at,
    };
  } else {
    // CRM format
    const startDate = new Date(source.start_time);
    const endDate = new Date(source.end_time);

    return {
      id: String(source.id),
      type: source.service_type as BookingType,
      status: source.status as BookingStatus,
      guest: {
        name: source.contact_name,
        email: source.contact_email,
        phone: source.contact_phone || undefined,
      },
      company: source.company_name
        ? {
            name: source.company_name,
            industry: source.industry || undefined,
            employeeCount: source.employee_count || undefined,
          }
        : undefined,
      booking: {
        date: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        timezone: 'America/Los_Angeles', // Default - should come from DB
      },
      notes: source.notes || undefined,
      createdAt: source.created_at,
      updatedAt: source.updated_at,
    };
  }
}

export function toLandingPageBooking(
  unified: UnifiedBooking
): LandingPageBooking {
  return {
    id: unified.id,
    guest_name: unified.guest.name,
    guest_email: unified.guest.email,
    guest_phone: unified.guest.phone || null,
    booking_date: unified.booking.date,
    start_time: unified.booking.startTime,
    end_time: unified.booking.endTime,
    timezone: unified.booking.timezone,
    notes: unified.notes || null,
    company_name: unified.company?.name || null,
    industry: unified.company?.industry || null,
    employee_count: unified.company?.employeeCount || null,
    challenge: unified.challenge || null,
    referral_source: unified.referralSource || null,
    website_url: unified.company?.website || null,
    status: unified.status,
    booking_type: unified.type,
    stripe_session_id: unified.payment?.stripeSessionId || null,
    payment_status: unified.payment?.status || null,
    payment_amount_cents: unified.payment?.amountCents || null,
    calendar_provider: unified.calendar?.provider || null,
    calendar_event_id: unified.calendar?.eventId || null,
    meeting_link: unified.calendar?.meetingLink || null,
    created_at: unified.createdAt,
  };
}

export function toCRMBooking(unified: UnifiedBooking, userId: number): CRMBooking {
  const startDateTime = `${unified.booking.date}T${unified.booking.startTime}:00`;
  const endDateTime = `${unified.booking.date}T${unified.booking.endTime}:00`;

  return {
    id: Number(unified.id),
    user_id: userId,
    contact_email: unified.guest.email,
    contact_name: unified.guest.name,
    contact_phone: unified.guest.phone || null,
    service_type: unified.type,
    start_time: startDateTime,
    end_time: endDateTime,
    status: unified.status,
    notes: unified.notes || null,
    company_name: unified.company?.name || null,
    industry: unified.company?.industry || null,
    employee_count: unified.company?.employeeCount || null,
    created_at: unified.createdAt,
    updated_at: unified.updatedAt,
  };
}

// ─── Availability Types ─────────────────────────────────────────────────────

export interface AvailabilitySetting {
  id: string;
  weekday: number; // 0 = Sunday, 6 = Saturday
  start_minutes: number; // Minutes from midnight (e.g., 540 = 9:00 AM)
  end_minutes: number; // Minutes from midnight (e.g., 1020 = 5:00 PM)
  is_available: boolean;
}

export interface BlockedDate {
  id: string;
  date: ISODateString;
  reason?: string;
}

export interface TimeSlot {
  time: TimeString; // HH:mm format
  available: boolean;
  label: string; // Formatted time for display
}

export interface CalendarIntegration {
  id: string;
  provider: CalendarProvider;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  calendar_id?: string;
  caldav_url?: string;
  caldav_username?: string;
  caldav_password?: string; // Encrypted
  is_active: boolean;
}

// ─── API Request/Response Types ────────────────────────────────────────────

export interface BookingFormData {
  date: ISODateString;
  time: TimeString;
  name: string;
  email: EmailAddress;
  phone?: PhoneNumber;
  companyName?: string;
  industry?: string;
  employeeCount?: string;
  challenge?: string;
  referralSource?: string;
  websiteUrl?: URL;
  timezone: Timezone;
  bookingType?: BookingType;
}

export interface AvailabilityRequest {
  date: ISODateString;
  timezone: Timezone;
}

export interface AvailabilityResponse {
  date: ISODateString;
  slots: TimeSlot[];
  timezone: Timezone;
}

export interface CreateBookingRequest {
  date: ISODateString;
  time: TimeString;
  name: string;
  email: EmailAddress;
  phone?: PhoneNumber;
  companyName?: string;
  industry?: string;
  employeeCount?: string;
  challenge?: string;
  referralSource?: string;
  websiteUrl?: URL;
  timezone: Timezone;
  bookingType?: BookingType;
  stripe_session_id?: string;
  payment_amount_cents?: number;
}

export interface CreateBookingResponse {
  success: boolean;
  booking?: UnifiedBooking;
  error?: string;
}

// ─── Calendar Event Types ──────────────────────────────────────────────────

export interface CalendarEventData {
  title: string;
  description: string;
  start: Date;
  end: Date;
  attendeeEmail: EmailAddress;
  attendeeName: string;
  timezone: Timezone;
}

export interface CalendarEventResult {
  eventId: string;
  meetingLink?: URL;
}

// ─── Default Availability ───────────────────────────────────────────────────

export const DEFAULT_AVAILABILITY: Omit<AvailabilitySetting, 'id'>[] = [
  { weekday: 0, start_minutes: 0, end_minutes: 0, is_available: false }, // Sunday
  { weekday: 1, start_minutes: 540, end_minutes: 1020, is_available: true }, // Monday 9-5
  { weekday: 2, start_minutes: 540, end_minutes: 1020, is_available: true }, // Tuesday 9-5
  { weekday: 3, start_minutes: 540, end_minutes: 1020, is_available: true }, // Wednesday 9-5
  { weekday: 4, start_minutes: 540, end_minutes: 1020, is_available: true }, // Thursday 9-5
  { weekday: 5, start_minutes: 540, end_minutes: 1020, is_available: true }, // Friday 9-5
  { weekday: 6, start_minutes: 0, end_minutes: 0, is_available: false }, // Saturday
];
