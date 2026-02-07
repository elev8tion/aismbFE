import { ncbRead, ncbUpdate, ncbCreate } from '../ncbClient';

interface Partnership {
  id: string;
  name: string;
  phase?: string;
  health_score?: number;
  partner_type?: string;
  created_at?: string;
}

export async function list_partnerships(params: { phase?: string }, cookies: string) {
  const filters: Record<string, string> = {};
  if (params.phase) filters.phase = params.phase;
  const result = await ncbRead<Partnership>('partnerships', cookies, filters);
  return { partnerships: result.data || [], total: (result.data || []).length };
}

export async function get_partnership_summary(_params: Record<string, never>, cookies: string) {
  const result = await ncbRead<Partnership>('partnerships', cookies);
  const partnerships = result.data || [];

  const byPhase: Record<string, number> = {};
  let totalHealth = 0;
  let healthCount = 0;

  for (const p of partnerships) {
    const phase = p.phase || 'unknown';
    byPhase[phase] = (byPhase[phase] || 0) + 1;
    if (p.health_score != null) {
      totalHealth += p.health_score;
      healthCount++;
    }
  }

  return {
    total: partnerships.length,
    by_phase: byPhase,
    avg_health_score: healthCount > 0 ? Math.round(totalHealth / healthCount) : null,
  };
}

export async function update_partnership_phase(params: { partnership_id: string; phase: string }, cookies: string) {
  const result = await ncbUpdate<Partnership>('partnerships', params.partnership_id, { phase: params.phase }, cookies);
  return { success: true, partnership: result };
}

export async function update_health_score(params: { partnership_id: string; health_score: number }, cookies: string) {
  const result = await ncbUpdate<Partnership>('partnerships', params.partnership_id, { health_score: params.health_score }, cookies);
  return { success: true, partnership: result };
}

export async function create_partnership(
  params: { name: string; partner_type?: string; phase?: string; contact_name?: string; contact_email?: string },
  userId: string,
  cookies: string
) {
  const result = await ncbCreate<Partnership>('partnerships', {
    name: params.name,
    partner_type: params.partner_type || 'referral',
    phase: params.phase || 'prospecting',
    contact_name: params.contact_name || null,
    contact_email: params.contact_email || null,
    health_score: 50,
  }, userId, cookies);
  return { success: true, partnership: result };
}

export async function log_partner_interaction(
  params: { partnership_id: string; type: string; description: string },
  userId: string,
  cookies: string
) {
  const result = await ncbCreate('activities', {
    type: params.type,
    description: params.description,
    partnership_id: params.partnership_id,
  }, userId, cookies);
  return { success: true, activity: result };
}
