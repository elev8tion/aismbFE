import { ncbRead, ncbCreate, ncbUpdate, ncbReadOne } from '../ncbClient';

interface Lead {
  id: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  status: string;
  source?: string;
  notes?: string;
  created_at?: string;
}

export async function list_leads(params: { status?: string; limit?: number }, cookies: string) {
  const filters: Record<string, string> = {};
  if (params.status) filters.status = params.status;
  const result = await ncbRead<Lead>('leads', cookies, filters);
  const leads = result.data || [];
  const limited = leads.slice(0, params.limit || 20);
  return { leads: limited.map(l => ({ id: l.id, name: l.name, email: l.email, company: l.company, status: l.status })), total: leads.length };
}

export async function search_leads(params: { query: string }, cookies: string) {
  const result = await ncbRead<Lead>('leads', cookies);
  const q = params.query.toLowerCase();
  const matches = (result.data || []).filter(l =>
    l.name?.toLowerCase().includes(q) ||
    l.email?.toLowerCase().includes(q) ||
    l.company?.toLowerCase().includes(q)
  );
  return { leads: matches.map(l => ({ id: l.id, name: l.name, email: l.email, company: l.company, status: l.status })), total: matches.length };
}

export async function count_leads(_params: Record<string, never>, cookies: string) {
  const result = await ncbRead<Lead>('leads', cookies);
  const leads = result.data || [];
  const counts: Record<string, number> = {};
  for (const lead of leads) {
    const status = lead.status || 'unknown';
    counts[status] = (counts[status] || 0) + 1;
  }
  return { total: leads.length, by_status: counts };
}

export async function create_lead(params: { name: string; email?: string; company?: string; phone?: string; source?: string; notes?: string }, userId: string, cookies: string) {
  const result = await ncbCreate<Lead>('leads', { ...params, status: 'new' }, userId, cookies);
  return { success: true, lead: result };
}

export async function update_lead_status(params: { lead_id: string; status: string }, cookies: string) {
  const result = await ncbUpdate<Lead>('leads', params.lead_id, { status: params.status }, cookies);
  return { success: true, lead: result };
}

export async function score_lead(params: { lead_id: string }, cookies: string) {
  const result = await ncbReadOne<Lead>('leads', params.lead_id, cookies);
  const lead = result.data;
  // Simple scoring based on available data
  let score = 20;
  if (lead.email) score += 15;
  if (lead.company) score += 15;
  if (lead.phone) score += 10;
  if (lead.status === 'qualified') score += 20;
  if (lead.status === 'proposal') score += 30;
  const tier = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
  return { lead_id: params.lead_id, score, tier, name: lead.name };
}

export async function get_lead_summary(_params: Record<string, never>, cookies: string) {
  const result = await ncbRead<Lead>('leads', cookies);
  const leads = result.data || [];
  const counts: Record<string, number> = {};
  for (const lead of leads) {
    const status = lead.status || 'unknown';
    counts[status] = (counts[status] || 0) + 1;
  }
  const recent = leads
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 5)
    .map(l => ({ name: l.name, status: l.status, created_at: l.created_at }));
  return { total: leads.length, by_status: counts, recent_leads: recent };
}
