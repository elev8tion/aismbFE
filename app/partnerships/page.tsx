'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, useCallback } from 'react';
import { getTierClass, getPartnershipStatusClass, getHealthColor } from '@/lib/utils/statusClasses';
import { PageHeader } from '@/components/ui/PageHeader';
import { StepProgress } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';

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
}

const PHASES = ['discover', 'co-create', 'deploy', 'independent'];
const STATUSES = ['onboarding', 'active', 'graduated'];

export default function PartnershipsPage() {
  const { t } = useTranslations();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewPartnership, setViewPartnership] = useState<Partnership | null>(null);
  const [updatePartnership, setUpdatePartnership] = useState<Partnership | null>(null);
  const [saving, setSaving] = useState(false);
  const [updateForm, setUpdateForm] = useState({ phase: '', status: '', health_score: 0, systems_delivered: 0 });

  const fetchPartnerships = useCallback(async () => {
    try {
      const res = await fetch('/api/data/read/partnerships', { credentials: 'include' });
      const data: { data?: Partnership[] } = await res.json();
      if (data.data && data.data.length > 0) { setPartnerships(data.data); }
      else { setPartnerships(MOCK_PARTNERSHIPS); }
    } catch { setPartnerships(MOCK_PARTNERSHIPS); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPartnerships(); }, [fetchPartnerships]);

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

  const startCheckout = async (p: Partnership) => {
    try {
      const amount = p.monthly_revenue || (p.tier === 'architect' ? 3000 : p.tier === 'foundation' ? 1500 : 750);
      const res = await fetch('/api/integrations/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'payment',
          amount: Math.round(amount * 100),
          currency: 'usd',
          metadata: { tier: p.tier, phase: p.phase },
          partnership_id: p.id,
          success_path: '/payment-success',
          cancel_path: '/partnerships',
          product_name: `${p.company_name} — Monthly`,
          description: `Monthly payment for ${p.company_name}`,
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert(data?.error || 'Failed to start checkout');
      }
    } catch (e) {
      console.error('Checkout error', e);
      alert('Failed to start checkout');
    }
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
                    </div>
                    <p className="text-xs md:text-sm text-white/50 mt-1">{t.partnerships.started} {partnership.start_date}</p>
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
                    {(partnership.status === 'active' || partnership.status === 'onboarding') && (
                      <button onClick={() => startCheckout(partnership)} className="btn-primary text-sm flex-1 sm:flex-none">{t.payments.payNow}</button>
                    )}
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
    </DashboardLayout>
  );
}

const MOCK_PARTNERSHIPS: Partnership[] = [
  { id: '1', company_name: 'Smith & Sons Construction', tier: 'architect', status: 'active', phase: 'co-create', health_score: 85, systems_delivered: 3, total_systems: 6, start_date: '2024-01-15', notes: 'Strong engagement. Currently building custom estimating AI and project management automation.' },
  { id: '2', company_name: 'XYZ Property Management', tier: 'foundation', status: 'active', phase: 'deploy', health_score: 92, systems_delivered: 2, total_systems: 3, start_date: '2024-02-01', notes: 'Tenant communication AI deployed and performing well. Maintenance scheduling next.' },
  { id: '3', company_name: 'Quick Fix HVAC', tier: 'discovery', status: 'onboarding', phase: 'discover', health_score: 100, systems_delivered: 0, total_systems: 1, start_date: '2024-03-01', notes: 'Initial discovery phase. Evaluating AI-powered scheduling system.' },
];
