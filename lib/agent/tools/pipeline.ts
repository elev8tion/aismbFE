import { ncbRead, ncbCreate, ncbUpdate } from '../ncbClient';

interface Opportunity {
  id: string;
  name: string;
  value: number;
  stage: string;
  company_id?: string;
  contact_id?: string;
  created_at?: string;
}

export async function list_opportunities(params: { stage?: string }, cookies: string) {
  const filters: Record<string, string> = {};
  if (params.stage) filters.stage = params.stage;
  const result = await ncbRead<Opportunity>('opportunities', cookies, filters);
  return { opportunities: result.data || [], total: (result.data || []).length };
}

export async function get_pipeline_summary(_params: Record<string, never>, cookies: string) {
  const result = await ncbRead<Opportunity>('opportunities', cookies);
  const opps = result.data || [];

  const byStage: Record<string, { count: number; value: number }> = {};
  let totalValue = 0;

  for (const opp of opps) {
    const stage = opp.stage || 'unknown';
    if (!byStage[stage]) byStage[stage] = { count: 0, value: 0 };
    byStage[stage].count++;
    byStage[stage].value += opp.value || 0;
    totalValue += opp.value || 0;
  }

  return { total_opportunities: opps.length, total_pipeline_value: totalValue, by_stage: byStage };
}

export async function create_opportunity(
  params: { name: string; value: number; stage?: string; company_id?: string; contact_id?: string },
  userId: string,
  cookies: string
) {
  const result = await ncbCreate<Opportunity>('opportunities', {
    name: params.name,
    value: params.value,
    stage: params.stage || 'discovery',
    company_id: params.company_id || null,
    contact_id: params.contact_id || null,
  }, userId, cookies);
  return { success: true, opportunity: result };
}

export async function move_deal(params: { opportunity_id: string; stage: string }, cookies: string) {
  const result = await ncbUpdate<Opportunity>('opportunities', params.opportunity_id, { stage: params.stage }, cookies);
  return { success: true, opportunity: result };
}
