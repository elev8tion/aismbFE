/**
 * Stripe Zod Validation Schemas
 *
 * Replaces manual validation in Stripe integration API routes with structured Zod schemas.
 */

import { z } from 'zod';

// ─── Checkout Session Creation ──────────────────────────────────────────────

export const createCheckoutSessionSchema = z.object({
  mode: z.enum(['payment', 'subscription'], {
    errorMap: () => ({ message: 'Mode must be payment or subscription' }),
  }).default('payment'),
  priceId: z.string().optional(),
  prices: z.array(z.union([
    z.string(),
    z.object({}).passthrough() // Allow any object for line item
  ])).optional(),
  amount: z.number().positive().max(10000000).optional(), // Max $100k in cents
  currency: z.enum(['usd', 'eur', 'gbp'], {
    errorMap: () => ({ message: 'Currency must be usd, eur, or gbp' }),
  }).default('usd'),
  customer_email: z.string().email().optional(),
  metadata: z.record(z.string()).optional(),
  opportunity_id: z.string().optional(),
  partnership_id: z.string().optional(),
  success_path: z.string().default('/dashboard'),
  cancel_path: z.string().default('/pipeline'),
  description: z.string().default('Checkout'),
  product_name: z.string().default('Payment'),
}).refine(
  (data) => data.priceId || data.prices || data.amount,
  {
    message: 'Must provide either priceId, prices, or amount',
    path: ['priceId'],
  }
);

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;

// ─── Invoice Creation ───────────────────────────────────────────────────────

export const createInvoiceSchema = z.object({
  partnership_id: z.string().min(1, 'Partnership ID is required'),
  customer_email: z.string().email('Invalid email format'),
  customer_name: z.string().min(1).optional(),
  tier: z.enum(['discovery', 'foundation', 'architect'], {
    errorMap: () => ({ message: 'Tier must be discovery, foundation, or architect' }),
  }),
  company_name: z.string().min(1).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

// ─── Subscription Creation ──────────────────────────────────────────────────

export const createSubscriptionSchema = z.object({
  customer_id: z.string()
    .startsWith('cus_', { message: 'Invalid Stripe customer ID format' }),
  tier: z.enum(['discovery', 'foundation', 'architect'], {
    errorMap: () => ({ message: 'Tier must be discovery, foundation, or architect' }),
  }),
  partnership_id: z.string().min(1, 'Partnership ID is required'),
  price_id: z.string().optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
