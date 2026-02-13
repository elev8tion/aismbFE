'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, EmailIcon, PhoneIcon, EditIcon } from '@/components/icons';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { useVoiceAgentActions } from '@/contexts/VoiceAgentActionsContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { Contact as BaseContact } from '@kre8tion/shared-types';

// Extended with joined fields
interface Contact extends BaseContact {
  company_name?: string;
}

const ROLES = ['Owner', 'CEO', 'Operations Manager', 'IT Manager', 'Office Manager', 'CFO', 'Other'];

export default function ContactsPage() {
  const { t } = useTranslations();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const emptyForm = { first_name: '', last_name: '', email: '', phone: '', role: '', decision_maker: 0, company_id: '' };
  const [form, setForm] = useState(emptyForm);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [companyMap, setCompanyMap] = useState<Record<string, string>>({});

  const fetchContacts = useCallback(async () => {
    try {
      const [contactsRes, companiesRes] = await Promise.all([
        fetch('/api/data/read/contacts', { credentials: 'include' }),
        fetch('/api/data/read/companies', { credentials: 'include' }),
      ]);
      const [contactsData, companiesData]: any[] = await Promise.all([
        contactsRes.json(),
        companiesRes.json(),
      ]);

      // Build company map
      const compList = companiesData.data || [];
      setCompanies(compList);
      const map: Record<string, string> = {};
      compList.forEach((c: any) => { map[String(c.id)] = c.name; });
      setCompanyMap(map);

      setContacts(contactsData.data || []);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
      setContacts([]);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // Voice actions
  const { subscribe } = useVoiceAgentActions();
  useEffect(() => {
    const unsub = subscribe((action) => {
      if (!action || action.type !== 'ui_action' || action.scope !== 'contacts') return;
      const a = action.action;
      const payload = (action.payload || {}) as any;
      if (a === 'search' && typeof payload.query === 'string') {
        setSearch(payload.query);
      } else if (a === 'open_new') {
        setForm(emptyForm);
        setShowCreate(true);
      } else if (a === 'open_edit') {
        const { id, query } = payload as { id?: string; query?: string };
        let match: Contact | undefined;
        if (id) match = contacts.find(c => String(c.id) === String(id));
        if (!match && query) {
          const q = String(query).toLowerCase();
          match = contacts.find(c => (
            `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.company_name || '').toLowerCase().includes(q)
          ));
        }
        if (match) openEdit(match);
      }
    });
    return () => { unsub(); };
  }, [subscribe, contacts]);

  const filtered = contacts.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    const resolvedCompany = (c.company_id ? companyMap[String(c.company_id)] : null) || c.company_name || '';
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
           c.email.toLowerCase().includes(q) ||
           resolvedCompany.toLowerCase().includes(q);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (payload.company_id) { payload.company_id = Number(payload.company_id); }
      else { delete payload.company_id; }
      const res = await fetch('/api/data/create/contacts', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) { setShowCreate(false); setForm(emptyForm); fetchContacts(); }
    } catch (err) { console.error('Failed to create contact:', err); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContact) return;
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (payload.company_id) { payload.company_id = Number(payload.company_id); }
      else { delete payload.company_id; }
      const res = await fetch(`/api/data/update/contacts?id=${editContact.id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) { setEditContact(null); fetchContacts(); }
    } catch (err) { console.error('Failed to update contact:', err); }
    finally { setSaving(false); }
  };

  const openEdit = (contact: Contact) => {
    setForm({
      first_name: contact.first_name, last_name: contact.last_name,
      email: contact.email, phone: contact.phone || '',
      role: contact.role || '', decision_maker: contact.decision_maker,
      company_id: contact.company_id ? String(contact.company_id) : '',
    });
    setEditContact(contact);
  };

  const renderForm = (onSubmit: (e: React.FormEvent) => void) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">{t.common.firstName} *</label>
          <input className="input-glass w-full" required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1">{t.common.lastName} *</label>
          <input className="input-glass w-full" required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="block text-sm text-white/60 mb-1">{t.common.email} *</label>
        <input type="email" className="input-glass w-full" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm text-white/60 mb-1">{t.contacts.company}</label>
        <select className="select-glass w-full" value={form.company_id} onChange={e => setForm({ ...form, company_id: e.target.value })}>
          <option value="">— Select Company —</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">{t.common.phone}</label>
          <input className="input-glass w-full" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1">{t.contacts.role}</label>
          <select className="select-glass w-full" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="">{t.common.selectRole}</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={form.decision_maker === 1} onChange={e => setForm({ ...form, decision_maker: e.target.checked ? 1 : 0 })} className="w-5 h-5 rounded" />
        <span className="text-sm text-white/80">{t.contacts.decisionMaker}</span>
      </label>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => { setShowCreate(false); setEditContact(null); }} className="btn-secondary">{t.common.cancel}</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? t.common.creating : (editContact ? t.common.save : t.contacts.addContact)}</button>
      </div>
    </form>
  );

  return (
    <DashboardLayout>
      <ErrorBoundary>
      <div className="page-content">
        <PageHeader
          title={t.nav.contacts}
          subtitle={<>{filtered.length} {t.contacts.contactsCount}</>}
          action={
            <button onClick={() => { setForm(emptyForm); setShowCreate(true); }} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
              <PlusIcon className="w-5 h-5" />
              {t.contacts.addContact}
            </button>
          }
        />

        <div className="mb-[var(--space-gap)]">
          <input type="text" placeholder={t.common.search} value={search} onChange={e => setSearch(e.target.value)} className="input-glass w-full md:w-64" />
        </div>

        {loading ? (
          <div className="card p-12 text-center"><p className="text-white/60">{t.common.loading}</p></div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center"><p className="text-white/60">{t.common.noData}</p></div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-glass min-w-[600px]">
                <thead>
                  <tr>
                    <th>{t.contacts.name}</th>
                    <th>{t.contacts.company}</th>
                    <th>{t.contacts.role}</th>
                    <th>{t.contacts.decisionMaker}</th>
                    <th>{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contact) => (
                    <tr key={contact.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-electricBlue/20 flex items-center justify-center">
                            <span className="text-primary-electricBlue font-medium">
                              {contact.first_name[0]}{contact.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white">{contact.first_name} {contact.last_name}</p>
                            <p className="text-sm text-white/50">{contact.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-white/80">{(contact.company_id ? companyMap[String(contact.company_id)] : null) || contact.company_name || '—'}</td>
                      <td className="text-white/80">{contact.role || '—'}</td>
                      <td>
                        {contact.decision_maker ? (
                          <span className="tag tag-success">{t.contacts.yes}</span>
                        ) : (
                          <span className="text-white/40">{t.contacts.no}</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <a href={`mailto:${contact.email}`} className="btn-ghost p-2" title={t.common.email}><EmailIcon className="w-4 h-4" /></a>
                          {contact.phone && (
                            <a href={`tel:${contact.phone}`} className="btn-ghost p-2" title={t.common.phone}><PhoneIcon className="w-4 h-4" /></a>
                          )}
                          <button onClick={() => openEdit(contact)} className="btn-ghost p-2" title={t.common.edit}><EditIcon className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t.contacts.addContact}>
        {renderForm(handleCreate)}
      </Modal>

      <Modal open={!!editContact} onClose={() => setEditContact(null)} title={`${t.common.edit} Contact`}>
        {renderForm(handleEdit)}
      </Modal>
      </ErrorBoundary>
    </DashboardLayout>
  );
}

