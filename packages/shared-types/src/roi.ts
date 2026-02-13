/**
 * ROI Calculation Types
 *
 * Unified ROI calculation interfaces for both Landing Page and CRM.
 * Ensures consistent business metrics across the platform.
 */

import type { TimestampFields, Nullable, EmailAddress } from './common';

// ─── Task Categories ────────────────────────────────────────────────────────

export interface TaskCategory {
  id: string;
  automationRate: number; // 0.0-1.0 (e.g., 0.85 = 85% automation)
  defaultHoursPerWeek: number;
}

export const TASK_CATEGORIES: TaskCategory[] = [
  { id: 'scheduling', automationRate: 0.85, defaultHoursPerWeek: 6 },
  { id: 'communication', automationRate: 0.7, defaultHoursPerWeek: 8 },
  { id: 'dataEntry', automationRate: 0.9, defaultHoursPerWeek: 5 },
  { id: 'leadResponse', automationRate: 0.75, defaultHoursPerWeek: 4 },
  { id: 'reporting', automationRate: 0.8, defaultHoursPerWeek: 3 },
  { id: 'inventory', automationRate: 0.6, defaultHoursPerWeek: 4 },
  { id: 'socialMedia', automationRate: 0.5, defaultHoursPerWeek: 5 },
];

// ─── Tier Configuration ─────────────────────────────────────────────────────

export type ServiceTier = 'discovery' | 'foundation' | 'architect';

export interface TierConfig {
  id: ServiceTier;
  setupFee: number;
  monthlyFee: number;
  months: number;
  cost: number;
  tasksAutomated: number;
  efficiencyBoost: number; // 1.0 = baseline, 1.1 = 10% boost
}

export const TIER_DATA: Record<ServiceTier, TierConfig> = {
  discovery: {
    id: 'discovery',
    setupFee: 2500,
    monthlyFee: 750,
    months: 2,
    cost: 4000,
    tasksAutomated: 3,
    efficiencyBoost: 1.0,
  },
  foundation: {
    id: 'foundation',
    setupFee: 5000,
    monthlyFee: 1500,
    months: 3,
    cost: 9500,
    tasksAutomated: 6,
    efficiencyBoost: 1.0,
  },
  architect: {
    id: 'architect',
    setupFee: 12000,
    monthlyFee: 3000,
    months: 6,
    cost: 30000,
    tasksAutomated: 7,
    efficiencyBoost: 1.1,
  },
};

// ─── Calculator State ───────────────────────────────────────────────────────

export interface BusinessBasicsState {
  industry: string;
  employees: string;
  hourlyLaborCost: number;
}

export interface TaskHours {
  [taskId: string]: number;
}

export interface RevenueImpactState {
  monthlyRevenue: number;
  avgDealValue: number;
  lostLeadsPerMonth: number;
  closeRate: number; // 0.0-1.0 (e.g., 0.25 = 25%)
}

// ─── Calculation Results ────────────────────────────────────────────────────

export interface TaskSavingsBreakdown {
  taskId: string;
  hoursPerWeek: number;
  automationRate: number;
  weeklySavings: number; // dollars
}

export interface ROIResults {
  // Task analysis
  taskBreakdown: TaskSavingsBreakdown[];
  automatedTasks: TaskSavingsBreakdown[];
  totalWeeklyHoursSaved: number;
  weeklyLaborSavings: number;

  // Revenue impact
  recoveredLeads: number;
  monthlyRevenueRecovery: number;

  // Combined benefits
  totalWeeklyBenefit: number;
  annualBenefit: number;

  // Investment analysis
  investment: number;
  roi: number; // percentage (e.g., 250 = 250% ROI)
  paybackWeeks: number;

  // Comparison
  consultantCost: number;
  agencyCost: number;
}

// ─── ROI Metrics (Simplified) ──────────────────────────────────────────────

export interface ROIMetrics {
  timeSaved?: number; // hours/week
  weeklyValue?: number; // dollars
  totalValue?: number; // dollars (annual)
  investment?: number; // dollars
  roi?: number; // percentage
  paybackWeeks?: number;
}

// ─── Database Record (Landing Page) ────────────────────────────────────────

export interface LandingPageROICalculation extends TimestampFields {
  id: string;
  contact_id?: number;
  industry: string;
  employee_count: string;
  hourly_rate: number;
  weekly_admin_hours: number;
  calculations?: string; // JSON string of ROIMetrics
  selected_tier?: ServiceTier;
  email_captured: number; // 0 or 1 (boolean)
  email?: EmailAddress;
  report_requested: number; // 0 or 1
  report_sent_at?: string;
  time_on_calculator: number; // seconds
  adjustments_count: number;
}

// ─── Database Record (CRM) ──────────────────────────────────────────────────

export interface CRMROIAnalysis extends TimestampFields {
  id: number;
  opportunity_id: number;
  yearly_savings: string; // Decimal as string from NCB
  cost_per_month: string; // Decimal as string
  payback_months: number;
  roi_percentage: string; // Decimal as string
  user_id: number;
}

// ─── Unified ROI Calculation ───────────────────────────────────────────────

export interface UnifiedROICalculation {
  id: string;

  // Input data
  businessInfo: {
    industry: string;
    employeeCount: string;
    hourlyRate: number;
  };

  // Calculations
  results: ROIResults;

  // Selected service
  selectedTier?: ServiceTier;

  // Tracking
  metadata: {
    timeSpent: number; // seconds
    adjustmentsMade: number;
    emailCaptured: boolean;
    reportRequested: boolean;
  };

  // Timestamps
  createdAt: string;
  updatedAt?: string;
}

// ─── Transformation Utilities ───────────────────────────────────────────────

export function toUnifiedROI(
  source: LandingPageROICalculation | CRMROIAnalysis
): Partial<UnifiedROICalculation> {
  if ('industry' in source) {
    // Landing page format
    const calculations = source.calculations
      ? (JSON.parse(source.calculations) as ROIMetrics)
      : undefined;

    // Reconstruct ROIResults from ROIMetrics
    const results: Partial<ROIResults> = calculations
      ? {
          totalWeeklyHoursSaved: calculations.timeSaved,
          weeklyLaborSavings: calculations.weeklyValue,
          annualBenefit: calculations.totalValue,
          investment: calculations.investment,
          roi: calculations.roi,
          paybackWeeks: calculations.paybackWeeks,
        }
      : {};

    return {
      id: source.id,
      businessInfo: {
        industry: source.industry,
        employeeCount: source.employee_count,
        hourlyRate: source.hourly_rate,
      },
      results: results as ROIResults,
      selectedTier: source.selected_tier,
      metadata: {
        timeSpent: source.time_on_calculator,
        adjustmentsMade: source.adjustments_count,
        emailCaptured: Boolean(source.email_captured),
        reportRequested: Boolean(source.report_requested),
      },
      createdAt: source.created_at,
      updatedAt: source.updated_at,
    };
  } else {
    // CRM format
    return {
      id: String(source.id),
      results: {
        annualBenefit: Number(source.yearly_savings),
        investment: Number(source.cost_per_month) * 12, // Approximate
        roi: Number(source.roi_percentage),
        paybackWeeks: source.payback_months * 4.33, // Approximate weeks per month
      } as ROIResults,
      createdAt: source.created_at,
      updatedAt: source.updated_at,
    };
  }
}

// ─── ROI Calculator Input ───────────────────────────────────────────────────

export interface ROIInput {
  currentMonthlyCost: number;
  proposedMonthlyCost: number;
  implementationCost: number;
  productivityGainPercent: number;
  teamSize: number;
}

export interface ROIOutput {
  annualSavings: number;
  monthlySavings: number;
  paybackPeriodMonths: number;
  roiPercentage: number;
  breakEvenDate: Date;
  fiveYearValue: number;
}

// ─── API Types ──────────────────────────────────────────────────────────────

export interface CalculateROIRequest {
  industry: string;
  employeeCount: string;
  hourlyRate: number;
  weeklyAdminHours: number;
  taskHours?: TaskHours;
  selectedTier?: ServiceTier;
}

export interface CalculateROIResponse {
  success: boolean;
  results?: ROIResults;
  error?: string;
}
