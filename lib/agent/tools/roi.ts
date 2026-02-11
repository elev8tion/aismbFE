import { ncbCreate, type NCBEnv } from '../ncbClient';
import { getTierPricing, type TierKey } from '@/lib/stripe/pricing';

const TIER_FACTORS: Record<TierKey, { savingsRate: number; hoursPerEmployee: number }> = {
  discovery:   { savingsRate: 0.10, hoursPerEmployee: 3 },
  foundation:  { savingsRate: 0.15, hoursPerEmployee: 5 },
  architect:   { savingsRate: 0.20, hoursPerEmployee: 8 },
};

export async function run_roi_calculation(
  params: {
    business_name: string;
    monthly_revenue: number;
    employee_count: number;
    industry?: string;
    selected_tier?: string;
  },
  userId: string,
  cookies: string,
  env: NCBEnv
) {
  const tierKey = (params.selected_tier || 'foundation') as TierKey;
  const pricing = getTierPricing(tierKey);
  const factors = TIER_FACTORS[tierKey] || TIER_FACTORS.foundation;

  const monthlySavings = Math.round(Number(params.monthly_revenue) * factors.savingsRate);
  const hoursSaved = Math.round(Number(params.employee_count) * factors.hoursPerEmployee);

  // Tier cost in cents — convert to dollars for payback calc
  const setupDollars = pricing ? pricing.setup / 100 : 0;
  const monthlyDollars = pricing ? pricing.monthly / 100 : 0;
  const minMonths = pricing ? pricing.minMonths : 3;
  const totalTierCost = setupDollars + (monthlyDollars * minMonths);

  // Payback in weeks: total cost / weekly savings
  const weeklySavings = monthlySavings / 4.33;
  const paybackWeeks = weeklySavings > 0 ? Math.ceil(totalTierCost / weeklySavings) : 0;

  const result = await ncbCreate(env, 'roi_calculations', {
    business_name: params.business_name,
    monthly_revenue: params.monthly_revenue,
    employee_count: params.employee_count,
    industry: params.industry || 'general',
    estimated_savings: monthlySavings,
    efficiency_hours: hoursSaved,
  }, userId, cookies);

  return {
    success: true,
    calculation: result,
    estimated_monthly_savings: monthlySavings,
    estimated_hours_saved: hoursSaved,
    selected_tier: pricing?.name || tierKey,
    tier_cost: totalTierCost,
    payback_weeks: paybackWeeks,
  };
}
