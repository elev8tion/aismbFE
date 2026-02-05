'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';

export default function PartnershipsPage() {
  const { t } = useTranslations();

  const partnerships = [
    { id: 1, company: 'Smith & Sons Construction', tier: 'architect', status: 'active', phase: 'co-create', health: 85, systems: 3, totalSystems: 6, startDate: '2024-01-15' },
    { id: 2, company: 'XYZ Property Management', tier: 'foundation', status: 'active', phase: 'deploy', health: 92, systems: 2, totalSystems: 3, startDate: '2024-02-01' },
    { id: 3, company: 'Quick Fix HVAC', tier: 'discovery', status: 'onboarding', phase: 'discover', health: 100, systems: 0, totalSystems: 1, startDate: '2024-03-01' },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{t.nav.partnerships}</h1>
            <p className="text-white/60 mt-1">{partnerships.length} active partnerships</p>
          </div>
        </div>

        <div className="space-y-6">
          {partnerships.map((partnership) => (
            <div key={partnership.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{partnership.company}</h3>
                    <span className={`tag ${getTierClass(partnership.tier)}`}>
                      {partnership.tier}
                    </span>
                    <span className={`tag ${getStatusClass(partnership.status)}`}>
                      {partnership.status}
                    </span>
                  </div>
                  <p className="text-sm text-white/50 mt-1">Started {partnership.startDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/50">Health Score</p>
                  <p className={`text-2xl font-bold ${getHealthColor(partnership.health)}`}>
                    {partnership.health}%
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-4 gap-6">
                {/* Phase Progress */}
                <div>
                  <p className="text-sm text-white/50 mb-2">Current Phase</p>
                  <div className="flex gap-2">
                    {['discover', 'co-create', 'deploy', 'independent'].map((phase, i) => (
                      <div
                        key={phase}
                        className={`flex-1 h-2 rounded-full ${
                          i <= getPhaseIndex(partnership.phase)
                            ? 'bg-primary-electricBlue'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-white mt-1 capitalize">{partnership.phase.replace('-', ' ')}</p>
                </div>

                {/* Systems Progress */}
                <div>
                  <p className="text-sm text-white/50 mb-2">Systems Delivered</p>
                  <p className="text-xl font-semibold text-white">
                    {partnership.systems} / {partnership.totalSystems}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="col-span-2 flex items-center justify-end gap-3">
                  <button className="btn-secondary text-sm">View Details</button>
                  <button className="btn-secondary text-sm">Schedule Meeting</button>
                  <button className="btn-primary text-sm">Update Progress</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

function getPhaseIndex(phase: string) {
  const phases = ['discover', 'co-create', 'deploy', 'independent'];
  return phases.indexOf(phase);
}

function getTierClass(tier: string) {
  switch (tier) {
    case 'discovery': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'foundation': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'architect': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default: return '';
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case 'onboarding': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'active': return 'tag-success';
    case 'graduated': return 'bg-green-500/20 text-green-400 border-green-500/30';
    default: return '';
  }
}

function getHealthColor(health: number) {
  if (health >= 80) return 'text-green-400';
  if (health >= 60) return 'text-yellow-400';
  return 'text-red-400';
}
