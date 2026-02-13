/**
 * Common types and utilities used across the platform
 */

// ─── Base Types ─────────────────────────────────────────────────────────────

export type Language = 'en' | 'es';

export type Timezone = string; // IANA timezone (e.g., "America/Los_Angeles")

export type ISODateString = string; // YYYY-MM-DD format

export type ISODateTimeString = string; // ISO 8601 format

export type TimeString = string; // HH:mm format (24-hour)

export type EmailAddress = string;

export type PhoneNumber = string;

export type URL = string;

// ─── API Response Types ─────────────────────────────────────────────────────

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

// ─── Common Record Fields ───────────────────────────────────────────────────

export interface TimestampFields {
  created_at: string;
  updated_at?: string;
}

export interface UserOwnership {
  user_id: number;
}

export interface SoftDelete {
  deleted_at?: string;
}

// ─── Validation Result ──────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// ─── Status Types ───────────────────────────────────────────────────────────

export type RecordStatus = 'active' | 'inactive' | 'archived';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ─── Utility Types ──────────────────────────────────────────────────────────

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type ID = string | number;

// ─── Device & Browser ───────────────────────────────────────────────────────

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'other';

export interface UserAgentInfo {
  device: DeviceType;
  browser: BrowserType;
  os?: string;
  raw: string;
}

// ─── Geolocation ────────────────────────────────────────────────────────────

export interface Geolocation {
  country?: string;
  region?: string;
  city?: string;
  timezone?: Timezone;
  lat?: number;
  lon?: number;
}

// ─── Contact Information ────────────────────────────────────────────────────

export interface ContactInfo {
  name: string;
  email: EmailAddress;
  phone?: PhoneNumber;
}

export interface CompanyInfo {
  name: string;
  industry?: string;
  employeeCount?: string;
  website?: URL;
}

// ─── Metadata ───────────────────────────────────────────────────────────────

export type Metadata = Record<string, unknown>;

export interface WithMetadata {
  metadata?: Metadata;
}
