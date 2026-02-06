import { ncbRead, ncbReadOne, ncbCreate } from '../ncbClient';

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company_id?: string;
  title?: string;
  created_at?: string;
}

interface Company {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  size?: string;
  created_at?: string;
}

export async function search_contacts(params: { query: string }, cookies: string) {
  const result = await ncbRead<Contact>('contacts', cookies);
  const q = params.query.toLowerCase();
  const matches = (result.data || []).filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q)
  );
  return { contacts: matches, total: matches.length };
}

export async function get_contact(params: { contact_id: string }, cookies: string) {
  const result = await ncbReadOne<Contact>('contacts', params.contact_id, cookies);
  return { contact: result.data };
}

export async function create_contact(
  params: { name: string; email?: string; phone?: string; company_id?: string; title?: string },
  userId: string,
  cookies: string
) {
  const result = await ncbCreate<Contact>('contacts', params, userId, cookies);
  return { success: true, contact: result };
}

export async function search_companies(params: { query: string }, cookies: string) {
  const result = await ncbRead<Company>('companies', cookies);
  const q = params.query.toLowerCase();
  const matches = (result.data || []).filter(c => c.name?.toLowerCase().includes(q));
  return { companies: matches, total: matches.length };
}

export async function create_company(
  params: { name: string; industry?: string; website?: string; size?: string },
  userId: string,
  cookies: string
) {
  const result = await ncbCreate<Company>('companies', params, userId, cookies);
  return { success: true, company: result };
}

export async function get_company_contacts(params: { company_id: string }, cookies: string) {
  const result = await ncbRead<Contact>('contacts', cookies);
  const matches = (result.data || []).filter(c => c.company_id === params.company_id);
  return { contacts: matches, total: matches.length };
}
