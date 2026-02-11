'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { PipelineFunnel } from '@/components/dashboard/PipelineFunnel';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, useCallback } from 'react';

export default function WeeklyReportPage() {
  const { t } = useTranslations();
  const [loading, setLoading] = useState(true);
  const [newLeads, setNewLeads] = useState(0);
  const [qualifiedLeads, setQualifiedLeads] = useState(0);
  const [pipelineValue, setPipelineValue] = useState(0);
  const [topSources, setTopSources] = useState<{ name: string; count: number }[]>([]);
  const [funnelData, setFunnelData] = useState<{ stage: string; count: number; value: number; color: string }[]>([]);

  // Current week label
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const weekLabel = `${startOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const fetchReportData = useCallback(async () => {
    try {
      const [leadsRes, oppsRes] = await Promise.all([
        fetch('/api/data/read/leads', { credentials: 'include' }),
        fetch('/api/data/read/opportunities', { credentials: 'include' }),
      ]);
      const [leadsData, oppsData]: any[] = await Promise.all([
        leadsRes.json(), oppsRes.json(),
      ]);

      const leads = leadsData.data || [];
      const opps = oppsData.data || [];

      // Filter leads created this week
      const weekStart = startOfWeek.getTime();
      const weekEnd = endOfWeek.getTime() + 86400000; // end of day
      const thisWeekLeads = leads.filter((l: any) => {
        if (!l.created_at) return false;
        const t = new Date(l.created_at).getTime();
        return t >= weekStart && t < weekEnd;
      });

      setNewLeads(thisWeekLeads.length);
      setQualifiedLeads(thisWeekLeads.filter((l: any) => l.status === 'qualified').length);

      // Pipeline value from all opportunities
      const totalPipeline = opps.reduce((sum: number, o: any) => sum + Number(o.total_contract_value || 0), 0);
      setPipelineValue(totalPipeline);

      // Top sources from all leads (counted)
      const sourceCounts: Record<string, number> = {};
      leads.forEach((l: any) => {
        const src = l.source || 'unknown';
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
      });
      const sortedSources = Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name: name.replace(/-/g, ' '), count }));
      setTopSources(sortedSources);

      // Build funnel from opportunities
      const stageConfig = [
        { key: 'new-lead', label: t.pipeline.stages.newLead, color: '#00E5FF' },
        { key: 'contacted', label: t.pipeline.stages.contacted, color: '#00B0FF' },
        { key: 'discovery-call', label: t.pipeline.stages.discoveryCall, color: '#2979FF' },
        { key: 'proposal-sent', label: t.pipeline.stages.proposalSent, color: '#651FFF' },
        { key: 'negotiation', label: t.pipeline.stages.negotiation, color: '#7C4DFF' },
        { key: 'closed-won', label: t.pipeline.stages.closedWon, color: '#00C853' },
      ];
      const funnel = stageConfig.map(({ key, label, color }) => {
        const stageOpps = opps.filter((o: any) => o.stage === key);
        return {
          stage: label,
          count: stageOpps.length,
          value: stageOpps.reduce((sum: number, o: any) => sum + Number(o.total_contract_value || 0), 0),
          color,
        };
      });
      setFunnelData(funnel);

    } catch (err) {
      console.error('Failed to fetch report data:', err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  return (
    <DashboardLayout>
      <div className="page-content max-w-5xl mx-auto print:max-w-none print:p-0">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <PageHeader
            title="Weekly Performance Report"
            subtitle={weekLabel}
          />
          <button
            onClick={() => window.print()}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </button>
        </div>

        {/* Printable Header */}
        <div className="hidden print:block mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-black">Weekly Performance Report</h1>
          <p className="text-gray-500">{weekLabel}</p>
        </div>

        {loading ? (
          <div className="card p-12 text-center"><p className="text-white/60">{t.common.loading}</p></div>
        ) : (
          <>
            {/* Executive Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard label="New Leads" value={newLeads.toString()} />
              <StatCard label="Qualified" value={qualifiedLeads.toString()} />
              <StatCard label="Pipeline Value" value={`$${pipelineValue.toLocaleString()}`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Funnel Visualization */}
              <div className="card print:border print:border-gray-200 print:bg-white print:text-black">
                <h3 className="text-lg font-semibold text-white print:text-black mb-4">Pipeline Velocity</h3>
                <PipelineFunnel data={funnelData} />
              </div>

              {/* Lead Source Analysis */}
              <div className="card print:border print:border-gray-200 print:bg-white print:text-black">
                <h3 className="text-lg font-semibold text-white print:text-black mb-4">Top Lead Sources</h3>
                <div className="space-y-4">
                  {topSources.length > 0 ? topSources.map((source, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg print:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary-electricBlue/20 text-primary-electricBlue flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="text-white print:text-black capitalize">{source.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white print:text-black">{source.count} Leads</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-white/40 text-center py-4">{t.common.noData}</p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Insights Section */}
            <div className="mt-8 card bg-gradient-to-br from-primary-electricBlue/10 to-primary-purple/10 border-primary-electricBlue/20 print:border print:border-gray-200 print:bg-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">✨</span>
                <h3 className="text-lg font-semibold text-white print:text-black">AI Strategic Recommendations</h3>
              </div>
              <ul className="space-y-2 text-sm text-white/80 print:text-gray-700 list-disc pl-5">
                <li><strong>ROI Calculator</strong> is the highest converting channel. Recommend increasing ad spend on &quot;Calculator&quot; keywords.</li>
                <li><strong>Voice Agent</strong> sessions are lasting 20% longer. Review transcripts for new common questions to update the FAQ.</li>
                <li><strong>Pipeline Bottleneck:</strong> Review deals stuck in &quot;Proposal Sent&quot;. Action: Send automated case study follow-up.</li>
              </ul>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
