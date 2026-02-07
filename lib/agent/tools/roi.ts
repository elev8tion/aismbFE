import { ncbCreate } from '../ncbClient';

export async function run_roi_calculation(
  params: {
    business_name: string;
    monthly_revenue: number;
    employee_count: number;
    industry?: string;
  },
  userId: string,
  cookies: string
) {
  const savings = Math.round(Number(params.monthly_revenue) * 0.15);
  const efficiency = Math.round(Number(params.employee_count) * 5);

  const result = await ncbCreate('roi_calculations', {
    business_name: params.business_name,
    monthly_revenue: params.monthly_revenue,
    employee_count: params.employee_count,
    industry: params.industry || 'general',
    estimated_savings: savings,
    efficiency_hours: efficiency,
  }, userId, cookies);

  return {
    success: true,
    calculation: result,
    estimated_monthly_savings: savings,
    estimated_hours_saved: efficiency,
  };
}
