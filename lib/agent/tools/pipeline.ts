import { ncbRead, ncbCreate, ncbUpdate } from '../ncbClient';

interface Opportunity {
  id: string;
  name: string;
  tier: string;
  stage: string;
  setup_fee: number;
  monthly_fee?: number;
  total_contract_value?: number;
  company_id?: string;
  primary_contact_id?: string;
  expected_close_date?: string;
  probability?: number;
  created_at?: string;
}

// Valid stages: new-lead → contacted → discovery-call → proposal-sent → negotiation → closed-won/closed-lost
const VALID_STAGES = ['new-lead', 'contacted', 'discovery-call', 'proposal-sent', 'negotiation', 'closed-won', 'closed-lost'];

export async function list_opportunities(params: { stage?: string }, cookies: string) {
  const filters: Record<string, string> = {};
  if (params.stage) filters.stage = params.stage;
  const result = await ncbRead<Opportunity>('opportunities', cookies, filters);
  return {
    opportunities: (result.data || []).map(o => ({
      ...o,
      total_contract_value: Number(o.total_contract_value) || 0,
      setup_fee: Number(o.setup_fee) || 0,
      monthly_fee: Number(o.monthly_fee) || 0,
    })),
    total: (result.data || []).length,
  };
}

export async function get_pipeline_summary(_params: Record<string, never>, cookies: string) {
  const result = await ncbRead<Opportunity>('opportunities', cookies);
  const opps = result.data || [];

  const byStage: Record<string, { count: number; value: number }> = {};
  let totalValue = 0;

  for (const opp of opps) {
    const stage = opp.stage || 'unknown';
    const value = Number(opp.total_contract_value) || 0;
    if (!byStage[stage]) byStage[stage] = { count: 0, value: 0 };
    byStage[stage].count++;
    byStage[stage].value += value;
    totalValue += value;
  }

  return { total_opportunities: opps.length, total_pipeline_value: totalValue, by_stage: byStage, valid_stages: VALID_STAGES };
}

export async function create_opportunity(
  params: { name: string; tier: string; setup_fee: number; monthly_fee?: number; stage?: string; company_id?: string; primary_contact_id?: string; expected_close_date?: string },
  userId: string,
  cookies: string
) {
  const result = await ncbCreate<Opportunity>('opportunities', {
    name: params.name,
    tier: params.tier || 'foundation',
    setup_fee: params.setup_fee,
    monthly_fee: params.monthly_fee || null,
    stage: params.stage || 'new-lead',
    company_id: params.company_id || null,
    primary_contact_id: params.primary_contact_id || null,
    expected_close_date: params.expected_close_date || null,
  }, userId, cookies);
  return { success: true, opportunity: result };
}

export async function move_deal(params: { opportunity_id: string; stage: string }, cookies: string) {
  if (!VALID_STAGES.includes(params.stage)) {
    return { success: false, error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}` };
  }
  const result = await ncbUpdate<Opportunity>('opportunities', params.opportunity_id, { stage: params.stage }, cookies);
  return { success: true, opportunity: result };
}
