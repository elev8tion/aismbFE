'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, useCallback } from 'react';
import { getTierClass, getPartnershipStatusClass, getHealthColor } from '@/lib/utils/statusClasses';
import { PageHeader } from '@/components/ui/PageHeader';
import { StepProgress } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { useVoiceAgentActions } from '@/contexts/VoiceAgentActionsContext';
import { TIER_PRICING, type TierKey } from '@/lib/stripe/pricing';
import DocumentStatusBadge from '@/components/contracts/DocumentStatusBadge';
import SendContractModal from '@/components/contracts/SendContractModal';
import { DocumentRecord, DocumentStatus } from '@/lib/contracts/types';

interface Partnership {
  id: string;
  company_name?: string;
  tier: string;
  status: string;
  phase: string;
  health_score: number;
  systems_delivered: number;
  total_systems: number;
  monthly_revenue?: number;
  start_date?: string;
  next_meeting?: string;
  notes?: string;
  created_at?: string;
  payment_status?: string;
  customer_email?: string;
  stripe_customer_id?: string;
}

interface StripeInvoice {
  id: string;
  number: string | null;
  status: string | null;
  amount_due: number;
  amount_paid: number;
  currency: string;
  created: number;
  due_date: number | null;
  paid: boolean;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  customer_email: string | null;
  metadata: Record<string, string> | null;
  subscription: string | null;
}

const PHASES = ['discover', 'co-create', 'deploy', 'independent'];
const STATUSES = ['onboarding', 'active', 'graduated'];

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString();
}

function getInvoiceStatusClass(status: string | null): string {
  switch (status) {
    case 'paid': return 'tag-success';
    case 'open': return 'tag-info';
    case 'void': return 'tag-neutral';
    case 'uncollectible': return 'tag-danger';
    default: return 'tag-neutral';
  }
}

function getBillingStatusTag(paymentStatus: string | undefined, t: any) {
  switch (paymentStatus) {
    case 'setup_paid':
      return <span className="tag tag-success">{t.billing.setupPaid}</span>;
    case 'invoice_sent':
      return <span className="tag tag-info">{t.billing.invoiceSent}</span>;
    case 'past_due':
      return <span className="tag tag-danger">{t.billing.pastDue}</span>;
    case 'cancelled':
      return <span className="tag tag-neutral">{t.billing.notStarted}</span>;
    default:
      return <span className="tag tag-neutral">{t.billing.notInvoiced}</span>;
  }
}

export default function PartnershipsPage() {
  const { t } = useTranslations();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewPartnership, setViewPartnership] = useState<Partnership | null>(null);
  const [updatePartnership, setUpdatePartnership] = useState<Partnership | null>(null);
  const [saving, setSaving] = useState(false);
  const [updateForm, setUpdateForm] = useState({ phase: '', status: '', health_score: 0, systems_delivered: 0 });

  // Billing modals
  const [invoicePartnership, setInvoicePartnership] = useState<Partnership | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [invoiceEmail, setInvoiceEmail] = useState('');
  const [invoiceName, setInvoiceName] = useState('');

  const [invoicesPartnership, setInvoicesPartnership] = useState<Partnership | null>(null);
  const [invoicesList, setInvoicesList] = useState<StripeInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Grant access state
  const [grantAccessPartnership, setGrantAccessPartnership] = useState<Partnership | null>(null);
  const [grantForm, setGrantForm] = useState({ customer_user_id: '', access_level: 'view' });
  const [granting, setGranting] = useState(false);
  const [grantSuccess, setGrantSuccess] = useState(false);

  // Contract state
  const [contractStatuses, setContractStatuses] = useState<Record<string, DocumentStatus | null>>({});
  const [sendContractPartnership, setSendContractPartnership] = useState<Partnership | null>(null);

  const fetchPartnerships = useCallback(async () => {
    try {
      const res = await fetch('/api/data/read/partnerships', { credentials: 'include' });
      const data: { data?: Partnership[] } = await res.json();
      if (data.data && data.data.length > 0) { setPartnerships(data.data); }
      else { setPartnerships(MOCK_PARTNERSHIPS); }
    } catch { setPartnerships(MOCK_PARTNERSHIPS); }
    finally { setLoading(false); }
  }, []);

  const fetchContractStatuses = useCallback(async (partnershipList: Partnership[]) => {
    const statuses: Record<string, DocumentStatus | null> = {};
    for (const p of partnershipList) {
      try {
        const res = await fetch(`/api/contracts/status?partnership_id=${p.id}`, { credentials: 'include' });
        if (res.ok) {
          const { documents } = await res.json();
          if (documents && documents.length > 0) {
            if (documents.every((d: DocumentRecord) => d.status === 'fully_executed')) statuses[p.id] = 'fully_executed';
            else if (documents.some((d: DocumentRecord) => d.status === 'client_signed')) statuses[p.id] = 'client_signed';
            else if (documents.some((d: DocumentRecord) => d.status === 'pending')) statuses[p.id] = 'pending';
            else statuses[p.id] = 'draft';
          } else {
            statuses[p.id] = null;
          }
        } else {
          statuses[p.id] = null;
        }
      } catch {
        statuses[p.id] = null;
      }
    }
    setContractStatuses(statuses);
  }, []);

  useEffect(() => { fetchPartnerships(); }, [fetchPartnerships]);

  useEffect(() => {
    if (partnerships.length > 0) fetchContractStatuses(partnerships);
  }, [partnerships, fetchContractStatuses]);

  // Voice actions
  const { subscribe } = useVoiceAgentActions();
  useEffect(() => {
    const unsub = subscribe((action) => {
      if (!action || action.type !== 'ui_action' || action.scope !== 'partnerships') return;
      const a = action.action;
      const payload = (action.payload || {}) as any;
      if (a === 'open_view') {
        const { id, query } = payload as { id?: string; query?: string };
        let match: Partnership | undefined;
        if (id) match = partnerships.find(p => String(p.id) === String(id));
        if (!match && query) {
          const q = String(query).toLowerCase();
          match = partnerships.find(p => (p.company_name || '').toLowerCase().includes(q));
        }
        if (match) setViewPartnership(match);
      } else if (a === 'open_edit') {
        const { id, query } = payload as { id?: string; query?: string };
        let match: Partnership | undefined;
        if (id) match = partnerships.find(p => String(p.id) === String(id));
        if (!match && query) {
          const q = String(query).toLowerCase();
          match = partnerships.find(p => (p.company_name || '').toLowerCase().includes(q));
        }
        if (match) openUpdate(match);
      }
    });
    return () => { unsub(); };
  }, [subscribe, partnerships]);

  const phaseLabels: Record<string, string> = {
    'discover': t.partnerships.phases.discover,
    'co-create': t.partnerships.phases.coCreate,
    'deploy': t.partnerships.phases.deploy,
    'independent': t.partnerships.phases.independent,
  };

  const statusLabels: Record<string, string> = {
    'onboarding': t.partnerships.statuses.onboarding,
    'active': t.partnerships.statuses.active,
    'graduated': t.partnerships.statuses.graduated,
  };

  const openUpdate = (p: Partnership) => {
    setUpdateForm({
      phase: p.phase,
      status: p.status,
      health_score: p.health_score,
      systems_delivered: p.systems_delivered,
    });
    setUpdatePartnership(p);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatePartnership) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/data/update/partnerships?id=${updatePartnership.id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateForm),
      });
      if (res.ok) { setUpdatePartnership(null); fetchPartnerships(); }
    } catch (err) { console.error('Failed to update partnership:', err); }
    finally { setSaving(false); }
  };

  const handleScheduleMeeting = (p: Partnership) => {
    const subject = encodeURIComponent(`Strategy Meeting - ${p.company_name}`);
    const body = encodeURIComponent(`Hi,\n\nI'd like to schedule our next strategy meeting for ${p.company_name}.\n\nCurrent phase: ${phaseLabels[p.phase] || p.phase}\nSystems delivered: ${p.systems_delivered} / ${p.total_systems}\n\nBest regards`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  // ─── Invoice Actions ───

  const openSendInvoice = (p: Partnership) => {
    setInvoiceEmail(p.customer_email || '');
    setInvoiceName(p.company_name || '');
    setInvoicePartnership(p);
  };

  const handleSendInvoice = async () => {
    if (!invoicePartnership || !invoiceEmail) return;
    setSendingInvoice(true);
    try {
      const res = await fetch('/api/integrations/stripe/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnership_id: invoicePartnership.id,
          customer_email: invoiceEmail,
          customer_name: invoiceName,
          tier: invoicePartnership.tier,
          company_name: invoicePartnership.company_name || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Update partnership payment_status locally
        await fetch(`/api/data/update/partnerships?id=${invoicePartnership.id}`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_status: 'invoice_sent',
            stripe_customer_id: data.customer_id,
            customer_email: invoiceEmail,
          }),
        });
        setInvoicePartnership(null);
        fetchPartnerships();
      } else {
        alert(data.error || 'Failed to send invoice');
      }
    } catch (err) {
      console.error('Invoice error:', err);
      alert('Failed to send invoice');
    } finally {
      setSendingInvoice(false);
    }
  };

  const openViewInvoices = async (p: Partnership) => {
    setInvoicesPartnership(p);
    setLoadingInvoices(true);
    try {
      const params = new URLSearchParams();
      if (p.stripe_customer_id) params.set('customer_id', p.stripe_customer_id);
      else params.set('partnership_id', p.id);

      const res = await fetch(`/api/integrations/stripe/invoices/list?${params.toString()}`);
      const data = await res.json();
      setInvoicesList(data.invoices || []);
    } catch {
      setInvoicesList([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // ─── Grant Access Actions ───

  const handleGrantAccess = async () => {
    if (!grantAccessPartnership || !grantForm.customer_user_id) return;
    setGranting(true);
    setGrantSuccess(false);
    try {
      const res = await fetch('/api/admin/grant-access', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_user_id: grantForm.customer_user_id,
          partnership_id: grantAccessPartnership.id,
          access_level: grantForm.access_level,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGrantSuccess(true);
        setTimeout(() => {
          setGrantAccessPartnership(null);
          setGrantSuccess(false);
          setGrantForm({ customer_user_id: '', access_level: 'view' });
        }, 1500);
      } else {
        alert(data.error || 'Failed to grant access');
      }
    } catch (err) {
      console.error('Grant access error:', err);
      alert('Failed to grant access');
    } finally {
      setGranting(false);
    }
  };

  const getTierSetupAmount = (tier: string) => {
    const pricing = TIER_PRICING[tier as TierKey];
    return pricing ? formatCents(pricing.setup) : '$0';
  };

  const getTierMonthlyAmount = (tier: string) => {
    const pricing = TIER_PRICING[tier as TierKey];
    return pricing ? formatCents(pricing.monthly) : '$0';
  };

  return (
    <DashboardLayout>
      <div className="page-content">
        <PageHeader
          title={t.nav.partnerships}
          subtitle={<>{partnerships.length} {t.partnerships.activePartnerships}</>}
        />

        {loading ? (
          <div className="card p-12 text-center"><p className="text-white/60">{t.common.loading}</p></div>
        ) : partnerships.length === 0 ? (
          <div className="card p-12 text-center"><p className="text-white/60">{t.common.noData}</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gap)' }}>
            {partnerships.map((partnership) => (
              <div key={partnership.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <h3 className="text-base md:text-lg font-semibold text-white">{partnership.company_name}</h3>
                      <span className={`tag ${getTierClass(partnership.tier)}`}>
                        {partnership.tier}
                      </span>
                      <span className={`tag ${getPartnershipStatusClass(partnership.status)}`}>
                        {statusLabels[partnership.status] || partnership.status}
                      </span>
                      {getBillingStatusTag(partnership.payment_status, t)}
                      {contractStatuses[partnership.id] && (
                        <DocumentStatusBadge status={contractStatuses[partnership.id]!} labels={t.documents.statuses} />
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-white/50 mt-1">
                      {t.partnerships.started} {partnership.start_date}
                      {partnership.payment_status === 'setup_paid' && (
                        <span className="ml-3 text-emerald-400">{getTierMonthlyAmount(partnership.tier)}/mo</span>
                      )}
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-xs md:text-sm text-white/50">{t.partnerships.healthScore}</p>
                    <p className={`text-xl md:text-2xl font-bold ${getHealthColor(partnership.health_score)}`}>
                      {partnership.health_score}%
                    </p>
                  </div>
                </div>

                <div className="mt-[var(--space-gap)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--space-gap)]">
                  {/* Phase Progress */}
                  <div>
                    <p className="text-xs md:text-sm text-white/50 mb-2">{t.partnerships.currentPhase}</p>
                    <StepProgress
                      steps={PHASES}
                      currentStep={partnership.phase}
                    />
                    <p className="text-xs md:text-sm text-white mt-1 capitalize">{phaseLabels[partnership.phase] || partnership.phase.replace('-', ' ')}</p>
                  </div>

                  {/* Systems Progress */}
                  <div>
                    <p className="text-xs md:text-sm text-white/50 mb-2">{t.partnerships.systemsDelivered}</p>
                    <p className="text-lg md:text-xl font-semibold text-white">
                      {partnership.systems_delivered} / {partnership.total_systems}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="sm:col-span-2 flex flex-wrap items-center gap-2 md:gap-3 lg:justify-end">
                    <button onClick={() => setViewPartnership(partnership)} className="btn-secondary text-sm flex-1 sm:flex-none">{t.partnerships.viewDetails}</button>
                    <button onClick={() => handleScheduleMeeting(partnership)} className="btn-secondary text-sm flex-1 sm:flex-none">{t.partnerships.scheduleMeeting}</button>
                    {(partnership.status === 'active' || partnership.status === 'onboarding') && !contractStatuses[partnership.id] && (
                      <button onClick={() => setSendContractPartnership(partnership)} className="btn-primary text-sm flex-1 sm:flex-none">{t.documents.sendContract}</button>
                    )}
                    {(partnership.status === 'active' || partnership.status === 'onboarding') && !partnership.payment_status && contractStatuses[partnership.id] === 'fully_executed' && (
                      <button onClick={() => openSendInvoice(partnership)} className="btn-primary text-sm flex-1 sm:flex-none">{t.billing.sendSetupInvoice}</button>
                    )}
                    <button onClick={() => openViewInvoices(partnership)} className="btn-secondary text-sm flex-1 sm:flex-none">{t.billing.viewInvoices}</button>
                    <button onClick={() => { setGrantForm({ customer_user_id: '', access_level: 'view' }); setGrantAccessPartnership(partnership); }} className="btn-secondary text-sm flex-1 sm:flex-none">{t.portal.grantAccess}</button>
                    <button onClick={() => openUpdate(partnership)} className="btn-primary text-sm flex-1 sm:flex-none">{t.partnerships.updateProgress}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Details Modal */}
      <Modal open={!!viewPartnership} onClose={() => setViewPartnership(null)} title={viewPartnership?.company_name || ''}>
        {viewPartnership && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.pipeline.tier}</p>
                <span className={`tag mt-1 ${getTierClass(viewPartnership.tier)}`}>{viewPartnership.tier}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.leads.status}</p>
                <span className={`tag mt-1 ${getPartnershipStatusClass(viewPartnership.status)}`}>{statusLabels[viewPartnership.status] || viewPartnership.status}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.partnerships.currentPhase}</p>
                <p className="text-sm font-medium text-white mt-1 capitalize">{phaseLabels[viewPartnership.phase] || viewPartnership.phase.replace('-', ' ')}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.partnerships.healthScore}</p>
                <p className={`text-lg font-bold mt-1 ${getHealthColor(viewPartnership.health_score)}`}>{viewPartnership.health_score}%</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.partnerships.systemsDelivered}</p>
                <p className="text-sm font-medium text-white mt-1">{viewPartnership.systems_delivered} / {viewPartnership.total_systems}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.partnerships.started}</p>
                <p className="text-sm font-medium text-white mt-1">{viewPartnership.start_date || '—'}</p>
              </div>
            </div>
            {/* Billing Summary */}
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-white/50 mb-2">{t.billing.setupFee} / {t.billing.monthlyPartnership}</p>
              <div className="flex items-center gap-3">
                {getBillingStatusTag(viewPartnership.payment_status, t)}
                <span className="text-sm text-white/70">
                  {t.billing.setupFee}: {getTierSetupAmount(viewPartnership.tier)} | {t.billing.monthlyPartnership}: {getTierMonthlyAmount(viewPartnership.tier)}/mo
                </span>
              </div>
            </div>
            {viewPartnership.notes && (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50 mb-1">{t.common.notes}</p>
                <p className="text-sm text-white/80">{viewPartnership.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Update Progress Modal */}
      <Modal open={!!updatePartnership} onClose={() => setUpdatePartnership(null)} title={`${t.partnerships.updateProgress} — ${updatePartnership?.company_name || ''}`}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">{t.partnerships.currentPhase}</label>
              <select className="select-glass w-full" value={updateForm.phase} onChange={e => setUpdateForm({ ...updateForm, phase: e.target.value })}>
                {PHASES.map(p => <option key={p} value={p}>{phaseLabels[p] || p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">{t.leads.status}</label>
              <select className="select-glass w-full" value={updateForm.status} onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{statusLabels[s] || s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">{t.partnerships.healthScore} (%)</label>
              <input type="number" min="0" max="100" className="input-glass w-full" value={updateForm.health_score} onChange={e => setUpdateForm({ ...updateForm, health_score: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">{t.partnerships.systemsDelivered}</label>
              <input type="number" min="0" className="input-glass w-full" value={updateForm.systems_delivered} onChange={e => setUpdateForm({ ...updateForm, systems_delivered: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setUpdatePartnership(null)} className="btn-secondary">{t.common.cancel}</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? t.common.saving : t.common.save}</button>
          </div>
        </form>
      </Modal>

      {/* Send Invoice Modal */}
      <Modal open={!!invoicePartnership} onClose={() => setInvoicePartnership(null)} title={`${t.billing.sendSetupInvoice} — ${invoicePartnership?.company_name || ''}`}>
        {invoicePartnership && (
          <div className="space-y-4">
            <p className="text-sm text-white/70">{t.billing.confirmSendInvoice}</p>
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-white/50">{t.pipeline.tier}</span>
                <span className={`tag ${getTierClass(invoicePartnership.tier)}`}>{invoicePartnership.tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/50">{t.billing.invoiceAmount}</span>
                <span className="text-lg font-bold text-white">{getTierSetupAmount(invoicePartnership.tier)}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">{t.common.email} *</label>
              <input
                type="email"
                required
                className="input-glass w-full"
                value={invoiceEmail}
                onChange={e => setInvoiceEmail(e.target.value)}
                placeholder="client@company.com"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">{t.common.name}</label>
              <input
                type="text"
                className="input-glass w-full"
                value={invoiceName}
                onChange={e => setInvoiceName(e.target.value)}
                placeholder="Contact Name"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setInvoicePartnership(null)} className="btn-secondary">{t.common.cancel}</button>
              <button
                onClick={handleSendInvoice}
                disabled={sendingInvoice || !invoiceEmail}
                className="btn-primary"
              >
                {sendingInvoice ? t.common.saving : t.billing.sendInvoice}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Invoices Modal */}
      <Modal open={!!invoicesPartnership} onClose={() => { setInvoicesPartnership(null); setInvoicesList([]); }} title={`${t.billing.invoiceHistory} — ${invoicesPartnership?.company_name || ''}`} wide>
        {loadingInvoices ? (
          <p className="text-white/60 text-center py-6">{t.common.loading}</p>
        ) : invoicesList.length === 0 ? (
          <p className="text-white/60 text-center py-6">{t.common.noData}</p>
        ) : (
          <div className="space-y-2">
            {invoicesList.map((inv) => (
              <div key={inv.id} className="bg-white/5 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{inv.number || inv.id.slice(0, 20)}</span>
                    <span className={`tag text-xs ${getInvoiceStatusClass(inv.status)}`}>
                      {inv.status === 'paid' ? t.billing.paid
                        : inv.status === 'open' ? t.billing.open
                        : inv.status === 'void' ? t.billing.void
                        : inv.status || '—'}
                    </span>
                    {inv.metadata?.type === 'setup' && (
                      <span className="text-xs text-white/40">{t.billing.setupFee}</span>
                    )}
                    {inv.subscription && (
                      <span className="text-xs text-white/40">{t.billing.monthlyPartnership}</span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    {formatDate(inv.created)} — {inv.customer_email || ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-white">{formatCents(inv.amount_due)}</span>
                  {inv.hosted_invoice_url && (
                    <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
                      {t.common.view}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
      {/* Grant Access Modal */}
      <Modal open={!!grantAccessPartnership} onClose={() => { setGrantAccessPartnership(null); setGrantSuccess(false); }} title={`${t.portal.grantAccessTitle} — ${grantAccessPartnership?.company_name || ''}`}>
        {grantAccessPartnership && (
          <div className="space-y-4">
            {grantSuccess ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-400 font-medium">{t.portal.accessGranted}</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t.portal.customerUserId} *</label>
                  <input
                    type="text"
                    required
                    className="input-glass w-full"
                    value={grantForm.customer_user_id}
                    onChange={(e) => setGrantForm({ ...grantForm, customer_user_id: e.target.value })}
                    placeholder="e.g. ptoDigytXjSgf691ZidAeAGKMwFWSVVV"
                  />
                  <p className="text-xs text-white/30 mt-1">The user_id from the customer&apos;s NCB account</p>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t.portal.accessLevel}</label>
                  <select
                    className="select-glass w-full"
                    value={grantForm.access_level}
                    onChange={(e) => setGrantForm({ ...grantForm, access_level: e.target.value })}
                  >
                    <option value="view">View</option>
                    <option value="comment">Comment</option>
                    <option value="edit">Edit</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setGrantAccessPartnership(null)} className="btn-secondary">{t.common.cancel}</button>
                  <button
                    onClick={handleGrantAccess}
                    disabled={granting || !grantForm.customer_user_id}
                    className="btn-primary"
                  >
                    {granting ? t.portal.granting : t.portal.grantAccess}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Send Contract Modal */}
      {sendContractPartnership && (
        <SendContractModal
          open={!!sendContractPartnership}
          onClose={() => setSendContractPartnership(null)}
          partnership={{
            id: Number(sendContractPartnership.id),
            company_name: sendContractPartnership.company_name || '',
            contact_name: sendContractPartnership.company_name || '',
            customer_email: sendContractPartnership.customer_email,
            tier: sendContractPartnership.tier,
          }}
          onSuccess={() => fetchContractStatuses(partnerships)}
        />
      )}
    </DashboardLayout>
  );
}

const MOCK_PARTNERSHIPS: Partnership[] = [
  { id: '1', company_name: 'Smith & Sons Construction', tier: 'architect', status: 'active', phase: 'co-create', health_score: 85, systems_delivered: 3, total_systems: 6, start_date: '2024-01-15', notes: 'Strong engagement. Currently building custom estimating AI and project management automation.', payment_status: 'setup_paid' },
  { id: '2', company_name: 'XYZ Property Management', tier: 'foundation', status: 'active', phase: 'deploy', health_score: 92, systems_delivered: 2, total_systems: 3, start_date: '2024-02-01', notes: 'Tenant communication AI deployed and performing well. Maintenance scheduling next.', payment_status: 'invoice_sent' },
  { id: '3', company_name: 'Quick Fix HVAC', tier: 'discovery', status: 'onboarding', phase: 'discover', health_score: 100, systems_delivered: 0, total_systems: 1, start_date: '2024-03-01', notes: 'Initial discovery phase. Evaluating AI-powered scheduling system.' },
];
