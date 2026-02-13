'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, EyeIcon, EditIcon, VoiceIcon, CalculatorIcon } from '@/components/icons';
import Link from 'next/link';
import { getLeadStatusClass } from '@/lib/utils/statusClasses';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterTabs } from '@/components/ui/FilterTabs';
import { ScoreBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { useVoiceAgentActions } from '@/contexts/VoiceAgentActionsContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Lead } from '@kre8tion/shared-types';

const INDUSTRIES = ['HVAC', 'Plumbing', 'Construction', 'Property Management', 'Electrical', 'Landscaping', 'Other'];
const SOURCES = ['voice-agent', 'roi-calculator', 'referral', 'website', 'social-media', 'cold-outreach', 'other'];

export default function LeadsPage() {
  const { t } = useTranslations();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = { email: '', first_name: '', last_name: '', phone: '', company_name: '', source: 'website', industry: '', lead_score: 0 };
  const [form, setForm] = useState(emptyForm);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/data/read/leads', { credentials: 'include' });
      const data: { data?: Lead[] } = await res.json();
      const sorted = (data.data || []).sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });
      setLeads(sorted);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Voice UI actions: respond to client_action events scoped to 'leads'
  const { subscribe } = useVoiceAgentActions();
  useEffect(() => {
    const unsub = subscribe((action) => {
      if (!action || action.type !== 'ui_action' || action.scope !== 'leads') return;
      const a = action.action;
      const payload = action.payload || {} as any;
      if (a === 'set_filter' && typeof payload.filter === 'string') {
        setFilter(payload.filter);
      } else if (a === 'search' && typeof payload.query === 'string') {
        setSearch(payload.query);
      } else if (a === 'open_new') {
        setForm(emptyForm);
        setShowCreate(true);
      } else if (a === 'open_edit') {
        const { id, query } = payload as { id?: string; query?: string };
        let match: Lead | undefined;
        if (id) {
          match = leads.find(l => String(l.id) === String(id));
        }
        if (!match && query) {
          const q = String(query).toLowerCase();
          match = leads.find(l => (
            `${l.first_name || ''} ${l.last_name || ''}`.toLowerCase().includes(q) ||
            l.email?.toLowerCase().includes(q) ||
            (l.company_name || '').toLowerCase().includes(q)
          ));
        }
        if (match) openEdit(match);
      } else if (a === 'open_view') {
        const { id, query } = payload as { id?: string; query?: string };
        let match: Lead | undefined;
        if (id) {
          match = leads.find(l => String(l.id) === String(id));
        }
        if (!match && query) {
          const q = String(query).toLowerCase();
          match = leads.find(l => (
            `${l.first_name || ''} ${l.last_name || ''}`.toLowerCase().includes(q) ||
            l.email?.toLowerCase().includes(q) ||
            (l.company_name || '').toLowerCase().includes(q)
          ));
        }
        if (match) setViewLead(match);
      }
    });
    return () => { unsub(); };
  }, [subscribe, leads]);

  const filtered = leads.filter(l => {
    if (filter !== 'all' && l.status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${l.first_name || ''} ${l.last_name || ''}`.toLowerCase();
    return name.includes(q) || l.email.toLowerCase().includes(q) || (l.company_name || '').toLowerCase().includes(q);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/data/create/leads', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm(emptyForm);
        fetchLeads();
      }
    } catch (err) { console.error('Failed to create lead:', err); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLead) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/data/update/leads?id=${editLead.id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setEditLead(null);
        fetchLeads();
      }
    } catch (err) { console.error('Failed to update lead:', err); }
    finally { setSaving(false); }
  };

  const openEdit = (lead: Lead) => {
    setForm({
      email: lead.email, first_name: lead.first_name || '', last_name: lead.last_name || '',
      phone: lead.phone || '', company_name: lead.company_name || '',
      source: lead.source, industry: lead.industry || '', lead_score: lead.lead_score,
    });
    setEditLead(lead);
  };

  const renderForm = (onSubmit: (e: React.FormEvent) => void) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">{t.common.firstName}</label>
          <input className="input-glass w-full" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1">{t.common.lastName}</label>
          <input className="input-glass w-full" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="block text-sm text-white/60 mb-1">{t.common.email} *</label>
        <input type="email" className="input-glass w-full" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">{t.common.phone}</label>
          <input className="input-glass w-full" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1">{t.common.companyName}</label>
          <input className="input-glass w-full" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">{t.leads.source}</label>
          <select className="select-glass w-full" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
            {SOURCES.map(s => <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1">{t.common.industry}</label>
          <select className="select-glass w-full" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}>
            <option value="">{t.common.selectIndustry}</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => { setShowCreate(false); setEditLead(null); }} className="btn-secondary">{t.common.cancel}</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? t.common.creating : (editLead ? t.common.save : t.leads.newLead)}</button>
      </div>
    </form>
  );

  return (
    <DashboardLayout>
      <ErrorBoundary>
      <div className="page-content">
        <PageHeader
          title={t.leads.title}
          subtitle={<>{filtered.length} {t.leads.totalLeads}</>}
          action={
            <button onClick={() => { setForm(emptyForm); setShowCreate(true); }} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
              <PlusIcon className="w-5 h-5" />
              {t.leads.newLead}
            </button>
          }
        />

        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-[var(--space-gap)]">
          <FilterTabs
            tabs={['all', 'new', 'contacted', 'qualified', 'converted'].map(f => ({
              key: f, label: f === 'all' ? t.leads.allLeads : f.charAt(0).toUpperCase() + f.slice(1),
            }))}
            activeTab={filter}
            onTabChange={setFilter}
          />
          <div className="hidden md:block flex-1" />
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
                    <th>{t.leads.source}</th>
                    <th>{t.leads.score}</th>
                    <th>{t.leads.status}</th>
                    <th>{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => (
                    <tr key={lead.id}>
                      <td>
                        <div>
                          <p className="font-medium text-white">{lead.first_name} {lead.last_name}</p>
                          <p className="text-sm text-white/50">{lead.email}</p>
                        </div>
                      </td>
                      <td className="text-white/80">{lead.company_name || '—'}</td>
                      <td>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="tag">{lead.source}</span>
                          {lead.voice_session_id && (
                            <Link href="/voice-sessions" className="tag tag-info text-xs flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <VoiceIcon className="w-3 h-3" /> Voice
                            </Link>
                          )}
                          {lead.roi_calculation_id && (
                            <Link href="/roi-calculations" className="tag tag-warning text-xs flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <CalculatorIcon className="w-3 h-3" /> ROI
                            </Link>
                          )}
                        </div>
                      </td>
                      <td><ScoreBar score={lead.lead_score} /></td>
                      <td><span className={`tag ${getLeadStatusClass(lead.status)}`}>{lead.status}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setViewLead(lead)} className="btn-ghost p-2" title={t.common.view}><EyeIcon className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(lead)} className="btn-ghost p-2" title={t.common.edit}><EditIcon className="w-4 h-4" /></button>
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

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t.leads.newLead}>
        {renderForm(handleCreate)}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editLead} onClose={() => setEditLead(null)} title={`${t.common.edit} Lead`}>
        {renderForm(handleEdit)}
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewLead} onClose={() => setViewLead(null)} title={`${viewLead?.first_name || ''} ${viewLead?.last_name || ''}`}>
        {viewLead && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.common.email}</p>
                <p className="text-sm text-white mt-1">{viewLead.email}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.common.phone}</p>
                <p className="text-sm text-white mt-1">{viewLead.phone || '—'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.common.companyName}</p>
                <p className="text-sm text-white mt-1">{viewLead.company_name || '—'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.common.industry}</p>
                <p className="text-sm text-white mt-1">{viewLead.industry || '—'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.leads.source}</p>
                <p className="text-sm text-white mt-1">{viewLead.source}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.leads.status}</p>
                <span className={`tag ${getLeadStatusClass(viewLead.status)}`}>{viewLead.status}</span>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-white/50 mb-1">{t.leads.score}</p>
              <ScoreBar score={viewLead.lead_score} />
            </div>
            {/* Source Links */}
            {(viewLead.voice_session_id || viewLead.roi_calculation_id) && (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50 mb-2">Source</p>
                <div className="flex flex-wrap gap-2">
                  {viewLead.voice_session_id && (
                    <Link href="/voice-sessions" className="tag tag-info text-xs flex items-center gap-1.5 hover:opacity-80">
                      <VoiceIcon className="w-3.5 h-3.5" /> Voice Session #{viewLead.voice_session_id}
                    </Link>
                  )}
                  {viewLead.roi_calculation_id && (
                    <Link href="/roi-calculations" className="tag tag-warning text-xs flex items-center gap-1.5 hover:opacity-80">
                      <CalculatorIcon className="w-3.5 h-3.5" /> ROI Calculation #{viewLead.roi_calculation_id}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
      </ErrorBoundary>
    </DashboardLayout>
  );
}

