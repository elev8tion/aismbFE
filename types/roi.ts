export interface ROIMetrics {
  timeSaved?: number;
  weeklyValue?: number;
  totalValue?: number;
  investment?: number;
  roi?: number;
  paybackWeeks?: number;
}

export interface ROICalculation {
  id: string;
  contact_id?: number;
  industry: string;
  employee_count: string;
  hourly_rate: number;
  weekly_admin_hours: number;
  calculations?: string; // JSON string of ROIMetrics
  selected_tier?: 'discovery' | 'foundation' | 'architect';
  email_captured: number;
  email?: string;
  report_requested: number;
  report_sent_at?: string;
  time_on_calculator: number;
  adjustments_count: number;
  created_at?: string;
}
