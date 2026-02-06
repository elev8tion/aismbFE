'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { getTierClass, getPartnershipStatusClass, getHealthColor } from '@/lib/utils/statusClasses';
import { PageHeader } from '@/components/ui/PageHeader';
import { StepProgress } from '@/components/ui/ProgressBar';

export default function PartnershipsPage() {
  const { t } = useTranslations();

  const partnerships = [
    { id: 1, company: 'Smith & Sons Construction', tier: 'architect', status: 'active', phase: 'co-create', health: 85, systems: 3, totalSystems: 6, startDate: '2024-01-15' },
    { id: 2, company: 'XYZ Property Management', tier: 'foundation', status: 'active', phase: 'deploy', health: 92, systems: 2, totalSystems: 3, startDate: '2024-02-01' },
    { id: 3, company: 'Quick Fix HVAC', tier: 'discovery', status: 'onboarding', phase: 'discover', health: 100, systems: 0, totalSystems: 1, startDate: '2024-03-01' },
  ];

  return (
    <DashboardLayout>
      <div className="page-content">
        <PageHeader
          title={t.nav.partnerships}
          subtitle={<>{partnerships.length} {t.partnerships.activePartnerships}</>}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gap)' }}>
          {partnerships.map((partnership) => (
            <div key={partnership.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <h3 className="text-base md:text-lg font-semibold text-white">{partnership.company}</h3>
                    <span className={`tag ${getTierClass(partnership.tier)}`}>
                      {partnership.tier}
                    </span>
                    <span className={`tag ${getPartnershipStatusClass(partnership.status)}`}>
                      {partnership.status}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-white/50 mt-1">{t.partnerships.started} {partnership.startDate}</p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-xs md:text-sm text-white/50">{t.partnerships.healthScore}</p>
                  <p className={`text-xl md:text-2xl font-bold ${getHealthColor(partnership.health)}`}>
                    {partnership.health}%
                  </p>
                </div>
              </div>

              <div className="mt-[var(--space-gap)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--space-gap)]">
                {/* Phase Progress */}
                <div>
                  <p className="text-xs md:text-sm text-white/50 mb-2">{t.partnerships.currentPhase}</p>
                  <StepProgress
                    steps={['discover', 'co-create', 'deploy', 'independent']}
                    currentStep={partnership.phase}
                  />
                  <p className="text-xs md:text-sm text-white mt-1 capitalize">{partnership.phase.replace('-', ' ')}</p>
                </div>

                {/* Systems Progress */}
                <div>
                  <p className="text-xs md:text-sm text-white/50 mb-2">{t.partnerships.systemsDelivered}</p>
                  <p className="text-lg md:text-xl font-semibold text-white">
                    {partnership.systems} / {partnership.totalSystems}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="sm:col-span-2 flex flex-wrap items-center gap-2 md:gap-3 lg:justify-end">
                  <button className="btn-secondary text-sm flex-1 sm:flex-none">{t.partnerships.viewDetails}</button>
                  <button className="btn-secondary text-sm flex-1 sm:flex-none">{t.partnerships.scheduleMeeting}</button>
                  <button className="btn-primary text-sm flex-1 sm:flex-none">{t.partnerships.updateProgress}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

