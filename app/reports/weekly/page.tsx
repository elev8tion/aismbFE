'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { PipelineFunnel } from '@/components/dashboard/PipelineFunnel';
import { useTranslations } from '@/contexts/LanguageContext';

export const runtime = 'edge';

export default function WeeklyReportPage() {
  const { t } = useTranslations();
  
  // Mock aggregated data for the report
  const reportData = {
    week: 'Feb 2 - Feb 8, 2026',
    newLeads: 42,
    qualifiedLeads: 18,
    projectedPipelineValue: 185000,
    topSources: [
      { name: 'ROI Calculator', count: 15, conversion: '35%' },
      { name: 'Voice Agent', count: 12, conversion: '28%' },
      { name: 'Referral', count: 8, conversion: '60%' },
    ],
    funnelData: [
      { stage: t.pipeline.stages.newLead, count: 42, value: 84000, color: '#00E5FF' },
      { stage: t.pipeline.stages.contacted, count: 28, value: 56000, color: '#00B0FF' },
      { stage: t.pipeline.stages.discoveryCall, count: 18, value: 90000, color: '#2979FF' },
      { stage: t.pipeline.stages.proposalSent, count: 12, value: 72000, color: '#651FFF' },
      { stage: t.pipeline.stages.closedWon, count: 5, value: 45000, color: '#00C853' },
    ]
  };

  return (
    <DashboardLayout>
      <div className="page-content max-w-5xl mx-auto print:max-w-none print:p-0">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <PageHeader 
            title="Weekly Performance Report" 
            subtitle={reportData.week}
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
          <p className="text-gray-500">{reportData.week}</p>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="New Leads" value={reportData.newLeads.toString()} change={12} changeLabel="vs last week" />
          <StatCard label="Qualified" value={reportData.qualifiedLeads.toString()} change={5} changeLabel="vs last week" />
          <StatCard label="Pipeline Added" value={`$${reportData.projectedPipelineValue.toLocaleString()}`} change={8} changeLabel="vs last week" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Funnel Visualization */}
          <div className="card print:border print:border-gray-200 print:bg-white print:text-black">
            <h3 className="text-lg font-semibold text-white print:text-black mb-4">Pipeline Velocity</h3>
            <PipelineFunnel data={reportData.funnelData} />
          </div>

          {/* Lead Source Analysis */}
          <div className="card print:border print:border-gray-200 print:bg-white print:text-black">
            <h3 className="text-lg font-semibold text-white print:text-black mb-4">Top Lead Sources</h3>
            <div className="space-y-4">
              {reportData.topSources.map((source, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg print:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary-electricBlue/20 text-primary-electricBlue flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-white print:text-black">{source.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white print:text-black">{source.count} Leads</p>
                    <p className="text-xs text-white/50 print:text-gray-500">{source.conversion} Conv.</p>
                  </div>
                </div>
              ))}
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
            <li><strong>ROI Calculator</strong> is the highest converting channel. Recommend increasing ad spend on "Calculator" keywords.</li>
            <li><strong>Voice Agent</strong> sessions are lasting 20% longer. Review transcripts for new common questions to update the FAQ.</li>
            <li><strong>Pipeline Bottleneck:</strong> 12 deals stuck in "Proposal Sent". Action: Send automated case study follow-up.</li>
          </ul>
        </div>

      </div>
    </DashboardLayout>
  );
}
