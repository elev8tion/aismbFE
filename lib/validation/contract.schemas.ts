/**
 * Contract Zod Validation Schemas
 *
 * Replaces manual validation in contract API routes with structured Zod schemas.
 */

import { z } from 'zod';

// ─── Sanitization Utilities ─────────────────────────────────────────────────

/**
 * Sanitizes string input by trimming, removing HTML tags, and limiting length.
 * Extracted from existing contract routes for reuse.
 */
export function sanitizeString(val: unknown, maxLength = 500): string {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/<[^>]*>/g, '').slice(0, maxLength);
}

// ─── Contract Creation ──────────────────────────────────────────────────────

export const createContractSchema = z.object({
  partnership_id: z.number().positive('Partnership ID must be a positive number'),
  client_name: z.string().min(1, 'Client name is required').max(500),
  client_email: z.string().email('Invalid email format'),
  company_name: z.string().min(1, 'Company name is required').max(500),
  tier: z.enum(['discovery', 'foundation', 'architect'], {
    errorMap: () => ({ message: 'Tier must be discovery, foundation, or architect' }),
  }),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;

// ─── Contract Signing (Client) ──────────────────────────────────────────────

export const signContractSchema = z.object({
  token: z.string().min(10, 'Invalid token').max(500),
  signer_name: z.string().min(1, 'Signer name is required').max(500),
  signer_title: z.string().max(500).optional(),
  signer_email: z.string().email('Invalid email format').optional(),
  signature_data: z.string()
    .min(1, 'Signature data is required')
    .max(50000, 'Signature data too large')
    .refine((val) => val.startsWith('data:image/'), {
      message: 'Signature must be a valid data URL',
    }),
});

export type SignContractInput = z.infer<typeof signContractSchema>;

// ─── Contract Countersigning (Admin) ────────────────────────────────────────

export const countersignContractSchema = z.object({
  partnership_id: z.number().positive('Partnership ID must be a positive number'),
  signer_name: z.string().min(1, 'Signer name is required').max(500),
  signer_title: z.string().max(500).optional(),
  signer_email: z.string().email('Invalid email format').optional(),
  signature_data: z.string()
    .min(1, 'Signature data is required')
    .max(50000, 'Signature data too large')
    .refine((val) => val.startsWith('data:image/'), {
      message: 'Signature must be a valid data URL',
    }),
});

export type CountersignContractInput = z.infer<typeof countersignContractSchema>;

// ─── Contract Send ──────────────────────────────────────────────────────────

export const sendContractSchema = z.object({
  signing_token: z.string().min(10, 'Invalid signing token').max(500),
});

export type SendContractInput = z.infer<typeof sendContractSchema>;

// ─── Contract Token Verification ───────────────────────────────────────────

export const verifyTokenSchema = z.object({
  token: z.string().min(10, 'Invalid token').max(500),
});

export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>;
