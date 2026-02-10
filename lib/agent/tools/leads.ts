import { ncbRead, ncbCreate, ncbUpdate, ncbReadOne, type NCBEnv } from '../ncbClient';

interface Lead {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  company_name?: string;
  source: string;
  source_detail?: string;
  industry?: string;
  employee_count?: string;
  status: string;
  lead_score?: number;
  created_at?: string;
  updated_at?: string;
}

function leadName(l: Lead): string {
  return `${l.first_name || ''} ${l.last_name || ''}`.trim() || l.email;
}

export async function list_leads(params: { status?: string; limit?: number }, cookies: string, env: NCBEnv) {
  const filters: Record<string, string> = {};
  if (params.status) filters.status = params.status;
  const result = await ncbRead<Lead>(env, 'leads', cookies, filters);
  const leads = result.data || [];
  const limited = leads.slice(0, params.limit || 20);
  return {
    leads: limited.map(l => ({ id: l.id, name: leadName(l), email: l.email, company: l.company_name, status: l.status, score: l.lead_score })),
    total: leads.length,
  };
}

export async function search_leads(params: { query: string }, cookies: string, env: NCBEnv) {
  const result = await ncbRead<Lead>(env, 'leads', cookies);
  const q = params.query.toLowerCase();
  const matches = (result.data || []).filter(l =>
    l.first_name?.toLowerCase().includes(q) ||
    l.last_name?.toLowerCase().includes(q) ||
    leadName(l).toLowerCase().includes(q) ||
    l.email?.toLowerCase().includes(q) ||
    l.company_name?.toLowerCase().includes(q)
  );
  return {
    leads: matches.map(l => ({ id: l.id, name: leadName(l), email: l.email, company: l.company_name, status: l.status, score: l.lead_score })),
    total: matches.length,
  };
}

export async function count_leads(_params: Record<string, never>, cookies: string, env: NCBEnv) {
  const result = await ncbRead<Lead>(env, 'leads', cookies);
  const leads = result.data || [];
  const counts: Record<string, number> = {};
  for (const lead of leads) {
    const status = lead.status || 'unknown';
    counts[status] = (counts[status] || 0) + 1;
  }
  return { total: leads.length, by_status: counts };
}

export async function create_lead(
  params: { email: string; first_name?: string; last_name?: string; company_name?: string; phone?: string; source: string; industry?: string; employee_count?: string },
  userId: string,
  cookies: string,
  env: NCBEnv
) {
  const result = await ncbCreate<Lead>(env, 'leads', {
    email: params.email,
    first_name: params.first_name || null,
    last_name: params.last_name || null,
    company_name: params.company_name || null,
    phone: params.phone || null,
    source: params.source || 'other',
    industry: params.industry || null,
    employee_count: params.employee_count || null,
    status: 'new',
    lead_score: 0,
  }, userId, cookies);
  return { success: true, lead: result };
}

export async function update_lead_status(params: { lead_id: string; status: string }, cookies: string, env: NCBEnv) {
  const result = await ncbUpdate<Lead>(env, 'leads', params.lead_id, { status: params.status }, cookies);
  return { success: true, lead: result };
}

export async function score_lead(params: { lead_id: string }, cookies: string, env: NCBEnv) {
  const result = await ncbReadOne<Lead>(env, 'leads', params.lead_id, cookies);
  const lead = result.data;
  // Simple scoring based on available data
  let score = 20;
  if (lead.email) score += 15;
  if (lead.company_name) score += 15;
  if (lead.phone) score += 10;
  if (lead.status === 'qualified') score += 20;
  if (lead.status === 'converted') score += 30;
  const tier = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
  return { lead_id: params.lead_id, score, tier, name: leadName(lead) };
}

export async function get_lead_summary(_params: Record<string, never>, cookies: string, env: NCBEnv) {
  const result = await ncbRead<Lead>(env, 'leads', cookies);
  const leads = result.data || [];
  const counts: Record<string, number> = {};
  for (const lead of leads) {
    const status = lead.status || 'unknown';
    counts[status] = (counts[status] || 0) + 1;
  }
  const recent = leads
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 5)
    .map(l => ({ name: leadName(l), status: l.status, created_at: l.created_at }));
  return { total: leads.length, by_status: counts, recent_leads: recent };
}
