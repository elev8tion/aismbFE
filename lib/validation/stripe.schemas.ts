/**
 * Stripe Zod Validation Schemas
 *
 * Replaces manual validation in Stripe integration API routes with structured Zod schemas.
 */

import { z } from 'zod';

// ─── Checkout Session Creation ──────────────────────────────────────────────

export const createCheckoutSessionSchema = z.object({
  mode: z.enum(['payment', 'subscription']).default('payment'),
  priceId: z.string().optional(),
  prices: z.array(z.union([
    z.string(),
    z.object({
      price: z.string().optional(),
      quantity: z.number().int().positive().optional(),
      price_data: z.object({
        currency: z.string(),
        product_data: z.object({
          name: z.string().min(1, 'Product name required'),
          description: z.string().optional(),
        }),
        unit_amount: z.number().int().positive('Amount must be positive'),
      }).optional(),
    }).refine((data) => data.price || data.price_data, {
      message: 'Line item must have price or price_data',
    })
  ])).optional(),
  amount: z.number().positive().max(10000000).optional(), // Max $100k in cents
  currency: z.enum(['usd', 'eur', 'gbp']).default('usd'),
  customer_email: z.string().email().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  opportunity_id: z.string().optional(),
  partnership_id: z.string().optional(),
  success_path: z.string().default('/dashboard'),
  cancel_path: z.string().default('/pipeline'),
  description: z.string().default('Checkout'),
  product_name: z.string().default('Payment'),
}).refine(
  (data) => data.priceId || data.prices || data.amount,
  {
    message: 'Must provide either priceId (string), prices (array), or amount (positive number up to $100,000)',
    path: ['priceId'],
  }
);

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;

// ─── Invoice Creation ───────────────────────────────────────────────────────

export const createInvoiceSchema = z.object({
  partnership_id: z.string().min(1, 'Partnership ID is required'),
  customer_email: z.string().email('Invalid email format'),
  customer_name: z.string().min(1).optional(),
  tier: z.enum(['discovery', 'foundation', 'architect']),
  company_name: z.string().min(1).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

// ─── Subscription Creation ──────────────────────────────────────────────────

export const createSubscriptionSchema = z.object({
  customer_id: z.string()
    .startsWith('cus_', { message: 'Invalid Stripe customer ID format' }),
  tier: z.enum(['discovery', 'foundation', 'architect']),
  partnership_id: z.string().min(1, 'Partnership ID is required'),
  price_id: z.string().optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
