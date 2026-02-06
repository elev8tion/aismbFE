'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, EmailIcon, PhoneIcon, EditIcon } from '@/components/icons';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { useVoiceAgentActions } from '@/contexts/VoiceAgentActionsContext';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_id?: number;
  title?: string;
  role?: string;
  decision_maker: number;
  created_at?: string;
  // joined from mock
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

  const emptyForm = { first_name: '', last_name: '', email: '', phone: '', role: '', decision_maker: 0 };
  const [form, setForm] = useState(emptyForm);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/data/read/contacts', { credentials: 'include' });
      const data: { data?: Contact[] } = await res.json();
      if (data.data && data.data.length > 0) { setContacts(data.data); }
      else { setContacts(MOCK_CONTACTS); }
    } catch { setContacts(MOCK_CONTACTS); }
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
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
           c.email.toLowerCase().includes(q) ||
           (c.company_name || '').toLowerCase().includes(q);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/data/create/contacts', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      const res = await fetch(`/api/data/update/contacts?id=${editContact.id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
                      <td className="text-white/80">{contact.company_name || '—'}</td>
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
    </DashboardLayout>
  );
}

const MOCK_CONTACTS: Contact[] = [
  { id: '1', first_name: 'John', last_name: 'Smith', email: 'john@abcplumbing.com', phone: '(555) 123-4567', company_name: 'ABC Plumbing LLC', role: 'Owner', decision_maker: 1 },
  { id: '2', first_name: 'Maria', last_name: 'Garcia', email: 'maria@xyzproperty.com', phone: '(555) 234-5678', company_name: 'XYZ Property Management', role: 'Operations Manager', decision_maker: 1 },
  { id: '3', first_name: 'Robert', last_name: 'Johnson', email: 'robert@smithconstruction.com', phone: '(555) 345-6789', company_name: 'Smith & Sons Construction', role: 'CEO', decision_maker: 1 },
  { id: '4', first_name: 'Sarah', last_name: 'Williams', email: 'sarah@xyzproperty.com', company_name: 'XYZ Property Management', role: 'IT Manager', decision_maker: 0 },
  { id: '5', first_name: 'David', last_name: 'Brown', email: 'david@quickfixhvac.com', phone: '(555) 456-7890', company_name: 'Quick Fix HVAC', role: 'Owner', decision_maker: 1 },
];
