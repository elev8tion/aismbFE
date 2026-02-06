import { ncbRead, ncbCreate } from '../ncbClient';

interface Lead { id: string; status: string; created_at?: string }
interface Booking { id: string; status: string; date: string }
interface Opportunity { id: string; stage: string; value: number }
interface Activity { id: string; type: string; description: string; created_at?: string }
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
