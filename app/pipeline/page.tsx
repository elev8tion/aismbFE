'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { PlusIcon } from '@/components/icons';
import { getTierClass } from '@/lib/utils/statusClasses';
import { PageHeader } from '@/components/ui/PageHeader';

export default function PipelinePage() {
  const { t } = useTranslations();

  const stages = [
    { key: 'newLead', label: t.pipeline.stages.newLead, color: 'stage-new', deals: [
      { id: 1, name: 'ABC Plumbing', company: 'ABC Plumbing LLC', value: 4000, tier: 'discovery' },
      { id: 2, name: 'Quick Fix HVAC', company: 'Quick Fix Inc', value: 9500, tier: 'foundation' },
    ]},
    { key: 'contacted', label: t.pipeline.stages.contacted, color: 'stage-contacted', deals: [
      { id: 3, name: 'XYZ Properties', company: 'XYZ Property Management', value: 9500, tier: 'foundation' },
    ]},
    { key: 'discoveryCall', label: t.pipeline.stages.discoveryCall, color: 'stage-discovery', deals: [
      { id: 4, name: 'Smith Construction', company: 'Smith & Sons Construction', value: 30000, tier: 'architect' },
      { id: 5, name: 'Miller Services', company: 'Miller Professional Services', value: 9500, tier: 'foundation' },
    ]},
    { key: 'proposalSent', label: t.pipeline.stages.proposalSent, color: 'stage-proposal', deals: [
      { id: 6, name: 'Johnson Real Estate', company: 'Johnson Realty Group', value: 9500, tier: 'foundation' },
    ]},
    { key: 'negotiation', label: t.pipeline.stages.negotiation, color: 'stage-negotiation', deals: [
      { id: 7, name: 'Brown HVAC Systems', company: 'Brown Heating & Cooling', value: 30000, tier: 'architect' },
    ]},
    { key: 'closedWon', label: t.pipeline.stages.closedWon, color: 'stage-won', deals: [] },
  ];

  const totalValue = stages.reduce((sum, stage) =>
    sum + stage.deals.reduce((stageSum, deal) => stageSum + deal.value, 0), 0
  );

  return (
    <DashboardLayout>
      <div className="page-content">
        <PageHeader
          title={t.pipeline.title}
          subtitle={<>{t.pipeline.totalPipelineValue}: <span className="text-white font-semibold">${totalValue.toLocaleString()}</span></>}
          action={
            <button className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
              <PlusIcon className="w-5 h-5" />
              {t.pipeline.newOpportunity}
            </button>
          }
        />

        {/* Pipeline Board */}
        <div className="flex gap-[var(--space-gap)] overflow-x-auto pb-4 -mx-[var(--space-page)] px-[var(--space-page)] md:mx-0 md:px-0">
          {stages.map((stage) => {
            const stageValue = stage.deals.reduce((sum, deal) => sum + deal.value, 0);
            return (
              <div key={stage.key} className="flex-shrink-0 w-60 md:w-72">
                {/* Stage Header */}
                <div className={`p-3 rounded-t-xl border-t-2 ${stage.color} bg-white/5`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm md:text-base font-medium text-white">{stage.label}</h3>
                    <span className="text-xs md:text-sm text-white/50">{stage.deals.length}</span>
                  </div>
                  <p className="text-xs md:text-sm text-white/40 mt-1">${stageValue.toLocaleString()}</p>
                </div>

                {/* Stage Cards */}
                <div className="space-y-3 p-2 md:p-3 bg-white/[0.02] rounded-b-xl min-h-[300px] md:min-h-[400px]">
                  {stage.deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="card p-4 cursor-pointer hover:border-primary-electricBlue/50 transition-colors"
                    >
                      <h4 className="text-sm md:text-base font-medium text-white">{deal.name}</h4>
                      <p className="text-xs md:text-sm text-white/50 mt-1">{deal.company}</p>
                      <div className="flex items-center justify-between mt-2 md:mt-3">
                        <span className="text-base md:text-lg font-semibold text-white">
                          ${deal.value.toLocaleString()}
                        </span>
                        <span className={`tag text-xs ${getTierClass(deal.tier)}`}>
                          {deal.tier}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Add Deal Button */}
                  <button className="w-full p-3 border border-dashed border-white/10 rounded-xl text-white/40 hover:border-white/20 hover:text-white/60 transition-colors">
                    {t.pipeline.addDeal}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}


