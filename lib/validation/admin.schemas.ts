/**
 * Admin Zod Validation Schemas
 *
 * Replaces manual validation in admin API routes with structured Zod schemas.
 */

import { z } from 'zod';

// ─── Grant Access ───────────────────────────────────────────────────────────

export const grantAccessSchema = z.object({
  customer_user_id: z.number().positive('Customer user ID must be a positive number'),
  partnership_id: z.number().positive('Partnership ID must be a positive number'),
  access_level: z.enum(['read', 'write', 'admin'], {
    errorMap: () => ({ message: 'Access level must be read, write, or admin' }),
  }).optional().default('read'),
});

export type GrantAccessInput = z.infer<typeof grantAccessSchema>;
