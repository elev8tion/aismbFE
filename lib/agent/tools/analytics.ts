import { ncbRead, ncbCreate } from '../ncbClient';

interface Lead { id: string; name?: string; status: string; created_at?: string; updated_at?: string; value?: number; assigned_to?: string }
interface Booking { id: string; status: string; date: string }
interface Opportunity { id: string; stage: string; value: number; name?: string }
interface Activity { id: string; type: string; description: string; created_at?: string; lead_id?: string; contact_id?: string }
interface VoiceSession { id: string; sentiment?: string; duration?: number; total_questions?: number; outcome?: string; topics?: string }
interface RoiCalculation { id: string; industry?: string; employee_count?: number; estimated_savings?: number; created_at?: string }
interface Task { id: string; title: string; description?: string; status: string; due_date?: string; priority?: string }

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export async function get_dashboard_stats(_params: Record<string, never>, cookies: string) {
  const [leads, bookings, opps] = await Promise.all([
    ncbRead<Lead>('leads', cookies),
    ncbRead<Booking>('bookings', cookies),
    ncbRead<Opportunity>('opportunities', cookies),
  ]);

  const leadsData = leads.data || [];
  const bookingsData = bookings.data || [];
  const oppsData = opps.data || [];

  const pipelineValue = oppsData.reduce((sum, o) => sum + (o.value || 0), 0);
  const today = todayStr();

  return {
    total_leads: leadsData.length,
    new_leads: leadsData.filter(l => l.status === 'new').length,
    total_bookings: bookingsData.length,
    todays_bookings: bookingsData.filter(b => b.date === today).length,
    total_opportunities: oppsData.length,
    pipeline_value: pipelineValue,
  };
}

export async function get_daily_summary(_params: Record<string, never>, cookies: string) {
  const today = todayStr();
  const [leads, bookings, activities] = await Promise.all([
    ncbRead<Lead>('leads', cookies),
    ncbRead<Booking>('bookings', cookies),
    ncbRead<Activity>('activities', cookies),
  ]);

  const todayLeads = (leads.data || []).filter(l => l.created_at?.startsWith(today));
  const todayBookings = (bookings.data || []).filter(b => b.date === today);
  const todayActivities = (activities.data || []).filter(a => a.created_at?.startsWith(today));

  return {
    date: today,
    new_leads: todayLeads.length,
    bookings: todayBookings.length,
    activities: todayActivities.length,
    recent_activities: todayActivities.slice(0, 5).map(a => ({ type: a.type, description: a.description })),
  };
}

export async function get_recent_activities(params: { limit?: number }, cookies: string) {
  const result = await ncbRead<Activity>('activities', cookies);
  const activities = (result.data || [])
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, params.limit || 10);
  return { activities };
}

export async function get_voice_session_insights(_params: Record<string, never>, cookies: string) {
  const result = await ncbRead<VoiceSession>('voice_sessions', cookies);
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

export async function get_roi_calculation_insights(_params: Record<string, never>, cookies: string) {
  const result = await ncbRead<RoiCalculation>('roi_calculations', cookies);
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

export async function create_task(
  params: { title: string; description?: string; due_date?: string; priority?: string },
  userId: string,
  cookies: string
) {
  const result = await ncbCreate<Task>('tasks', {
    title: params.title,
    description: params.description || '',
    due_date: params.due_date || null,
    priority: params.priority || 'medium',
    status: 'pending',
  }, userId, cookies);
  return { success: true, task: result };
}

export async function list_tasks(params: { status?: string }, cookies: string) {
  const filters: Record<string, string> = {};
  if (params.status) filters.status = params.status;
  const result = await ncbRead<Task>('tasks', cookies, filters);
  return { tasks: result.data || [], total: (result.data || []).length };
}

// ─── Activity Logging ──────────────────────────────────────────────────────

export async function log_activity(
  params: { type: string; description: string; lead_id?: string; contact_id?: string },
  userId: string,
  cookies: string
) {
  const result = await ncbCreate('activities', {
    type: params.type,
    description: params.description,
    lead_id: params.lead_id || null,
    contact_id: params.contact_id || null,
  }, userId, cookies);
  return { success: true, activity: result };
}

export async function schedule_followup(
  params: { description: string; due_date: string; lead_id?: string; contact_id?: string },
  userId: string,
  cookies: string
) {
  const result = await ncbCreate('activities', {
    type: 'followup',
    description: params.description,
    lead_id: params.lead_id || null,
    contact_id: params.contact_id || null,
    due_date: params.due_date,
  }, userId, cookies);
  return { success: true, followup: result };
}

// ─── Smart Queries ─────────────────────────────────────────────────────────

export async function get_conversion_rate(_params: Record<string, never>, cookies: string) {
  const result = await ncbRead<Lead>('leads', cookies);
  const leads = result.data || [];
  const total = leads.length;
  const won = leads.filter(l => l.status === 'won').length;
  const rate = total > 0 ? Math.round((won / total) * 100) : 0;
  return { total_leads: total, won, conversion_rate_percent: rate };
}

export async function get_revenue_forecast(_params: Record<string, never>, cookies: string) {
  const result = await ncbRead<Opportunity>('opportunities', cookies);
  const opps = result.data || [];

  const stageProbability: Record<string, number> = {
    discovery: 0.2,
    proposal: 0.5,
    negotiation: 0.75,
    closed_won: 1.0,
    closed_lost: 0,
  };

  let weightedTotal = 0;
  let rawTotal = 0;
  const byStage: Record<string, { count: number; value: number; weighted: number }> = {};

  for (const o of opps) {
    const value = Number(o.value) || 0;
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

export async function get_stale_leads(params: { days_inactive?: number }, cookies: string) {
  const days = params.days_inactive || 14;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  const result = await ncbRead<Lead>('leads', cookies);
  const leads = result.data || [];

  const stale = leads.filter(l => {
    if (l.status === 'won' || l.status === 'lost') return false;
    const lastUpdate = l.updated_at || l.created_at || '';
    return lastUpdate < cutoffStr;
  });

  return {
    stale_leads: stale.slice(0, 25).map(l => ({ id: l.id, name: l.name, status: l.status, last_activity: l.updated_at || l.created_at })),
    total: stale.length,
    days_inactive: days,
  };
}

export async function get_top_performers(params: { metric?: string; limit?: number }, cookies: string) {
  const limit = params.limit || 10;
  const metric = params.metric || 'value';

  if (metric === 'value') {
    const result = await ncbRead<Opportunity>('opportunities', cookies);
    const opps = (result.data || [])
      .filter(o => o.stage !== 'closed_lost')
      .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
      .slice(0, limit);
    return { metric: 'pipeline_value', top: opps.map(o => ({ id: o.id, name: o.name, value: Number(o.value) || 0, stage: o.stage })) };
  }

  // Default: top leads by activity count
  const [leadsResult, activitiesResult] = await Promise.all([
    ncbRead<Lead>('leads', cookies),
    ncbRead<Activity>('activities', cookies),
  ]);

  const activityCount: Record<string, number> = {};
  for (const a of activitiesResult.data || []) {
    if (a.lead_id) activityCount[a.lead_id] = (activityCount[a.lead_id] || 0) + 1;
  }

  const leadsMap = new Map((leadsResult.data || []).map(l => [l.id, l]));
  const sorted = Object.entries(activityCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit);

  return {
    metric: 'activity_count',
    top: sorted.map(([id, count]) => {
      const lead = leadsMap.get(id);
      return { id, name: lead?.name, activity_count: count, status: lead?.status };
    }),
  };
}
