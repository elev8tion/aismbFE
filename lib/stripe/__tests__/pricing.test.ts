import { describe, it, expect } from 'vitest';
import { TIER_PRICING, getTierPricing, getPriceEnvVar } from '../pricing';

describe('TIER_PRICING', () => {
  it('has exactly 3 tiers', () => {
    expect(Object.keys(TIER_PRICING)).toHaveLength(3);
  });

  it('has discovery tier with correct values', () => {
    expect(TIER_PRICING.discovery).toEqual({
      setup: 250000,
      monthly: 75000,
      name: 'AI Discovery',
      minMonths: 2,
    });
  });

  it('has foundation tier with correct values', () => {
    expect(TIER_PRICING.foundation).toEqual({
      setup: 500000,
      monthly: 150000,
      name: 'Foundation Builder',
      minMonths: 3,
    });
  });

  it('has architect tier with correct values', () => {
    expect(TIER_PRICING.architect).toEqual({
      setup: 1200000,
      monthly: 300000,
      name: 'Systems Architect',
      minMonths: 6,
    });
  });
});

describe('getTierPricing', () => {
  it('returns pricing for valid tier', () => {
    const result = getTierPricing('discovery');
    expect(result).not.toBeNull();
    expect(result!.setup).toBe(250000);
  });

  it('returns null for invalid tier', () => {
    expect(getTierPricing('nonexistent')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getTierPricing('')).toBeNull();
  });
});

describe('getPriceEnvVar', () => {
  it('returns correct env var for discovery', () => {
    expect(getPriceEnvVar('discovery')).toBe('STRIPE_PRICE_DISCOVERY_MONTHLY');
  });

  it('returns correct env var for foundation', () => {
    expect(getPriceEnvVar('foundation')).toBe('STRIPE_PRICE_FOUNDATION_MONTHLY');
  });

  it('returns correct env var for architect', () => {
    expect(getPriceEnvVar('architect')).toBe('STRIPE_PRICE_ARCHITECT_MONTHLY');
  });
});
