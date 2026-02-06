export interface IndustryBenchmark {
  industry: string;
  avgAdminHoursPerEmployee: number; // Weekly hours per tech/employee
  avgHourlyRate: number;
  avgRevenuePerEmployee: number;
}

export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {
  'HVAC': {
    industry: 'HVAC',
    avgAdminHoursPerEmployee: 3.5, // High paperwork for dispatch/warranty
    avgHourlyRate: 85,
    avgRevenuePerEmployee: 250000,
  },
  'Plumbing': {
    industry: 'Plumbing',
    avgAdminHoursPerEmployee: 3.0,
    avgHourlyRate: 75,
    avgRevenuePerEmployee: 220000,
  },
  'Electrical': {
    industry: 'Electrical',
    avgAdminHoursPerEmployee: 2.8,
    avgHourlyRate: 95,
    avgRevenuePerEmployee: 240000,
  },
  'Construction': {
    industry: 'Construction',
    avgAdminHoursPerEmployee: 4.0, // High PM/Permitting overhead
    avgHourlyRate: 80,
    avgRevenuePerEmployee: 300000,
  },
  'Property Management': {
    industry: 'Property Management',
    avgAdminHoursPerEmployee: 5.0, // High tenant comms
    avgHourlyRate: 60,
    avgRevenuePerEmployee: 150000,
  },
  'Landscaping': {
    industry: 'Landscaping',
    avgAdminHoursPerEmployee: 2.0,
    avgHourlyRate: 55,
    avgRevenuePerEmployee: 120000,
  },
};

export function getBenchmarkComparison(industry: string, employeeCount: string, weeklyHours: number) {
  const benchmark = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS['Construction']; // Fallback
  
  // Estimate specific employee count from range
  let employees = 1;
  if (employeeCount === '1-5') employees = 3;
  else if (employeeCount === '5-10') employees = 7.5;
  else if (employeeCount === '10-25') employees = 17.5;
  else if (employeeCount === '25-50') employees = 37.5;
  else if (employeeCount === '50+') employees = 60;

  const expectedHours = employees * benchmark.avgAdminHoursPerEmployee;
  const difference = weeklyHours - expectedHours;
  const percentage = (difference / expectedHours) * 100;

  return {
    isOverheadHigh: difference > 0,
    percentage: Math.abs(Math.round(percentage)),
    differenceHours: Math.abs(Math.round(difference)),
    benchmarkHours: Math.round(expectedHours),
  };
}
