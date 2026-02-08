import { ncbRead, ncbReadOne, ncbCreate } from '../ncbClient';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_id: string;
  title?: string;
  role?: string;
  decision_maker?: number;
  engagement_score?: number;
  preferred_contact_method?: string;
  created_at?: string;
}

interface Company {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  employee_count?: string;
  ai_maturity_score?: number;
  city?: string;
  state?: string;
  created_at?: string;
}

export async function search_contacts(params: { query: string }, cookies: string) {
  const result = await ncbRead<Contact>('contacts', cookies);
  const q = params.query.toLowerCase();
  const matches = (result.data || []).filter(c =>
    c.first_name?.toLowerCase().includes(q) ||
    c.last_name?.toLowerCase().includes(q) ||
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q)
  );
  return {
    contacts: matches.map(c => ({
      ...c,
      full_name: `${c.first_name} ${c.last_name}`,
    })),
    total: matches.length,
  };
}

export async function get_contact(params: { contact_id: string }, cookies: string) {
  const result = await ncbReadOne<Contact>('contacts', params.contact_id, cookies);
  const c = result.data;
  return {
    contact: c ? { ...c, full_name: `${c.first_name} ${c.last_name}` } : null,
  };
}

export async function create_contact(
  params: { first_name: string; last_name: string; email: string; phone?: string; company_id: string; title?: string; role?: string; decision_maker?: number },
  userId: string,
  cookies: string
) {
  const result = await ncbCreate<Contact>('contacts', {
    first_name: params.first_name,
    last_name: params.last_name,
    email: params.email,
    phone: params.phone || null,
    company_id: params.company_id,
    title: params.title || null,
    role: params.role || null,
    decision_maker: params.decision_maker ?? 0,
  }, userId, cookies);
  return { success: true, contact: result };
}

export async function search_companies(params: { query: string }, cookies: string) {
  const result = await ncbRead<Company>('companies', cookies);
  const q = params.query.toLowerCase();
  const matches = (result.data || []).filter(c => c.name?.toLowerCase().includes(q));
  return { companies: matches, total: matches.length };
}

export async function create_company(
  params: { name: string; industry: string; employee_count: string; website?: string; city?: string; state?: string },
  userId: string,
  cookies: string
) {
  const result = await ncbCreate<Company>('companies', {
    name: params.name,
    industry: params.industry,
    employee_count: params.employee_count,
    website: params.website || null,
    city: params.city || null,
    state: params.state || null,
  }, userId, cookies);
  return { success: true, company: result };
}

export async function get_company_contacts(params: { company_id: string }, cookies: string) {
  const result = await ncbRead<Contact>('contacts', cookies);
  const matches = (result.data || []).filter(c => String(c.company_id) === params.company_id);
  return {
    contacts: matches.map(c => ({
      ...c,
      full_name: `${c.first_name} ${c.last_name}`,
    })),
    total: matches.length,
  };
}
