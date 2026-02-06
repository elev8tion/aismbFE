'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActivityItem } from '@/components/ui/ActivityItem';
import { TaskItem } from '@/components/ui/TaskItem';
import { PipelineStage } from '@/components/ui/PipelineStage';
import { useTranslations } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  LeadsStatIcon, PipelineStatIcon, PartnersStatIcon, RevenueIcon,
  VoiceIcon, CalculatorIcon, PhoneIcon, EmailIcon,
} from '@/components/icons';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';

export default function DashboardPage() {
  const { t } = useTranslations();
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="page-content">
        <PageHeader
          title={t.dashboard.title}
          subtitle={<>{t.dashboard.welcome}, {user?.name || 'User'}</>}
        />

        <OnboardingChecklist />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--space-gap)] mb-[var(--space-section)]">
          <StatCard
            label={t.dashboard.newLeads}
            value="127"
            change={23}
            changeLabel={t.dashboard.vsLastMonth}
            icon={<LeadsStatIcon className="w-6 h-6" />}
          />
          <StatCard
            label={t.dashboard.pipelineValue}
            value="$245,000"
            change={15}
            changeLabel={t.dashboard.vsLastMonth}
            icon={<PipelineStatIcon className="w-6 h-6" />}
          />
          <StatCard
            label={t.dashboard.activePartners}
            value="18"
            change={2}
            changeLabel={t.dashboard.newThisMonth}
            icon={<PartnersStatIcon className="w-6 h-6" />}
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
              <Link href="/voice-sessions" className="btn-ghost text-sm">{t.dashboard.viewAll}</Link>
            </div>
            <div className="space-y-4">
              <ActivityItem
                icon={<VoiceIcon className="w-4 h-4" />}
                title="Voice session - ABC Plumbing"
                subtitle="5 questions, Spanish"
                time="2m ago"
                statusIcon={<span title="Hot Lead" className="text-lg">🔥</span>}
              />
              <ActivityItem
                icon={<CalculatorIcon className="w-4 h-4" />}
                title="ROI calc completed - XYZ HVAC"
                subtitle="$45K projected value"
                time="15m ago"
                statusIcon={<span title="Warm Lead" className="text-lg">☀️</span>}
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
                statusIcon={<span title="Engaged" className="text-lg">👀</span>}
              />
            </div>
          </div>

          {/* Tasks Due Today */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-white">{t.dashboard.tasksDueToday}</h2>
              <Link href="/leads" className="btn-ghost text-sm">{t.dashboard.viewAll}</Link>
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
            <Link href="/pipeline" className="btn-secondary text-sm w-full sm:w-auto">{t.dashboard.viewPipeline}</Link>
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


