// ─── Tier pricing (amounts in cents) ────────────────────────────────────────
export const TIER_PRICING = {
  discovery: {
    name:                  'The Revenue Guard',
    setup:                 250000,   // $2,500
    monthly:               75000,    // $750
    minMonths:             2,
    costModel:             'bundled' as const,
    includedInteractions:  500,
    overageRateCents:      8,        // $0.08 per interaction
  },
  foundation: {
    name:                  'The Operations Sovereign',
    setup:                 500000,   // $5,000
    monthly:               150000,   // $1,500
    minMonths:             3,
    costModel:             'bundled' as const,
    includedInteractions:  1500,
    overageRateCents:      8,        // $0.08 per interaction
  },
  architect: {
    name:                  'The Enterprise Fortress',
    setup:                 1200000,  // $12,000
    monthly:               300000,   // $3,000
    minMonths:             6,
    costModel:             'pass_through' as const,
    includedInteractions:  null,     // client holds own API accounts
    overageRateCents:      null,
  },
} as const;

export type TierKey = keyof typeof TIER_PRICING;
export type CostModel = 'bundled' | 'pass_through';

// ─── Stripe Price IDs ─────────────────────────────────────────────────────────
// Env vars take precedence at runtime — these are fallback constants.
// In Cloudflare Pages secrets, set the LIVE_ variants for production.

export const STRIPE_PRICE_IDS = {
  // Test mode
  test: {
    discovery: {
      monthly:  'price_1Sy0FeIFwav1xmJDRCXOwXec',
      setup:    'price_1T1vBKIFwav1xmJDX2ajcD9p',
      overage:  'price_1T1vBTIFwav1xmJD2tCAmsRM',
    },
    foundation: {
      monthly:  'price_1Sy0GUIFwav1xmJDaHEn0xq9',
      setup:    'price_1T1vBLIFwav1xmJD5jG21qNz',
      overage:  'price_1T1vBTIFwav1xmJDw0vH4TUN',
    },
    architect: {
      monthly:  'price_1Sy0GlIFwav1xmJD1hWmco5g',
      setup:    'price_1T1vBMIFwav1xmJD6jT0sDIC',
      overage:  null,
    },
  },
  // Live mode
  live: {
    discovery: {
      monthly:  'price_1Sy24CIFwav1xmJDBN3hwrSM',
      setup:    'price_1T1vK0IFwav1xmJD6hr7HELV',
      overage:  'price_1T1vK2IFwav1xmJDMejlUE4p',
    },
    foundation: {
      monthly:  'price_1Sy24JIFwav1xmJDutMeKZqE',
      setup:    'price_1T1vK1IFwav1xmJDdj0MMMQw',
      overage:  'price_1T1vK3IFwav1xmJDWTaUdmX8',
    },
    architect: {
      monthly:  'price_1Sy24LIFwav1xmJDrJyAgONc',
      setup:    'price_1T1vK2IFwav1xmJDymfWjmW1',
      overage:  null, // pass-through — no overage billed by us
    },
  },
} as const;

/** Convenience: returns the price IDs for the current mode based on STRIPE_SECRET_KEY prefix. */
export function getPriceIds(env?: Record<string, string | undefined>) {
  const key = env?.STRIPE_SECRET_KEY ?? '';
  return key.startsWith('sk_live_') ? STRIPE_PRICE_IDS.live : STRIPE_PRICE_IDS.test;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getTierPricing(tier: string) {
  return TIER_PRICING[tier as TierKey] ?? null;
}

/** Returns the monthly recurring price ID — env var takes precedence, then auto-resolves test/live. */
export function getMonthlyPriceId(tier: TierKey, env?: Record<string, string | undefined>): string {
  const envMap: Record<TierKey, string> = {
    discovery:  'STRIPE_PRICE_DISCOVERY_MONTHLY',
    foundation: 'STRIPE_PRICE_FOUNDATION_MONTHLY',
    architect:  'STRIPE_PRICE_ARCHITECT_MONTHLY',
  };
  return env?.[envMap[tier]] ?? getPriceIds(env)[tier].monthly;
}

/** Returns the one-time setup fee price ID — env var takes precedence, then auto-resolves test/live. */
export function getSetupPriceId(tier: TierKey, env?: Record<string, string | undefined>): string {
  const envMap: Record<TierKey, string> = {
    discovery:  'STRIPE_PRICE_DISCOVERY_SETUP',
    foundation: 'STRIPE_PRICE_FOUNDATION_SETUP',
    architect:  'STRIPE_PRICE_ARCHITECT_SETUP',
  };
  return env?.[envMap[tier]] ?? getPriceIds(env)[tier].setup;
}

/** Returns the per-interaction overage price ID, or null for pass-through tiers. */
export function getOveragePriceId(tier: TierKey, env?: Record<string, string | undefined>): string | null {
  if (TIER_PRICING[tier].costModel === 'pass_through') return null;
  const envMap: Record<TierKey, string> = {
    discovery:  'STRIPE_PRICE_DISCOVERY_OVERAGE',
    foundation: 'STRIPE_PRICE_FOUNDATION_OVERAGE',
    architect:  'STRIPE_PRICE_ARCHITECT_OVERAGE',
  };
  return env?.[envMap[tier]] ?? getPriceIds(env)[tier].overage ?? null;
}

/** Legacy — kept for backwards compatibility with existing routes. */
export function getPriceEnvVar(tier: TierKey): string {
  return {
    discovery:  'STRIPE_PRICE_DISCOVERY_MONTHLY',
    foundation: 'STRIPE_PRICE_FOUNDATION_MONTHLY',
    architect:  'STRIPE_PRICE_ARCHITECT_MONTHLY',
  }[tier];
}
