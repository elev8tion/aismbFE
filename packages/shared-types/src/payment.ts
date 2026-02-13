/**
 * Payment & Stripe Types
 *
 * Shared types for payment processing, Stripe integration, and invoicing.
 */

import type { EmailAddress, TimestampFields } from './common';

// ─── Payment Status ─────────────────────────────────────────────────────────

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded';

export type PaymentMethod = 'card' | 'bank_transfer' | 'cash' | 'other';

// ─── Stripe Types ───────────────────────────────────────────────────────────

export interface StripeSessionConfig {
  priceId?: string;
  amount?: number; // cents
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: EmailAddress;
  metadata?: Record<string, string>;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  status: string;
  amountTotal: number;
  currency: string;
  customerEmail?: EmailAddress;
  metadata?: Record<string, string>;
}

export interface StripeCustomer {
  id: string;
  email: EmailAddress;
  name?: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

// ─── Webhook Events ─────────────────────────────────────────────────────────

export type StripeWebhookEventType =
  | 'checkout.session.completed'
  | 'checkout.session.expired'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'customer.created'
  | 'customer.updated'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed';

export interface StripeWebhookPayload {
  id: string;
  type: StripeWebhookEventType;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
}

export interface StripeWebhookResult {
  success: boolean;
  processed: boolean;
  error?: string;
}

// ─── Payment Record ─────────────────────────────────────────────────────────

export interface PaymentRecord extends TimestampFields {
  id: string;
  amount: number; // cents
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
  customerEmail: EmailAddress;
  description?: string;
  metadata?: Record<string, string>;
}

// ─── Invoice ────────────────────────────────────────────────────────────────

export interface Invoice extends TimestampFields {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerEmail: EmailAddress;
  amount: number; // cents
  tax?: number; // cents
  total: number; // cents
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'canceled';
  dueDate: string;
  paidAt?: string;
  items: InvoiceItem[];
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number; // cents
  amount: number; // cents
}

// ─── Payment Request/Response ───────────────────────────────────────────────

export interface CreateCheckoutSessionRequest {
  amount: number; // cents
  description: string;
  customerEmail?: EmailAddress;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionResponse {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}

export interface ProcessPaymentRequest {
  amount: number; // cents
  currency: string;
  paymentMethodId: string;
  customerEmail: EmailAddress;
  description?: string;
  metadata?: Record<string, string>;
}

export interface ProcessPaymentResponse {
  success: boolean;
  paymentIntentId?: string;
  status?: PaymentStatus;
  error?: string;
}

// ─── Pricing ────────────────────────────────────────────────────────────────

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number; // cents/month
  setupFee?: number; // cents
  features: string[];
  popular?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'discovery',
    name: 'Discovery',
    description: 'Perfect for small businesses starting their AI journey',
    price: 75000, // $750/month
    setupFee: 250000, // $2,500
    features: [
      '3 Automated Tasks',
      '2-Month Implementation',
      'Basic Support',
      'Email Integration',
    ],
  },
  {
    id: 'foundation',
    name: 'Foundation',
    description: 'Best for growing businesses ready to scale',
    price: 150000, // $1,500/month
    setupFee: 500000, // $5,000
    features: [
      '6 Automated Tasks',
      '3-Month Implementation',
      'Priority Support',
      'CRM Integration',
      'Custom Workflows',
    ],
    popular: true,
  },
  {
    id: 'architect',
    name: 'Architect',
    description: 'Enterprise-grade automation for maximum efficiency',
    price: 300000, // $3,000/month
    setupFee: 1200000, // $12,000
    features: [
      '7+ Automated Tasks',
      '6-Month Implementation',
      'Dedicated Support',
      'Full System Integration',
      '10% Efficiency Boost',
      'Custom AI Models',
    ],
  },
];

// ─── Subscription ───────────────────────────────────────────────────────────

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'trialing';

export interface Subscription extends TimestampFields {
  id: string;
  customerId: string;
  priceId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
}

// ─── Refund ─────────────────────────────────────────────────────────────────

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number; // cents (partial refund if specified)
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  amount?: number;
  error?: string;
}
