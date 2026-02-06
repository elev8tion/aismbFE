'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, useCallback } from 'react';
import { PlusIcon } from '@/components/icons';
import { getTierClass } from '@/lib/utils/statusClasses';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';

interface Opportunity {
  id: string;
  name: string;
  company_id?: number;
  tier: string;
  stage: string;
  setup_fee: number;
  monthly_fee?: number;
  total_contract_value?: number;
  expected_close_date?: string;
  created_at?: string;
}

const STAGES = ['new-lead', 'contacted', 'discovery-call', 'proposal-sent', 'negotiation', 'closed-won'];
const TIERS = ['discovery', 'foundation', 'architect'];

export default function PipelinePage() {
  const { t } = useTranslations();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createStage, setCreateStage] = useState('new-lead');
  const [viewDeal, setViewDeal] = useState<Opportunity | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', tier: 'discovery', stage: 'new-lead', setup_fee: 4000, monthly_fee: 750 });

  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await fetch('/api/data/read/opportunities', { credentials: 'include' });
      const data: { data?: Opportunity[] } = await res.json();
      if (data.data && data.data.length > 0) {
        setOpportunities(data.data);
      } else {
        setOpportunities(MOCK_OPPORTUNITIES);
      }
    } catch { setOpportunities(MOCK_OPPORTUNITIES); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOpportunities(); }, [fetchOpportunities]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/data/create/opportunities', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowCreate(false); fetchOpportunities(); }
    } catch (err) { console.error('Failed to create opportunity:', err); }
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

  const totalValue = opportunities.reduce((sum, o) => sum + (o.total_contract_value || o.setup_fee), 0);

  const openCreateForStage = (stage: string) => {
    setForm({ name: '', tier: 'discovery', stage, setup_fee: 4000, monthly_fee: 750 });
    setCreateStage(stage);
    setShowCreate(true);
  };

  return (
    <DashboardLayout>
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
              const stageValue = stageDeals.reduce((sum, o) => sum + (o.total_contract_value || o.setup_fee), 0);
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
                        <div className="flex items-center justify-between mt-2 md:mt-3">
                          <span className="text-base md:text-lg font-semibold text-white">${(deal.total_contract_value || deal.setup_fee).toLocaleString()}</span>
                          <span className={`tag text-xs ${getTierClass(deal.tier)}`}>{deal.tier}</span>
                        </div>
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
          <div>
            <label className="block text-sm text-white/60 mb-1">{t.common.name} *</label>
            <input className="input-glass w-full" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. ABC Plumbing AI Package" />
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
                <p className="text-sm font-medium text-white mt-1">${viewDeal.setup_fee.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50">{t.pipeline.value}</p>
                <p className="text-sm font-medium text-white mt-1">${(viewDeal.total_contract_value || viewDeal.setup_fee).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

const MOCK_OPPORTUNITIES: Opportunity[] = [
  { id: '1', name: 'ABC Plumbing', tier: 'discovery', stage: 'new-lead', setup_fee: 2500, monthly_fee: 750, total_contract_value: 4000 },
  { id: '2', name: 'Quick Fix HVAC', tier: 'foundation', stage: 'new-lead', setup_fee: 5000, monthly_fee: 1500, total_contract_value: 9500 },
  { id: '3', name: 'XYZ Properties', tier: 'foundation', stage: 'contacted', setup_fee: 5000, monthly_fee: 1500, total_contract_value: 9500 },
  { id: '4', name: 'Smith Construction', tier: 'architect', stage: 'discovery-call', setup_fee: 12000, monthly_fee: 3000, total_contract_value: 30000 },
  { id: '5', name: 'Miller Services', tier: 'foundation', stage: 'discovery-call', setup_fee: 5000, monthly_fee: 1500, total_contract_value: 9500 },
  { id: '6', name: 'Johnson Real Estate', tier: 'foundation', stage: 'proposal-sent', setup_fee: 5000, monthly_fee: 1500, total_contract_value: 9500 },
  { id: '7', name: 'Brown HVAC Systems', tier: 'architect', stage: 'negotiation', setup_fee: 12000, monthly_fee: 3000, total_contract_value: 30000 },
];
