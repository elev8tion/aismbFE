'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { PlusIcon, EditIcon, EyeIcon, EmailIcon, PhoneIcon } from '@/components/icons';
import { useVoiceAgentActions } from '@/contexts/VoiceAgentActionsContext';

interface Draft {
  id: string;
  type: 'email' | 'sms' | 'note';
  to_recipient: string | null;
  subject: string | null;
  body: string | null;
  status: 'draft' | 'sent' | 'archived';
  created_at?: string;
  updated_at?: string;
}

const emptyForm = { type: 'note' as Draft['type'], to_recipient: '', subject: '', body: '' };

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'email': return <EmailIcon className="w-4 h-4" />;
    case 'sms': return <PhoneIcon className="w-4 h-4" />;
    default: return <NoteIcon className="w-4 h-4" />;
  }
}

function getTypeClass(type: string) {
  switch (type) {
    case 'email': return 'tag-info';
    case 'sms': return 'tag-success';
    default: return 'tag-neutral';
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case 'draft': return 'tag-warning';
    case 'sent': return 'tag-success';
    case 'archived': return 'tag-neutral';
    default: return 'tag-neutral';
  }
}

export default function DraftsPage() {
  const { t } = useTranslations();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals
  const [viewDraft, setViewDraft] = useState<Draft | null>(null);
  const [editDraft, setEditDraft] = useState<Draft | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch('/api/data/read/drafts', { credentials: 'include' });
      if (res.ok) {
        const data: any = await res.json();
        setDrafts(Array.isArray(data) ? data : data.data || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  // Voice agent actions subscription
  const { subscribe } = useVoiceAgentActions();
  useEffect(() => {
    const unsub = subscribe((action) => {
      if (!action || action.type !== 'ui_action' || action.scope !== 'drafts') return;
      const a = action.action;
      const payload = (action.payload || {}) as Record<string, unknown>;
      if (a === 'set_filter' && typeof payload.filter === 'string') {
        setFilter(payload.filter);
      } else if (a === 'search' && typeof payload.query === 'string') {
        setSearch(payload.query);
      } else if (a === 'open_new') {
        setForm(emptyForm);
        setShowCreate(true);
      } else if (a === 'open_edit') {
        const { id, query } = payload as { id?: string; query?: string };
        let match: Draft | undefined;
        if (id) match = drafts.find(d => String(d.id) === String(id));
        if (!match && query) {
          const q = String(query).toLowerCase();
          match = drafts.find(d =>
            (d.to_recipient || '').toLowerCase().includes(q) ||
            (d.subject || '').toLowerCase().includes(q) ||
            (d.body || '').toLowerCase().includes(q)
          );
        }
        if (match) {
          setEditDraft(match);
          setForm({
            type: match.type,
            to_recipient: match.to_recipient || '',
            subject: match.subject || '',
            body: match.body || '',
          });
        }
      } else if (a === 'open_view') {
        const { id, query } = payload as { id?: string; query?: string };
        let match: Draft | undefined;
        if (id) match = drafts.find(d => String(d.id) === String(id));
        if (!match && query) {
          const q = String(query).toLowerCase();
          match = drafts.find(d =>
            (d.to_recipient || '').toLowerCase().includes(q) ||
            (d.subject || '').toLowerCase().includes(q) ||
            (d.body || '').toLowerCase().includes(q)
          );
        }
        if (match) setViewDraft(match);
      }
    });
    return unsub;
  }, [subscribe, drafts]);

  const filtered = drafts.filter(d => {
    if (filter !== 'all' && d.type !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.to_recipient || '').toLowerCase().includes(q) ||
      (d.subject || '').toLowerCase().includes(q) ||
      (d.body || '').toLowerCase().includes(q)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/data/create/drafts', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          to_recipient: form.to_recipient || null,
          subject: form.subject || null,
          body: form.body || null,
          status: 'draft',
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm(emptyForm);
        fetchDrafts();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDraft) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/data/update/drafts/${editDraft.id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          to_recipient: form.to_recipient || null,
          subject: form.subject || null,
          body: form.body || null,
        }),
      });
      if (res.ok) {
        setEditDraft(null);
        setForm(emptyForm);
        fetchDrafts();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/data/delete/drafts/${id}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) fetchDrafts();
    } catch { /* ignore */ }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { key: 'all', label: t.drafts.allDrafts },
    { key: 'email', label: t.drafts.emails },
    { key: 'sms', label: t.drafts.sms },
    { key: 'note', label: t.drafts.notes },
  ];

  const draftForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-white/60 mb-1">{t.drafts.type}</label>
        <select
          className="select-glass w-full"
          value={form.type}
          onChange={e => setForm({ ...form, type: e.target.value as Draft['type'] })}
        >
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="note">Note</option>
        </select>
      </div>
      {form.type !== 'note' && (
        <div>
          <label className="block text-sm text-white/60 mb-1">{t.drafts.toRecipient}</label>
          <input
            className="input-glass w-full"
            value={form.to_recipient}
            onChange={e => setForm({ ...form, to_recipient: e.target.value })}
            placeholder={form.type === 'email' ? 'email@example.com' : '+1 555-1234'}
          />
        </div>
      )}
      {form.type === 'email' && (
        <div>
          <label className="block text-sm text-white/60 mb-1">{t.drafts.subject}</label>
          <input
            className="input-glass w-full"
            value={form.subject}
            onChange={e => setForm({ ...form, subject: e.target.value })}
          />
        </div>
      )}
      <div>
        <label className="block text-sm text-white/60 mb-1">{t.drafts.body}</label>
        <textarea
          className="input-glass w-full min-h-[150px] resize-y"
          value={form.body}
          onChange={e => setForm({ ...form, body: e.target.value })}
          required
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => { setShowCreate(false); setEditDraft(null); setForm(emptyForm); }}
        >
          {t.common.cancel}
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? t.common.saving : submitLabel}
        </button>
      </div>
    </form>
  );

  return (
    <DashboardLayout>
      <PageHeader
        title={t.drafts.title}
        subtitle={
          <>
            <span>{t.drafts.subtitle}</span>
            <span className="ml-3 text-white/40">{filtered.length} {t.drafts.totalDrafts}</span>
          </>
        }
        action={
          <button className="btn-primary flex items-center gap-2" onClick={() => { setForm(emptyForm); setShowCreate(true); }}>
            <PlusIcon className="w-4 h-4" />
            {t.drafts.newDraft}
          </button>
        }
      />

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder={t.common.search}
          className="input-glass flex-1"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-white/40">{t.common.loading}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/40">{t.drafts.emptyState}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-glass w-full">
            <thead>
              <tr>
                <th>{t.drafts.type}</th>
                <th>{t.drafts.toRecipient}</th>
                <th>{t.drafts.subject}</th>
                <th className="hidden md:table-cell">{t.drafts.body}</th>
                <th>{t.drafts.status}</th>
                <th className="hidden sm:table-cell">{t.drafts.date}</th>
                <th>{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td>
                    <span className={`tag ${getTypeClass(d.type)} inline-flex items-center gap-1`}>
                      {getTypeIcon(d.type)}
                      {d.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-white/80 max-w-[140px] truncate">{d.to_recipient || '—'}</td>
                  <td className="text-white/80 max-w-[160px] truncate">{d.subject || '—'}</td>
                  <td className="hidden md:table-cell text-white/60 max-w-[200px] truncate">{d.body || '—'}</td>
                  <td><span className={`tag ${getStatusClass(d.status)}`}>{t.drafts[d.status as keyof typeof t.drafts] as string}</span></td>
                  <td className="hidden sm:table-cell text-white/50 text-sm">
                    {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        className="btn-ghost p-1.5"
                        title={t.common.view}
                        onClick={() => setViewDraft(d)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        className="btn-ghost p-1.5"
                        title={t.common.edit}
                        onClick={() => {
                          setEditDraft(d);
                          setForm({
                            type: d.type,
                            to_recipient: d.to_recipient || '',
                            subject: d.subject || '',
                            body: d.body || '',
                          });
                        }}
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        className="btn-ghost p-1.5 text-red-400 hover:text-red-300"
                        title={t.common.delete}
                        onClick={() => handleDelete(d.id)}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      <Modal open={!!viewDraft} onClose={() => { setViewDraft(null); setCopied(false); }} title={viewDraft?.subject || viewDraft?.type?.toUpperCase() || 'Draft'}>
        {viewDraft && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`tag ${getTypeClass(viewDraft.type)} inline-flex items-center gap-1`}>
                {getTypeIcon(viewDraft.type)}
                {viewDraft.type.toUpperCase()}
              </span>
              <span className={`tag ${getStatusClass(viewDraft.status)}`}>{t.drafts[viewDraft.status as keyof typeof t.drafts] as string}</span>
            </div>
            {viewDraft.to_recipient && (
              <div>
                <span className="text-white/50 text-sm">{t.drafts.toRecipient}:</span>
                <p className="text-white">{viewDraft.to_recipient}</p>
              </div>
            )}
            {viewDraft.subject && (
              <div>
                <span className="text-white/50 text-sm">{t.drafts.subject}:</span>
                <p className="text-white">{viewDraft.subject}</p>
              </div>
            )}
            <div>
              <span className="text-white/50 text-sm">{t.drafts.body}:</span>
              <pre className="text-white/90 whitespace-pre-wrap bg-white/5 rounded-xl p-4 mt-1 text-sm font-sans">
                {viewDraft.body}
              </pre>
            </div>
            <div className="flex justify-end">
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => handleCopy(viewDraft.body || '')}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t.drafts.copied}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {t.drafts.copyToClipboard}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm(emptyForm); }} title={t.drafts.newDraft}>
        {draftForm(handleCreate, t.common.save)}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editDraft} onClose={() => { setEditDraft(null); setForm(emptyForm); }} title={t.common.edit}>
        {draftForm(handleUpdate, t.common.save)}
      </Modal>
    </DashboardLayout>
  );
}
