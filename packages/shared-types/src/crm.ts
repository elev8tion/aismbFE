/**
 * CRM Domain Types
 *
 * Core entity types for the AI KRE8TION Partners CRM system.
 * These types represent database tables in the NCB instance (36905_ai_smb_crm).
 */

import type { TimestampFields, EmailAddress, PhoneNumber, URL, Nullable } from './common';
import type { ServiceTier } from './roi';
import type { UserRole } from './auth';

// ─── Lead ────────────────────────────────────────────────────────────────────

export interface Lead extends TimestampFields {
  id: number;
  email: EmailAddress;
  first_name: Nullable<string>;
  last_name: Nullable<string>;
  phone: Nullable<PhoneNumber>;
  company_name: Nullable<string>;
  source: string; // e.g., 'voice-agent', 'roi-calculator', 'referral', etc.
  source_detail: Nullable<string>;
  industry: Nullable<string>;
  employee_count: Nullable<string>; // e.g., '1-5', '10-25', etc.
  lead_score: number; // 0-100 score based on engagement
  status: string; // e.g., 'new', 'contacted', 'qualified', 'converted', 'lost'
  voice_session_id: Nullable<number>;
  roi_calculation_id: Nullable<number>;
  user_id: number;
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export interface Contact extends TimestampFields {
  id: number;
  first_name: string;
  last_name: string;
  email: EmailAddress;
  phone: Nullable<PhoneNumber>;
  company_id: Nullable<number>;
  title: Nullable<string>;
  role: Nullable<string>; // e.g., 'Owner', 'CEO', 'Operations Manager'
  decision_maker: number; // 0 or 1 (boolean)
  user_id: number;
}

// ─── Company ─────────────────────────────────────────────────────────────────

export interface Company extends TimestampFields {
  id: number;
  name: string;
  industry: Nullable<string>;
  employee_count: Nullable<string>; // e.g., '1-5', '10-25', '100+'
  website: Nullable<URL>;
  ai_maturity_score: number; // 0-10 score
  city: Nullable<string>;
  state: Nullable<string>;
  user_id: number;
}

// ─── Opportunity ─────────────────────────────────────────────────────────────

export interface Opportunity extends TimestampFields {
  id: number;
  name: string;
  company_id: Nullable<number>;
  tier: ServiceTier; // 'discovery' | 'foundation' | 'architect'
  stage: string; // e.g., 'new-lead', 'contacted', 'discovery-call', 'proposal-sent', 'negotiation', 'closed-won'
  setup_fee: number; // decimal as number
  monthly_fee: Nullable<number>; // decimal as number
  total_contract_value: Nullable<number>; // decimal as number
  expected_close_date: Nullable<string>; // YYYY-MM-DD
  user_id: number;
}

// ─── Partnership ─────────────────────────────────────────────────────────────

export interface Partnership extends TimestampFields {
  id: number;
  company_name: Nullable<string>;
  company_id: Nullable<number>;
  opportunity_id: Nullable<number>;
  tier: ServiceTier;
  status: string; // e.g., 'pending', 'active', 'paused', 'cancelled', 'completed'
  phase: Nullable<string>; // e.g., 'setup', 'implementation', 'delivery', 'maintenance'
  health_score: number; // 0-10 score
  systems_delivered: number;
  total_systems: number;
  monthly_revenue: Nullable<number>; // decimal as number
  start_date: Nullable<string>; // YYYY-MM-DD
  next_meeting: Nullable<string>; // ISO datetime
  notes: Nullable<string>;
  payment_status: Nullable<string>; // e.g., 'current', 'overdue', 'cancelled'
  customer_email: Nullable<EmailAddress>;
  stripe_customer_id: Nullable<string>;
  contact_name: Nullable<string>; // Derived/joined field
  user_id: number;
}

// ─── Activity ────────────────────────────────────────────────────────────────

export interface Activity extends TimestampFields {
  id: number;
  type: string; // e.g., 'call', 'email', 'meeting', 'note', 'task'
  title: string; // Previously 'subject'
  description: Nullable<string>;
  related_to: Nullable<string>; // e.g., 'lead', 'contact', 'opportunity', 'partnership'
  related_id: Nullable<number>;
  status: Nullable<string>; // e.g., 'pending', 'completed', 'cancelled'
  user_id: number;
}

// ─── Customer Access ─────────────────────────────────────────────────────────

export interface CustomerAccess extends TimestampFields {
  id: number;
  customer_user_id: number;
  partnership_id: number;
  access_level: string; // e.g., 'read', 'write', 'admin'
  granted_by: number; // admin user_id
}

// ─── Team Assignment ─────────────────────────────────────────────────────────

export interface TeamAssignment extends TimestampFields {
  id: number;
  team_member_id: number;
  partnership_id: number;
  role: string; // e.g., 'lead', 'support', 'implementation'
  assigned_by: number; // admin user_id
}
