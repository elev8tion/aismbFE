export const TIER_PRICING = {
  discovery:   { setup: 250000,  monthly: 75000,  name: 'AI Discovery',       minMonths: 2 },
  foundation:  { setup: 500000,  monthly: 150000, name: 'Foundation Builder',  minMonths: 3 },
  architect:   { setup: 1200000, monthly: 300000, name: 'Systems Architect',   minMonths: 6 },
} as const;

export type TierKey = keyof typeof TIER_PRICING;

export function getTierPricing(tier: string) {
  return TIER_PRICING[tier as TierKey] ?? null;
}

export function getPriceEnvVar(tier: TierKey): string {
  const map: Record<TierKey, string> = {
    discovery:  'STRIPE_PRICE_DISCOVERY_MONTHLY',
    foundation: 'STRIPE_PRICE_FOUNDATION_MONTHLY',
    architect:  'STRIPE_PRICE_ARCHITECT_MONTHLY',
  };
  return map[tier];
}
