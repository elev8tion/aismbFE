'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, useCallback } from 'react';
import { PlusIcon } from '@/components/icons';
import { getTierClass } from '@/lib/utils/statusClasses';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { useVoiceAgentActions } from '@/contexts/VoiceAgentActionsContext';
import type { NCBListResponse, CheckoutSessionResponse, Opportunity } from '@kre8tion/shared-types';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const STAGES = ['new-lead', 'contacted', 'discovery-call', 'proposal-sent', 'negotiation', 'closed-won'];
const TIERS = ['discovery', 'foundation', 'architect'];

export default function PipelinePage() {
  const { t } = useTranslations();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [viewDeal, setViewDeal] = useState<Opportunity | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', tier: 'discovery', stage: 'new-lead', setup_fee: 4000, monthly_fee: 750, company_id: '' });
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [companyMap, setCompanyMap] = useState<Record<string, string>>({});

  // Start Stripe Checkout for a deal
  const startCheckout = async (deal: Opportunity) => {
    try {
      const amountDollars = Number(deal.total_contract_value || deal.setup_fee || 0);
      const res = await fetch('/api/integrations/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'payment',
          amount: Math.round(amountDollars * 100), // cents
          currency: 'usd',
          metadata: { tier: deal.tier, stage: deal.stage },
          opportunity_id: deal.id,
          success_path: '/payment-success',
          cancel_path: '/pipeline',
          product_name: `${deal.name} — Setup`,
          description: `Setup payment for ${deal.name}`,
        }),
      });
      const data: CheckoutSessionResponse = await res.json();
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

  const fetchOpportunities = useCallback(async () => {
    try {
      const [oppsRes, companiesRes] = await Promise.all([
        fetch('/api/data/read/opportunities', { credentials: 'include' }),
        fetch('/api/data/read/companies', { credentials: 'include' }),
      ]);

      if (oppsRes.status === 401) {
        setOpportunities([]);
        setLoading(false);
        return;
      }

      const [oppsData, companiesData] = await Promise.all([
        oppsRes.json(),
        companiesRes.json(),
      ]) as [NCBListResponse<Opportunity>, NCBListResponse<{ id: string; name: string }>];

      // Build company map
      const compList = companiesData.data || [];
      setCompanies(compList);
      const map: Record<string, string> = {};
      compList.forEach((c: any) => { map[String(c.id)] = c.name; });
      setCompanyMap(map);

      setOpportunities(oppsData.data || []);
    } catch (err) {
      console.error('Failed to fetch opportunities:', err);
      setOpportunities([]);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOpportunities(); }, [fetchOpportunities]);

  // Voice actions
  const { subscribe } = useVoiceAgentActions();
  useEffect(() => {
    const unsub = subscribe((action) => {
      if (!action || action.type !== 'ui_action' || action.scope !== 'pipeline') return;
      const a = action.action;
      const payload = (action.payload || {}) as any;
      if (a === 'open_new') {
        setShowCreate(true);
      } else if (a === 'open_view') {
        const { id, query } = payload as { id?: string; query?: string };
        let match: Opportunity | undefined;
        if (id) match = opportunities.find(o => String(o.id) === String(id));
        if (!match && query) {
          const q = String(query).toLowerCase();
          match = opportunities.find(o => o.name.toLowerCase().includes(q));
        }
        if (match) setViewDeal(match);
      }
    });
    return () => { unsub(); };
  }, [subscribe, opportunities]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setCreateError('');
    try {
      const totalContractValue = form.setup_fee + (form.monthly_fee * 12);
      const payload: any = { ...form, total_contract_value: totalContractValue };
      if (payload.company_id) { payload.company_id = Number(payload.company_id); }
      else { delete payload.company_id; }
      const res = await fetch('/api/data/create/opportunities', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowCreate(false);
        setCreateError('');
        fetchOpportunities();
      } else {
        const errData: any = await res.json().catch(() => null);
        setCreateError(errData?.error || `Failed to create (${res.status}). Make sure you are logged in.`);
      }
    } catch (err) {
      console.error('Failed to create opportunity:', err);
      setCreateError('Network error — check your connection.');
    }
    finally { setSaving(false); }
  };

  const stageLabels: Record<string, string> = {
    'new-lead': t.pipeline.stages.newLead,
    'contacted': t.pipeline.stages.contacted,
    'discovery-call': t.pipeline.stages.discoveryCall,
    'proposal-sent': t.pipeline.stages.proposalSent,
    'negotiation': t.pipeline.stages.negotiation,
    'closed-won': t.pipeline.stages.closedWon,
  };

  const stageColors: Record<string, string> = {
    'new-lead': 'stage-new', 'contacted': 'stage-contacted', 'discovery-call': 'stage-discovery',
    'proposal-sent': 'stage-proposal', 'negotiation': 'stage-negotiation', 'closed-won': 'stage-won',
  };

  const totalValue = opportunities.reduce((sum, o) => sum + Number(o.total_contract_value || o.setup_fee || 0), 0);

  const openCreateForStage = (stage: string) => {
    setForm({ name: '', tier: 'discovery', stage, setup_fee: 4000, monthly_fee: 750, company_id: '' });
    setCreateError('');
    setShowCreate(true);
  };

  return (
    <DashboardLayout>
      <ErrorBoundary>
      <div className="page-content">
        <PageHeader
          title={t.pipeline.title}
          subtitle={<>{t.pipeline.totalPipelineValue}: <span className="text-white font-semibold">${totalValue.toLocaleString()}</span></>}
          action={
            <button onClick={() => openCreateForStage('new-lead')} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
              <PlusIcon className="w-5 h-5" />
              {t.pipeline.newOpportunity}
            </button>
          }
        />

        {loading ? (
          <div className="card p-12 text-center"><p className="text-white/60">{t.common.loading}</p></div>
        ) : (
          <div className="flex gap-[var(--space-gap)] overflow-x-auto pb-4 -mx-[var(--space-page)] px-[var(--space-page)] md:mx-0 md:px-0">
            {STAGES.map((stageKey) => {
              const stageDeals = opportunities.filter(o => o.stage === stageKey);
              const stageValue = stageDeals.reduce((sum, o) => sum + Number(o.total_contract_value || o.setup_fee || 0), 0);
              return (
                <div key={stageKey} className="flex-shrink-0 w-60 md:w-72">
                  <div className={`p-3 rounded-t-xl border-t-2 ${stageColors[stageKey]} bg-white/5`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm md:text-base font-medium text-white">{stageLabels[stageKey]}</h3>
                      <span className="text-xs md:text-sm text-white/50">{stageDeals.length}</span>
                    </div>
                    <p className="text-xs md:text-sm text-white/40 mt-1">${stageValue.toLocaleString()}</p>
                  </div>
                  <div className="space-y-3 p-2 md:p-3 bg-white/[0.02] rounded-b-xl min-h-[300px] md:min-h-[400px]">
                    {stageDeals.map((deal) => (
                      <div key={deal.id} onClick={() => setViewDeal(deal)} className="card p-4 cursor-pointer hover:border-primary-electricBlue/50 transition-colors">
                        <h4 className="text-sm md:text-base font-medium text-white">{deal.name}</h4>
                        {deal.company_id && companyMap[String(deal.company_id)] && (
                          <p className="text-xs text-white/50 mt-0.5">{companyMap[String(deal.company_id)]}</p>
                        )}
                        <div className="flex items-center justify-between mt-2 md:mt-3">
                          <span className="text-base md:text-lg font-semibold text-white">${Number(deal.total_contract_value || deal.setup_fee || 0).toLocaleString()}</span>
                          <span className={`tag text-xs ${getTierClass(deal.tier)}`}>{deal.tier}</span>
                        </div>
                        {deal.stage !== 'closed-won' && (
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              className="btn-primary text-xs px-3 py-1.5"
                              onClick={(e) => { e.stopPropagation(); startCheckout(deal); }}
                            >
                              {t.payments.collectPayment}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    <button onClick={() => openCreateForStage(stageKey)} className="w-full p-3 border border-dashed border-white/10 rounded-xl text-white/40 hover:border-white/20 hover:text-white/60 transition-colors">
                      {t.pipeline.addDeal}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t.pipeline.newOpportunity}>
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && (
            <div className="bg-functional-error/10 border border-functional-error/30 rounded-lg p-3">
              <p className="text-sm text-functional-error">{createError}</p>
            </div>
          )}
          <div>
            <label className="block text-sm text-white/60 mb-1">{t.common.name} *</label>
            <input className="input-glass w-full" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. ABC Plumbing AI Package" />
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
              <label className="block text-sm text-white/60 mb-1">{t.pipeline.tier}</label>
              <select className="select-glass w-full" value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })}>
                {TIERS.map(tier => <option key={tier} value={tier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Stage</label>
              <select className="select-glass w-full" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
                {STAGES.map(s => <option key={s} value={s}>{stageLabels[s]}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Setup Fee ($)</label>
              <input type="number" className="input-glass w-full" value={form.setup_fee} onChange={e => setForm({ ...form, setup_fee: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Monthly Fee ($)</label>
              <input type="number" className="input-glass w-full" value={form.monthly_fee} onChange={e => setForm({ ...form, monthly_fee: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">{t.common.cancel}</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? t.common.creating : t.pipeline.newOpportunity}</button>
          </div>
        </form>
      </Modal>

      {/* View Deal Modal */}
      <Modal open={!!viewDeal} onClose={() => setViewDeal(null)} title={viewDeal?.name || ''}>
        {viewDeal && (
          <div className="space-y-3">
            {viewDeal.company_id && companyMap[String(viewDeal.company_id)] && (
              <p className="text-sm text-white/60">{companyMap[String(viewDeal.company_id)]}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.pipeline.tier}</p>
                <span className={`tag mt-1 ${getTierClass(viewDeal.tier)}`}>{viewDeal.tier}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">Stage</p>
                <span className={`tag mt-1 ${stageColors[viewDeal.stage]}`}>{stageLabels[viewDeal.stage]}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">Setup Fee</p>
                <p className="text-sm font-medium text-white mt-1">${Number(viewDeal.setup_fee || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.pipeline.value}</p>
                <p className="text-sm font-medium text-white mt-1">${Number(viewDeal.total_contract_value || viewDeal.setup_fee || 0).toLocaleString()}</p>
              </div>
            </div>
            {viewDeal.stage !== 'closed-won' && (
              <button
                onClick={() => { setViewDeal(null); startCheckout(viewDeal); }}
                className="btn-primary w-full mt-4"
              >
                {t.payments.collectPayment} — ${Number(viewDeal.total_contract_value || viewDeal.setup_fee || 0).toLocaleString()}
              </button>
            )}
          </div>
        )}
      </Modal>
      </ErrorBoundary>
    </DashboardLayout>
  );
}

