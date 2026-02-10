import { ncbRead, ncbCreate, type NCBEnv } from '../ncbClient';

interface Lead { id: string; first_name?: string; last_name?: string; email?: string; status: string; created_at?: string; updated_at?: string; lead_score?: number }
interface Booking { id: string; status: string; booking_date: string; guest_name?: string; guest_email?: string }
interface Opportunity { id: string; stage: string; name?: string; setup_fee?: number; monthly_fee?: number; total_contract_value?: number }
interface Activity { id: string; type: string; subject: string; description?: string; created_at?: string; company_id?: string; contact_id?: string; opportunity_id?: string; partnership_id?: string }
interface VoiceSession { id: string; sentiment?: string; duration?: number; total_questions?: number; outcome?: string; topics?: string }
interface RoiCalculation { id: string; industry?: string; employee_count?: number; estimated_savings?: number; created_at?: string }

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export async function get_dashboard_stats(_params: Record<string, never>, cookies: string, env: NCBEnv) {
  const [leads, bookings, opps] = await Promise.all([
    ncbRead<Lead>(env, 'leads', cookies),
    ncbRead<Booking>(env, 'bookings', cookies),
    ncbRead<Opportunity>(env, 'opportunities', cookies),
  ]);

  const leadsData = leads.data || [];
  const bookingsData = bookings.data || [];
  const oppsData = opps.data || [];

  const pipelineValue = oppsData.reduce((sum, o) => sum + (Number(o.total_contract_value) || 0), 0);
  const today = todayStr();

  return {
    total_leads: leadsData.length,
    new_leads: leadsData.filter(l => l.status === 'new').length,
    total_bookings: bookingsData.length,
    todays_bookings: bookingsData.filter(b => b.booking_date === today).length,
    total_opportunities: oppsData.length,
    pipeline_value: pipelineValue,
  };
}

export async function get_daily_summary(_params: Record<string, never>, cookies: string, env: NCBEnv) {
  const today = todayStr();
  const [leads, bookings, activities] = await Promise.all([
    ncbRead<Lead>(env, 'leads', cookies),
    ncbRead<Booking>(env, 'bookings', cookies),
    ncbRead<Activity>(env, 'activities', cookies),
  ]);

  const todayLeads = (leads.data || []).filter(l => l.created_at?.startsWith(today));
  const todayBookings = (bookings.data || []).filter(b => b.booking_date === today);
  const todayActivities = (activities.data || []).filter(a => a.created_at?.startsWith(today));

  return {
    date: today,
    new_leads: todayLeads.length,
    bookings: todayBookings.length,
    activities: todayActivities.length,
    recent_activities: todayActivities.slice(0, 5).map(a => ({ type: a.type, subject: a.subject, description: a.description })),
  };
}

export async function get_recent_activities(params: { limit?: number }, cookies: string, env: NCBEnv) {
  const result = await ncbRead<Activity>(env, 'activities', cookies);
  const activities = (result.data || [])
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, params.limit || 10);
  return { activities };
}

export async function get_voice_session_insights(_params: Record<string, never>, cookies: string, env: NCBEnv) {
  const result = await ncbRead<VoiceSession>(env, 'voice_sessions', cookies);
  const sessions = result.data || [];

  const sentiments: Record<string, number> = {};
  const outcomes: Record<string, number> = {};
  let totalDuration = 0;
  let totalQuestions = 0;

  for (const s of sessions) {
    if (s.sentiment) sentiments[s.sentiment] = (sentiments[s.sentiment] || 0) + 1;
    if (s.outcome) outcomes[s.outcome] = (outcomes[s.outcome] || 0) + 1;
    totalDuration += s.duration || 0;
    totalQuestions += s.total_questions || 0;
  }

  return {
    total_sessions: sessions.length,
    avg_duration: sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0,
    total_questions: totalQuestions,
    sentiments,
    outcomes,
  };
}

export async function get_roi_calculation_insights(_params: Record<string, never>, cookies: string, env: NCBEnv) {
  const result = await ncbRead<RoiCalculation>(env, 'roi_calculations', cookies);
  const calcs = result.data || [];

  const industries: Record<string, number> = {};
  let totalSavings = 0;

  for (const c of calcs) {
    if (c.industry) industries[c.industry] = (industries[c.industry] || 0) + 1;
    totalSavings += c.estimated_savings || 0;
  }

  return {
    total_calculations: calcs.length,
    avg_estimated_savings: calcs.length > 0 ? Math.round(totalSavings / calcs.length) : 0,
    by_industry: industries,
  };
}

// ─── Activity Logging ──────────────────────────────────────────────────────

export async function log_activity(
  params: { type: string; subject: string; description?: string; company_id?: string; contact_id?: string; opportunity_id?: string; partnership_id?: string },
  userId: string,
  cookies: string,
  env: NCBEnv
) {
  const result = await ncbCreate(env, 'activities', {
    type: params.type,
    subject: params.subject,
    description: params.description || null,
    company_id: params.company_id || null,
    contact_id: params.contact_id || null,
    opportunity_id: params.opportunity_id || null,
    partnership_id: params.partnership_id || null,
  }, userId, cookies);
  return { success: true, activity: result };
}

export async function schedule_followup(
  params: { subject: string; description?: string; company_id?: string; contact_id?: string; partnership_id?: string },
  userId: string,
  cookies: string,
  env: NCBEnv
) {
  const result = await ncbCreate(env, 'activities', {
    type: 'followup',
    subject: params.subject,
    description: params.description || null,
    company_id: params.company_id || null,
    contact_id: params.contact_id || null,
    partnership_id: params.partnership_id || null,
  }, userId, cookies);
  return { success: true, followup: result };
}

// ─── Smart Queries ─────────────────────────────────────────────────────────

export async function get_conversion_rate(_params: Record<string, never>, cookies: string, env: NCBEnv) {
  const result = await ncbRead<Lead>(env, 'leads', cookies);
  const leads = result.data || [];
  const total = leads.length;
  const converted = leads.filter(l => l.status === 'converted').length;
  const rate = total > 0 ? Math.round((converted / total) * 100) : 0;
  return { total_leads: total, converted, conversion_rate_percent: rate };
}

export async function get_revenue_forecast(_params: Record<string, never>, cookies: string, env: NCBEnv) {
  const result = await ncbRead<Opportunity>(env, 'opportunities', cookies);
  const opps = result.data || [];

  const stageProbability: Record<string, number> = {
    'new-lead': 0.1,
    'contacted': 0.15,
    'discovery-call': 0.3,
    'proposal-sent': 0.5,
    'negotiation': 0.75,
    'closed-won': 1.0,
    'closed-lost': 0,
  };

  let weightedTotal = 0;
  let rawTotal = 0;
  const byStage: Record<string, { count: number; value: number; weighted: number }> = {};

  for (const o of opps) {
    const value = Number(o.total_contract_value) || 0;
    const prob = stageProbability[o.stage] ?? 0.3;
    const weighted = Math.round(value * prob);
    rawTotal += value;
    weightedTotal += weighted;

    if (!byStage[o.stage]) byStage[o.stage] = { count: 0, value: 0, weighted: 0 };
    byStage[o.stage].count++;
    byStage[o.stage].value += value;
    byStage[o.stage].weighted += weighted;
  }

  return { total_pipeline: rawTotal, weighted_forecast: weightedTotal, by_stage: byStage };
}

export async function get_stale_leads(params: { days_inactive?: number }, cookies: string, env: NCBEnv) {
  const days = params.days_inactive || 14;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  const result = await ncbRead<Lead>(env, 'leads', cookies);
  const leads = result.data || [];

  const stale = leads.filter(l => {
    if (l.status === 'converted' || l.status === 'disqualified') return false;
    const lastUpdate = l.updated_at || l.created_at || '';
    return lastUpdate < cutoffStr;
  });

  return {
    stale_leads: stale.slice(0, 25).map(l => ({
      id: l.id,
      name: `${l.first_name || ''} ${l.last_name || ''}`.trim(),
      status: l.status,
      last_activity: l.updated_at || l.created_at,
    })),
    total: stale.length,
    days_inactive: days,
  };
}

export async function get_top_opportunities(params: { limit?: number }, cookies: string, env: NCBEnv) {
  const limit = params.limit || 10;
  const result = await ncbRead<Opportunity>(env, 'opportunities', cookies);
  const opps = (result.data || [])
    .filter(o => o.stage !== 'closed-lost')
    .sort((a, b) => (Number(b.total_contract_value) || 0) - (Number(a.total_contract_value) || 0))
    .slice(0, limit);
  return {
    top: opps.map(o => ({
      id: o.id,
      name: o.name,
      value: Number(o.total_contract_value) || 0,
      stage: o.stage,
    })),
  };
}
