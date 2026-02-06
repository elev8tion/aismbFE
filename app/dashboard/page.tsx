'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { useTranslations } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { t } = useTranslations();
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="page-content">
        {/* Header */}
        <div className="mb-[var(--space-section)]">
          <h1 className="text-xl md:text-2xl font-bold text-white">{t.dashboard.title}</h1>
          <p className="text-sm md:text-base text-white/60 mt-1">
            {t.dashboard.welcome}, {user?.name || 'User'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--space-gap)] mb-[var(--space-section)]">
          <StatCard
            label={t.dashboard.newLeads}
            value="127"
            change={23}
            changeLabel={t.dashboard.vsLastMonth}
            icon={<LeadsIcon className="w-6 h-6" />}
          />
          <StatCard
            label={t.dashboard.pipelineValue}
            value="$245,000"
            change={15}
            changeLabel={t.dashboard.vsLastMonth}
            icon={<PipelineIcon className="w-6 h-6" />}
          />
          <StatCard
            label={t.dashboard.activePartners}
            value="18"
            change={2}
            changeLabel={t.dashboard.newThisMonth}
            icon={<PartnersIcon className="w-6 h-6" />}
          />
          <StatCard
            label={t.dashboard.mrr}
            value="$12,500"
            change={8}
            changeLabel={t.dashboard.vsLastMonth}
            icon={<RevenueIcon className="w-6 h-6" />}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--space-gap)]">
          {/* Recent Activity */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-white">{t.dashboard.recentActivity}</h2>
              <button className="btn-ghost text-sm">{t.dashboard.viewAll}</button>
            </div>
            <div className="space-y-4">
              <ActivityItem
                icon={<VoiceIcon className="w-4 h-4" />}
                title="Voice session - ABC Plumbing"
                subtitle="5 questions, Spanish"
                time="2m ago"
              />
              <ActivityItem
                icon={<CalculatorIcon className="w-4 h-4" />}
                title="ROI calc completed - XYZ HVAC"
                subtitle="$45K projected value"
                time="15m ago"
              />
              <ActivityItem
                icon={<PhoneIcon className="w-4 h-4" />}
                title="Call logged - Johnson Construction"
                subtitle="Discovery call completed"
                time="30m ago"
              />
              <ActivityItem
                icon={<EmailIcon className="w-4 h-4" />}
                title="Email opened - Smith Property Mgmt"
                subtitle="ROI report email"
                time="1h ago"
              />
            </div>
          </div>

          {/* Tasks Due Today */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-white">{t.dashboard.tasksDueToday}</h2>
              <button className="btn-ghost text-sm">{t.dashboard.viewAll}</button>
            </div>
            <div className="space-y-3">
              <TaskItem
                title="Follow up: ABC Plumbing"
                type="call"
                priority="high"
              />
              <TaskItem
                title="Discovery call: XYZ HVAC"
                type="meeting"
                priority="high"
              />
              <TaskItem
                title="Send proposal: 123 Construction"
                type="email"
                priority="medium"
              />
              <TaskItem
                title="Review contract: Miller Services"
                type="task"
                priority="low"
              />
            </div>
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="card mt-[var(--space-gap)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-[var(--space-gap)]">
            <h2 className="text-base md:text-lg font-semibold text-white">{t.dashboard.pipelineOverview}</h2>
            <button className="btn-secondary text-sm w-full sm:w-auto">{t.dashboard.viewPipeline}</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[var(--space-gap)]">
            <PipelineStage label={t.pipeline.stages.newLead} count={12} value="$48,000" color="stage-new" />
            <PipelineStage label={t.pipeline.stages.contacted} count={8} value="$32,000" color="stage-contacted" />
            <PipelineStage label={t.pipeline.stages.discoveryCall} count={6} value="$54,000" color="stage-discovery" />
            <PipelineStage label={t.pipeline.stages.proposalSent} count={5} value="$47,500" color="stage-proposal" />
            <PipelineStage label={t.pipeline.stages.negotiation} count={3} value="$63,500" color="stage-negotiation" />
            <PipelineStage label={t.pipeline.stages.closedWon} count={4} value="$38,000" color="stage-won" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ActivityItem({ icon, title, subtitle, time }: { icon: React.ReactNode; title: string; subtitle: string; time: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className="p-2 rounded-lg bg-primary-electricBlue/10 text-primary-electricBlue">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <p className="text-xs text-white/50">{subtitle}</p>
      </div>
      <span className="text-xs text-white/40">{time}</span>
    </div>
  );
}

function TaskItem({ title, type, priority }: { title: string; type: string; priority: 'high' | 'medium' | 'low' }) {
  const priorityColors = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-orange-500/20 text-orange-400',
    low: 'bg-green-500/20 text-green-400',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
      <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-transparent" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{title}</p>
      </div>
      <span className={`tag text-xs ${priorityColors[priority]}`}>{priority}</span>
    </div>
  );
}

function PipelineStage({ label, count, value, color }: { label: string; count: number; value: string; color: string }) {
  return (
    <div className={`p-3 md:p-4 rounded-xl border ${color}`}>
      <p className="text-xs text-white/60 uppercase tracking-wide truncate">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-white mt-1">{count}</p>
      <p className="text-xs md:text-sm text-white/50 mt-1">{value}</p>
    </div>
  );
}

// Icons
function LeadsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PipelineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function PartnersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-1m0 0V6a2 2 0 012-2h10a2 2 0 012 2v7" />
    </svg>
  );
}

function RevenueIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function VoiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
