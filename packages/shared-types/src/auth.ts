/**
 * Authentication & Authorization Types
 *
 * Shared authentication types for user sessions, roles, and permissions.
 */

import type { EmailAddress, TimestampFields } from './common';

// ─── User Roles ─────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'team_member' | 'customer';

// ─── Auth Provider Types ────────────────────────────────────────────────────

export type AuthProvider =
  | 'credentials'
  | 'google'
  | 'microsoft'
  | 'github'
  | 'apple';

export interface OAuthProvider {
  name: AuthProvider;
  displayName: string;
  icon: string;
  getAuthUrl(redirectUri: string): string;
}

// ─── User Types ─────────────────────────────────────────────────────────────

export interface User extends TimestampFields {
  id: number;
  email: EmailAddress;
  name: string;
  role?: UserRole;
  emailVerified: boolean;
  image?: string;
  provider?: AuthProvider;
}

export interface UserProfile extends TimestampFields {
  id: number;
  user_id: number;
  role: UserRole;
  full_name?: string;
  phone?: string;
  company?: string;
  preferences?: string; // JSON string
}

// ─── Session Types ──────────────────────────────────────────────────────────

export interface Session {
  id: string;
  userId: number;
  expiresAt: Date;
  token: string;
}

export interface AuthSession {
  user: User;
  profile?: UserProfile;
  expiresAt: string;
}

// ─── Cookie Names ───────────────────────────────────────────────────────────

export const AUTH_COOKIES = {
  SESSION_TOKEN: 'better-auth.session_token',
  SESSION_DATA: 'better-auth.session_data',
  CSRF_TOKEN: 'better-auth.csrf_token',
} as const;

// ─── Auth Request/Response Types ────────────────────────────────────────────

export interface SignInRequest {
  email: EmailAddress;
  password: string;
  rememberMe?: boolean;
}

export interface SignInResponse {
  success: boolean;
  user?: User;
  error?: string;
  redirectTo?: string;
}

export interface SignUpRequest {
  email: EmailAddress;
  password: string;
  name: string;
}

export interface SignUpResponse {
  success: boolean;
  user?: User;
  error?: string;
  requiresVerification?: boolean;
}

export interface ResetPasswordRequest {
  email: EmailAddress;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  error?: string;
}

// ─── OAuth Callback ─────────────────────────────────────────────────────────

export interface OAuthCallbackData {
  provider: AuthProvider;
  code: string;
  state: string;
  error?: string;
}

export interface OAuthCallbackResult {
  success: boolean;
  user?: User;
  error?: string;
  redirectTo?: string;
}

// ─── Permissions ────────────────────────────────────────────────────────────

export type Permission =
  | 'manage_users'
  | 'manage_leads'
  | 'manage_bookings'
  | 'view_analytics'
  | 'manage_settings'
  | 'export_data';

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'admin',
    permissions: [
      'manage_users',
      'manage_leads',
      'manage_bookings',
      'view_analytics',
      'manage_settings',
      'export_data',
    ],
  },
  {
    role: 'team_member',
    permissions: ['manage_leads', 'manage_bookings', 'view_analytics'],
  },
  {
    role: 'customer',
    permissions: [],
  },
];

// ─── Auth Context ───────────────────────────────────────────────────────────

export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResponse>;
  signUp: (email: string, password: string, name: string) => Promise<SignUpResponse>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// ─── Token Types ────────────────────────────────────────────────────────────

export interface AccessToken {
  token: string;
  expiresAt: string;
  userId: number;
}

export interface RefreshToken {
  token: string;
  expiresAt: string;
  userId: number;
}

// ─── Auth Result ────────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  session?: Session;
  user?: User;
  error?: string;
}

// ─── Email Verification ─────────────────────────────────────────────────────

export interface EmailVerificationToken {
  token: string;
  email: EmailAddress;
  expiresAt: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  error?: string;
}
