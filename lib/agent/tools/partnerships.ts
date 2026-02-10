import { ncbRead, ncbUpdate, ncbCreate, type NCBEnv } from '../ncbClient';

interface Partnership {
  id: string;
  company_id: string;
  opportunity_id: string;
  tier: string;
  status?: string;
  current_phase?: string;
  satisfaction_score?: number;
  engagement_level?: string;
  systems_delivered?: number;
  total_systems?: number;
  monthly_revenue?: number;
  start_date?: string;
  target_end_date?: string;
  customer_email?: string;
  notes?: string;
  created_at?: string;
}

// Valid phases: discover → co-create → deploy → independent
const VALID_PHASES = ['discover', 'co-create', 'deploy', 'independent'];

export async function list_partnerships(params: { phase?: string; status?: string }, cookies: string, env: NCBEnv) {
  const filters: Record<string, string> = {};
  if (params.phase) filters.current_phase = params.phase;
  if (params.status) filters.status = params.status;
  const result = await ncbRead<Partnership>(env, 'partnerships', cookies, filters);
  return { partnerships: result.data || [], total: (result.data || []).length };
}

export async function get_partnership_summary(_params: Record<string, never>, cookies: string, env: NCBEnv) {
  const result = await ncbRead<Partnership>(env, 'partnerships', cookies);
  const partnerships = result.data || [];

  const byPhase: Record<string, number> = {};
  let totalScore = 0;
  let scoreCount = 0;

  for (const p of partnerships) {
    const phase = p.current_phase || 'unknown';
    byPhase[phase] = (byPhase[phase] || 0) + 1;
    if (p.satisfaction_score != null) {
      totalScore += Number(p.satisfaction_score);
      scoreCount++;
    }
  }

  return {
    total: partnerships.length,
    by_phase: byPhase,
    valid_phases: VALID_PHASES,
    avg_satisfaction_score: scoreCount > 0 ? Math.round(totalScore / scoreCount) : null,
  };
}

export async function update_partnership_phase(params: { partnership_id: string; phase: string }, cookies: string, env: NCBEnv) {
  if (!VALID_PHASES.includes(params.phase)) {
    return { success: false, error: `Invalid phase. Must be one of: ${VALID_PHASES.join(', ')}` };
  }
  const result = await ncbUpdate<Partnership>(env, 'partnerships', params.partnership_id, { current_phase: params.phase }, cookies);
  return { success: true, partnership: result };
}

export async function update_satisfaction_score(params: { partnership_id: string; score: number }, cookies: string, env: NCBEnv) {
  const result = await ncbUpdate<Partnership>(env, 'partnerships', params.partnership_id, { satisfaction_score: params.score }, cookies);
  return { success: true, partnership: result };
}

export async function create_partnership(
  params: { company_id: string; opportunity_id: string; tier: string; phase?: string; customer_email?: string },
  userId: string,
  cookies: string,
  env: NCBEnv
) {
  const today = new Date().toISOString().split('T')[0];
  const result = await ncbCreate<Partnership>(env, 'partnerships', {
    company_id: params.company_id,
    opportunity_id: params.opportunity_id,
    tier: params.tier || 'foundation',
    status: 'onboarding',
    current_phase: params.phase || 'discover',
    satisfaction_score: 50,
    start_date: today,
    target_end_date: today, // Will be updated later
    customer_email: params.customer_email || null,
  }, userId, cookies);
  return { success: true, partnership: result };
}

export async function log_partner_interaction(
  params: { partnership_id: string; type: string; subject: string; description?: string },
  userId: string,
  cookies: string,
  env: NCBEnv
) {
  const result = await ncbCreate(env, 'activities', {
    type: params.type,
    subject: params.subject,
    description: params.description || null,
    partnership_id: params.partnership_id,
  }, userId, cookies);
  return { success: true, activity: result };
}
