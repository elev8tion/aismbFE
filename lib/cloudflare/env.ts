/**
 * Cloudflare Environment Helper
 *
 * Provides type-safe access to environment variables that works in both:
 * - Cloudflare Pages (uses ctx.env)
 * - Local development (uses process.env)
 */

import { getOptionalRequestContext } from '@cloudflare/next-on-pages';

export interface CloudflareEnv {
  // OpenAI
  OPENAI_API_KEY?: string;

  // NCB (NoCodeBackend)
  NCB_INSTANCE?: string;
  NCB_OPENAPI_URL?: string;
  NCB_SECRET_KEY?: string;
  NCB_DATA_API_URL?: string;
  NCB_AUTH_API_URL?: string;

  // EmailIt
  EMAILIT_API_KEY?: string;
  ADMIN_EMAIL?: string;

  // Stripe
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_ASSESSMENT_PRICE_ID?: string;
  STRIPE_PRICE_DISCOVERY_MONTHLY?: string;
  STRIPE_PRICE_FOUNDATION_MONTHLY?: string;
  STRIPE_PRICE_ARCHITECT_MONTHLY?: string;

  // Site
  SITE_URL?: string;

  // Google Calendar
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;

  // KV Namespaces
  VOICE_SESSIONS?: KVNamespace;
  RATE_LIMIT_KV?: KVNamespace;
  COST_MONITOR_KV?: KVNamespace;
  RESPONSE_CACHE_KV?: KVNamespace;

  // External Integration
  EXTERNAL_API_KEY?: string;

  // Feature Flags
  FF_VOICE_LEAD_EXTRACTION?: string;
  FF_VOICE_LEAD_SCORING?: string;
  FF_VOICE_CRM_SYNC?: string;
  FF_VOICE_ANALYTICS?: string;
  FF_VOICE_ADMIN_ALERTS?: string;

  [key: string]: string | KVNamespace | undefined;
}

/**
 * Get environment variables with fallback to process.env
 *
 * Works in both Cloudflare Pages (edge runtime) and local development.
 */
export function getEnv(): CloudflareEnv {
  const ctx = getOptionalRequestContext();
  return (ctx?.env || process.env) as CloudflareEnv;
}
