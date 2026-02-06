'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, useCallback } from 'react';
import { CalculatorIcon } from '@/components/icons';

interface ROIMetrics {
  timeSaved?: number;
  weeklyValue?: number;
  totalValue?: number;
  investment?: number;
  roi?: number;
  paybackWeeks?: number;
}

interface ROICalculation {
  id: string;
  contact_id?: number;
  industry: string;
  employee_count: string;
  hourly_rate: number;
  weekly_admin_hours: number;
  calculations?: string;
  selected_tier?: 'discovery' | 'foundation' | 'architect';
  email_captured: number;
  email?: string;
  report_requested: number;
  report_sent_at?: string;
  time_on_calculator: number;
  adjustments_count: number;
  created_at?: string;
}

const MOCK_ROI_CALCULATIONS: ROICalculation[] = [
  {
    id: 'roi-1',
    industry: 'HVAC',
    employee_count: '10-25',
    hourly_rate: 85,
    weekly_admin_hours: 22,
    selected_tier: 'foundation',
    email_captured: 1,
    email: 'mike@precisionhvac.com',
    report_requested: 1,
    report_sent_at: '2026-02-05T15:30:00Z',
    time_on_calculator: 195,
    adjustments_count: 4,
    calculations: JSON.stringify({
      timeSaved: 18,
      weeklyValue: 1530,
      totalValue: 18360,
      investment: 9500,
      roi: 293,
      paybackWeeks: 6,
    }),
    created_at: '2026-02-05T15:22:00Z',
  },
  {
    id: 'roi-2',
    industry: 'Plumbing',
    employee_count: '5-10',
    hourly_rate: 75,
    weekly_admin_hours: 18,
    selected_tier: 'discovery',
    email_captured: 1,
    email: 'carlos@lopezplumbing.com',
    report_requested: 1,
    report_sent_at: '2026-02-05T12:00:00Z',
    time_on_calculator: 142,
    adjustments_count: 3,
    calculations: JSON.stringify({
      timeSaved: 14,
      weeklyValue: 1050,
      totalValue: 8400,
      investment: 4000,
      roi: 310,
      paybackWeeks: 4,
    }),
    created_at: '2026-02-05T11:48:00Z',
  },
  {
    id: 'roi-3',
    industry: 'Property Management',
    employee_count: '10-25',
    hourly_rate: 65,
    weekly_admin_hours: 30,
    selected_tier: 'architect',
    email_captured: 1,
    email: 'sarah@greenleafproperties.com',
    report_requested: 1,
    report_sent_at: '2026-02-04T18:15:00Z',
    time_on_calculator: 280,
    adjustments_count: 7,
    calculations: JSON.stringify({
      timeSaved: 24,
      weeklyValue: 1560,
      totalValue: 37440,
      investment: 30000,
      roi: 225,
      paybackWeeks: 19,
    }),
    created_at: '2026-02-04T17:50:00Z',
  },
  {
    id: 'roi-4',
    industry: 'Construction',
    employee_count: '5-10',
    hourly_rate: 90,
    weekly_admin_hours: 20,
    selected_tier: 'discovery',
    email_captured: 0,
    report_requested: 0,
    time_on_calculator: 85,
    adjustments_count: 2,
    calculations: JSON.stringify({
      timeSaved: 15,
      weeklyValue: 1350,
      totalValue: 10800,
      investment: 4000,
      roi: 370,
      paybackWeeks: 3,
    }),
    created_at: '2026-02-04T14:20:00Z',
  },
  {
    id: 'roi-5',
    industry: 'Electrical',
    employee_count: '10-25',
    hourly_rate: 95,
    weekly_admin_hours: 25,
    selected_tier: 'foundation',
    email_captured: 1,
    email: 'jared@sparkelectrical.com',
    report_requested: 0,
    time_on_calculator: 165,
    adjustments_count: 5,
    calculations: JSON.stringify({
      timeSaved: 20,
      weeklyValue: 1900,
      totalValue: 22800,
      investment: 9500,
      roi: 340,
      paybackWeeks: 5,
    }),
    created_at: '2026-02-03T16:10:00Z',
  },
  {
    id: 'roi-6',
    industry: 'Landscaping',
    employee_count: '1-5',
    hourly_rate: 55,
    weekly_admin_hours: 15,
    selected_tier: 'discovery',
    email_captured: 1,
    email: 'maria@greenthumblandscaping.com',
    report_requested: 1,
    report_sent_at: '2026-02-03T10:45:00Z',
    time_on_calculator: 120,
    adjustments_count: 2,
    calculations: JSON.stringify({
      timeSaved: 10,
      weeklyValue: 550,
      totalValue: 4400,
      investment: 4000,
      roi: 210,
      paybackWeeks: 7,
    }),
    created_at: '2026-02-03T10:30:00Z',
  },
  {
    id: 'roi-7',
    industry: 'HVAC',
    employee_count: '25-50',
    hourly_rate: 110,
    weekly_admin_hours: 35,
    selected_tier: 'architect',
    email_captured: 1,
    email: 'tom@northstarheating.com',
    report_requested: 1,
    report_sent_at: '2026-02-02T20:00:00Z',
    time_on_calculator: 310,
    adjustments_count: 8,
    calculations: JSON.stringify({
      timeSaved: 28,
      weeklyValue: 3080,
      totalValue: 73920,
      investment: 30000,
      roi: 446,
      paybackWeeks: 10,
    }),
    created_at: '2026-02-02T19:35:00Z',
  },
  {
    id: 'roi-8',
    industry: 'Plumbing',
    employee_count: '1-5',
    hourly_rate: 60,
    weekly_admin_hours: 12,
    selected_tier: 'discovery',
    email_captured: 0,
    report_requested: 0,
    time_on_calculator: 55,
    adjustments_count: 1,
    calculations: JSON.stringify({
      timeSaved: 8,
      weeklyValue: 480,
      totalValue: 3840,
      investment: 4000,
      roi: 96,
      paybackWeeks: 8,
    }),
    created_at: '2026-02-02T13:15:00Z',
  },
  {
    id: 'roi-9',
    industry: 'Construction',
    employee_count: '25-50',
    hourly_rate: 100,
    weekly_admin_hours: 40,
    selected_tier: 'foundation',
    email_captured: 1,
    email: 'dave@buildright.com',
    report_requested: 1,
    report_sent_at: '2026-02-01T14:30:00Z',
    time_on_calculator: 230,
    adjustments_count: 6,
    calculations: JSON.stringify({
      timeSaved: 22,
      weeklyValue: 2200,
      totalValue: 26400,
      investment: 9500,
      roi: 378,
      paybackWeeks: 4,
    }),
    created_at: '2026-02-01T14:05:00Z',
  },
  {
    id: 'roi-10',
    industry: 'Property Management',
    employee_count: '5-10',
    hourly_rate: 70,
    weekly_admin_hours: 25,
    selected_tier: 'foundation',
    email_captured: 1,
    email: 'jennifer@sunsetpm.com',
    report_requested: 0,
    time_on_calculator: 175,
    adjustments_count: 4,
    calculations: JSON.stringify({
      timeSaved: 18,
      weeklyValue: 1260,
      totalValue: 15120,
      investment: 9500,
      roi: 259,
      paybackWeeks: 8,
    }),
    created_at: '2026-01-31T11:40:00Z',
  },
];

export default function ROICalculationsPage() {
  const { t } = useTranslations();
  const [calculations, setCalculations] = useState<ROICalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCalculations = useCallback(async () => {
    try {
      const res = await fetch('/api/data/read/roi_calculations', { credentials: 'include' });
      const data: { data?: ROICalculation[] } = await res.json();
      if (data.data && data.data.length > 0) {
        const sorted = data.data.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        setCalculations(sorted);
      } else {
        setCalculations(MOCK_ROI_CALCULATIONS);
      }
    } catch (err) {
      console.error('Failed to fetch ROI calculations:', err);
      setCalculations(MOCK_ROI_CALCULATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalculations();
  }, [fetchCalculations]);

  const parseCalcs = (str?: string): ROIMetrics | null => {
    if (!str) return null;
    try { return JSON.parse(str); } catch { return null; }
  };

  // Filters
  const filtered = calculations.filter(c => {
    if (filter === 'withEmail') return c.email_captured === 1;
    if (filter === 'reportRequested') return c.report_requested === 1;
    if (filter === 'discovery') return c.selected_tier === 'discovery';
    if (filter === 'foundation') return c.selected_tier === 'foundation';
    if (filter === 'architect') return c.selected_tier === 'architect';
    return true;
  }).filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.industry.toLowerCase().includes(q) ||
           (c.email && c.email.toLowerCase().includes(q)) ||
           c.employee_count.toLowerCase().includes(q);
  });

  // Stats
  const totalCalcs = calculations.length;
  const emailsCount = calculations.filter(c => c.email_captured === 1).length;

  const avgROI = totalCalcs > 0
    ? Math.round(
        calculations.reduce((sum, c) => {
          const calcs = parseCalcs(c.calculations);
          return sum + (calcs?.roi || 0);
        }, 0) / totalCalcs
      )
    : 0;

  const tierCounts: Record<string, number> = {};
  calculations.forEach(c => {
    if (c.selected_tier) {
      tierCounts[c.selected_tier] = (tierCounts[c.selected_tier] || 0) + 1;
    }
  });
  const popularTier = Object.entries(tierCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const getTierLabel = (tier?: string) => {
    switch (tier) {
      case 'discovery': return t.roiCalculations.tiers.discovery;
      case 'foundation': return t.roiCalculations.tiers.foundation;
      case 'architect': return t.roiCalculations.tiers.architect;
      default: return '—';
    }
  };

  const getTierClass = (tier?: string) => {
    switch (tier) {
      case 'discovery': return 'stage-discovery';
      case 'foundation': return 'stage-contacted';
      case 'architect': return 'stage-negotiation';
      default: return '';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const filterTabs = [
    { key: 'all', label: t.roiCalculations.all },
    { key: 'withEmail', label: t.roiCalculations.withEmail },
    { key: 'reportRequested', label: t.roiCalculations.reportRequested },
    { key: 'discovery', label: t.roiCalculations.tiers.discovery },
    { key: 'foundation', label: t.roiCalculations.tiers.foundation },
    { key: 'architect', label: t.roiCalculations.tiers.architect },
  ];

  return (
    <DashboardLayout>
      <div className="page-content">
        <PageHeader
          title={t.roiCalculations.title}
          subtitle={t.roiCalculations.subtitle}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--space-gap)] mb-[var(--space-section)]">
          <StatCard
            label={t.roiCalculations.totalCalculations}
            value={totalCalcs.toString()}
            icon={<CalculatorIcon className="w-6 h-6" />}
          />
          <StatCard
            label={t.roiCalculations.avgROI}
            value={`${avgROI}%`}
            icon={<TrendUpIcon className="w-6 h-6" />}
          />
          <StatCard
            label={t.roiCalculations.emailsCaptured}
            value={emailsCount.toString()}
            icon={<EmailCaptureIcon className="w-6 h-6" />}
          />
          <StatCard
            label={t.roiCalculations.popularTier}
            value={getTierLabel(popularTier)}
            icon={<StarIcon className="w-6 h-6" />}
          />
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-[var(--space-gap)]">
          <div className="flex bg-white/5 rounded-xl p-1 overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === tab.key
                    ? 'bg-primary-electricBlue text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="hidden md:block flex-1" />
          <input
            type="text"
            placeholder={t.common.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass w-full md:w-64"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="card p-12 text-center">
            <p className="text-white/60">{t.common.loading}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <CalculatorIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">{t.roiCalculations.noCalculations}</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-glass min-w-[850px]">
                <thead>
                  <tr>
                    <th>{t.roiCalculations.industry}</th>
                    <th>{t.roiCalculations.employees}</th>
                    <th>{t.roiCalculations.hourlyRate}</th>
                    <th>{t.roiCalculations.selectedTier}</th>
                    <th>{t.roiCalculations.projectedROI}</th>
                    <th>{t.roiCalculations.email}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((calc) => {
                    const metrics = parseCalcs(calc.calculations);
                    const isExpanded = expandedId === calc.id;

                    return (
                      <>
                        <tr
                          key={calc.id}
                          className="cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : calc.id)}
                        >
                          <td>
                            <div>
                              <p className="font-medium text-white text-sm">{calc.industry}</p>
                              <p className="text-xs text-white/40">{formatDate(calc.created_at)}</p>
                            </div>
                          </td>
                          <td className="text-white/80 text-sm">{calc.employee_count}</td>
                          <td className="text-white/80 text-sm">{formatCurrency(calc.hourly_rate)}/hr</td>
                          <td>
                            {calc.selected_tier ? (
                              <span className={`tag text-xs ${getTierClass(calc.selected_tier)}`}>
                                {getTierLabel(calc.selected_tier)}
                              </span>
                            ) : (
                              <span className="text-white/40 text-sm">—</span>
                            )}
                          </td>
                          <td>
                            {metrics?.roi ? (
                              <span className={`font-semibold text-sm ${
                                metrics.roi >= 200 ? 'text-functional-success' :
                                metrics.roi >= 100 ? 'text-accent-amber' :
                                'text-white/80'
                              }`}>
                                {metrics.roi}%
                              </span>
                            ) : (
                              <span className="text-white/40 text-sm">—</span>
                            )}
                          </td>
                          <td>
                            {calc.email_captured ? (
                              <div>
                                <p className="text-sm text-white truncate max-w-[160px]">{calc.email}</p>
                                {calc.report_requested === 1 && (
                                  <span className="tag tag-success text-[10px]">{t.roiCalculations.reportRequested}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-white/30 text-sm">—</span>
                            )}
                          </td>
                          <td>
                            <ChevronDownIcon className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${calc.id}-details`}>
                            <td colSpan={7}>
                              <div className="p-4 mx-2 mb-2 space-y-4">
                                {/* Input Parameters */}
                                <div>
                                  <p className="text-xs text-white/50 mb-2 uppercase tracking-wide">{t.roiCalculations.inputParameters}</p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-white/5 rounded-lg p-3">
                                      <p className="text-xs text-white/50">{t.roiCalculations.industry}</p>
                                      <p className="text-sm font-medium text-white mt-1">{calc.industry}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3">
                                      <p className="text-xs text-white/50">{t.roiCalculations.employees}</p>
                                      <p className="text-sm font-medium text-white mt-1">{calc.employee_count}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3">
                                      <p className="text-xs text-white/50">{t.roiCalculations.hourlyRate}</p>
                                      <p className="text-sm font-medium text-white mt-1">{formatCurrency(calc.hourly_rate)}/hr</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3">
                                      <p className="text-xs text-white/50">{t.roiCalculations.weeklyHours}</p>
                                      <p className="text-sm font-medium text-white mt-1">{calc.weekly_admin_hours}h{t.roiCalculations.perWeek}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Projected Results */}
                                {metrics && (
                                  <div>
                                    <p className="text-xs text-white/50 mb-2 uppercase tracking-wide">{t.roiCalculations.projectedResults}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                      {metrics.timeSaved !== undefined && (
                                        <div className="bg-primary-electricBlue/5 border border-primary-electricBlue/20 rounded-lg p-3">
                                          <p className="text-xs text-white/50">{t.roiCalculations.timeSaved}</p>
                                          <p className="text-lg font-bold text-primary-electricBlue mt-1">{metrics.timeSaved}h</p>
                                          <p className="text-[10px] text-white/40">{t.roiCalculations.perWeek}</p>
                                        </div>
                                      )}
                                      {metrics.weeklyValue !== undefined && (
                                        <div className="bg-primary-electricBlue/5 border border-primary-electricBlue/20 rounded-lg p-3">
                                          <p className="text-xs text-white/50">{t.roiCalculations.weeklyValue}</p>
                                          <p className="text-lg font-bold text-primary-electricBlue mt-1">{formatCurrency(metrics.weeklyValue)}</p>
                                          <p className="text-[10px] text-white/40">{t.roiCalculations.perWeek}</p>
                                        </div>
                                      )}
                                      {metrics.totalValue !== undefined && (
                                        <div className="bg-functional-success/5 border border-functional-success/20 rounded-lg p-3">
                                          <p className="text-xs text-white/50">{t.roiCalculations.totalValue}</p>
                                          <p className="text-lg font-bold text-functional-success mt-1">{formatCurrency(metrics.totalValue)}</p>
                                        </div>
                                      )}
                                      {metrics.investment !== undefined && (
                                        <div className="bg-white/5 rounded-lg p-3">
                                          <p className="text-xs text-white/50">{t.roiCalculations.investment}</p>
                                          <p className="text-lg font-bold text-white mt-1">{formatCurrency(metrics.investment)}</p>
                                        </div>
                                      )}
                                      {metrics.roi !== undefined && (
                                        <div className="bg-functional-success/5 border border-functional-success/20 rounded-lg p-3">
                                          <p className="text-xs text-white/50">{t.roiCalculations.projectedROI}</p>
                                          <p className="text-lg font-bold text-functional-success mt-1">{metrics.roi}%</p>
                                        </div>
                                      )}
                                      {metrics.paybackWeeks !== undefined && (
                                        <div className="bg-accent-amber/5 border border-accent-amber/20 rounded-lg p-3">
                                          <p className="text-xs text-white/50">{t.roiCalculations.paybackWeeks}</p>
                                          <p className="text-lg font-bold text-accent-amber mt-1">{metrics.paybackWeeks}</p>
                                          <p className="text-[10px] text-white/40">{t.roiCalculations.weeks}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Engagement metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <p className="text-xs text-white/50">{t.roiCalculations.selectedTier}</p>
                                    <p className="text-sm font-medium text-white mt-1">{getTierLabel(calc.selected_tier)}</p>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <p className="text-xs text-white/50">{t.roiCalculations.timeOnCalc}</p>
                                    <p className="text-sm font-medium text-white mt-1">{formatTime(calc.time_on_calculator)}</p>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <p className="text-xs text-white/50">{t.roiCalculations.adjustments}</p>
                                    <p className="text-sm font-medium text-white mt-1">{calc.adjustments_count}</p>
                                  </div>
                                  {calc.report_sent_at && (
                                    <div className="bg-white/5 rounded-lg p-3">
                                      <p className="text-xs text-white/50">{t.roiCalculations.reportSent}</p>
                                      <p className="text-sm font-medium text-white mt-1">{formatDate(calc.report_sent_at)}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Page-specific icons
function TrendUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function EmailCaptureIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
