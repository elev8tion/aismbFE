// Tool Registry — routes function calls to domain handlers

import * as leads from './leads';
import * as bookings from './bookings';
import * as pipeline from './pipeline';
import * as contacts from './contacts';
import * as partnerships from './partnerships';
import * as analytics from './analytics';
import * as navigation from './navigation';
import * as ui from './ui';
import * as bulk from './bulk';
import * as messaging from './messaging';
import * as roi from './roi';

// Tools that require userId for create operations
const CREATE_TOOLS = new Set([
  'create_lead', 'create_opportunity', 'create_contact', 'create_company',
  'block_date', 'create_task',
  'create_partnership', 'run_roi_calculation', 'log_activity', 'schedule_followup',
  'log_partner_interaction',
]);

type ToolHandler = (params: Record<string, unknown>, cookiesOrUserId: string, cookies?: string) => Promise<unknown>;

const registry: Record<string, ToolHandler> = {
  // Leads
  list_leads: leads.list_leads as unknown as ToolHandler,
  search_leads: leads.search_leads as unknown as ToolHandler,
  count_leads: leads.count_leads as unknown as ToolHandler,
  create_lead: leads.create_lead as unknown as ToolHandler,
  update_lead_status: leads.update_lead_status as unknown as ToolHandler,
  score_lead: leads.score_lead as unknown as ToolHandler,
  get_lead_summary: leads.get_lead_summary as unknown as ToolHandler,

  // Bookings
  get_todays_bookings: bookings.get_todays_bookings as unknown as ToolHandler,
  get_upcoming_bookings: bookings.get_upcoming_bookings as unknown as ToolHandler,
  list_bookings: bookings.list_bookings as unknown as ToolHandler,
  confirm_booking: bookings.confirm_booking as unknown as ToolHandler,
  cancel_booking: bookings.cancel_booking as unknown as ToolHandler,
  block_date: bookings.block_date as unknown as ToolHandler,
  unblock_date: bookings.unblock_date as unknown as ToolHandler,
  get_availability: bookings.get_availability as unknown as ToolHandler,
  get_booking_summary: bookings.get_booking_summary as unknown as ToolHandler,

  // Pipeline
  list_opportunities: pipeline.list_opportunities as unknown as ToolHandler,
  get_pipeline_summary: pipeline.get_pipeline_summary as unknown as ToolHandler,
  create_opportunity: pipeline.create_opportunity as unknown as ToolHandler,
  move_deal: pipeline.move_deal as unknown as ToolHandler,

  // Contacts
  search_contacts: contacts.search_contacts as unknown as ToolHandler,
  get_contact: contacts.get_contact as unknown as ToolHandler,
  create_contact: contacts.create_contact as unknown as ToolHandler,
  search_companies: contacts.search_companies as unknown as ToolHandler,
  create_company: contacts.create_company as unknown as ToolHandler,
  get_company_contacts: contacts.get_company_contacts as unknown as ToolHandler,

  // Partnerships
  list_partnerships: partnerships.list_partnerships as unknown as ToolHandler,
  get_partnership_summary: partnerships.get_partnership_summary as unknown as ToolHandler,
  update_partnership_phase: partnerships.update_partnership_phase as unknown as ToolHandler,
  update_health_score: partnerships.update_health_score as unknown as ToolHandler,

  // Analytics
  get_dashboard_stats: analytics.get_dashboard_stats as unknown as ToolHandler,
  get_daily_summary: analytics.get_daily_summary as unknown as ToolHandler,
  get_recent_activities: analytics.get_recent_activities as unknown as ToolHandler,
  get_voice_session_insights: analytics.get_voice_session_insights as unknown as ToolHandler,
  get_roi_calculation_insights: analytics.get_roi_calculation_insights as unknown as ToolHandler,
  create_task: analytics.create_task as unknown as ToolHandler,
  list_tasks: analytics.list_tasks as unknown as ToolHandler,
  log_activity: analytics.log_activity as unknown as ToolHandler,
  schedule_followup: analytics.schedule_followup as unknown as ToolHandler,
  get_conversion_rate: analytics.get_conversion_rate as unknown as ToolHandler,
  get_revenue_forecast: analytics.get_revenue_forecast as unknown as ToolHandler,
  get_stale_leads: analytics.get_stale_leads as unknown as ToolHandler,
  get_top_performers: analytics.get_top_performers as unknown as ToolHandler,

  // Bulk Operations
  bulk_update_lead_status: bulk.bulk_update_lead_status as unknown as ToolHandler,
  bulk_assign_leads: bulk.bulk_assign_leads as unknown as ToolHandler,

  // Messaging Drafts
  draft_email: messaging.draft_email as unknown as ToolHandler,
  draft_sms: messaging.draft_sms as unknown as ToolHandler,

  // ROI
  run_roi_calculation: roi.run_roi_calculation as unknown as ToolHandler,

  // Partnership extensions
  create_partnership: partnerships.create_partnership as unknown as ToolHandler,
  log_partner_interaction: partnerships.log_partner_interaction as unknown as ToolHandler,

  // Navigation (client-side action)
  navigate: navigation.navigate as unknown as ToolHandler,

  // UI client actions (client-side)
  ui_set_filter: ui.ui_set_filter as unknown as ToolHandler,
  ui_search: ui.ui_search as unknown as ToolHandler,
  ui_open_new: ui.ui_open_new as unknown as ToolHandler,
  ui_open_edit: ui.ui_open_edit as unknown as ToolHandler,
  ui_open_view: ui.ui_open_view as unknown as ToolHandler,
};

export async function executeTool(
  name: string,
  params: Record<string, unknown>,
  userId: string,
  cookies: string
): Promise<unknown> {
  const handler = registry[name];
  if (!handler) {
    return { error: `Unknown tool: ${name}` };
  }

  try {
    if (CREATE_TOOLS.has(name)) {
      // Create tools need userId as second arg, cookies as third
      return await handler(params, userId, cookies);
    }
    // Read/update tools need cookies as second arg
    return await handler(params, cookies);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tool execution failed';
    console.error(`Tool ${name} error:`, error);
    return { error: message };
  }
}
