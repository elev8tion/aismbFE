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
  VoiceIcon, CalculatorIcon, PhoneIcon, EmailIcon, ChartIcon,
} from '@/components/icons';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { useState, useEffect, useCallback } from 'react';
import type { NCBListResponse } from '@/lib/types/api';

import { PipelineFunnel } from '@/components/dashboard/PipelineFunnel';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function DashboardPage() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    leads: 0,
    pipelineValue: 0,
    activePartners: 0,
    mrr: 0
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [oppsData, setOppsData] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Parallel fetch for speed
      const [leadsRes, oppsRes, partnersRes, activitiesRes] = await Promise.all([
        fetch('/api/data/read/leads', { credentials: 'include' }),
        fetch('/api/data/read/opportunities', { credentials: 'include' }),
        fetch('/api/data/read/partnerships', { credentials: 'include' }),
        fetch('/api/data/read/activities?limit=10', { credentials: 'include' }),
      ]);

      const [leads, opps, partners, acts] = await Promise.all([
        leadsRes.json(), oppsRes.json(), partnersRes.json(), activitiesRes.json()
      ]) as [NCBListResponse, NCBListResponse, NCBListResponse, NCBListResponse];

      const activePartners = (partners.data || []).filter((p: any) => p.status === 'active');
      const totalPipeline = (opps.data || []).reduce((sum: number, o: any) => sum + Number(o.total_contract_value || 0), 0);
      const totalMRR = activePartners.reduce((sum: number, p: any) => sum + Number(p.monthly_revenue || 0), 0);

      setStats({
        leads: (leads.data || []).length,
        pipelineValue: totalPipeline,
        activePartners: activePartners.length,
        mrr: totalMRR
      });

      setOppsData(opps.data || []);

      if (acts.data && acts.data.length > 0) {
        setActivities(acts.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user, fetchDashboardData]);

  const stageConfig = [
    { key: 'new-lead', label: t.pipeline.stages.newLead, color: '#00E5FF' },
    { key: 'contacted', label: t.pipeline.stages.contacted, color: '#00B0FF' },
    { key: 'discovery-call', label: t.pipeline.stages.discoveryCall, color: '#2979FF' },
    { key: 'proposal-sent', label: t.pipeline.stages.proposalSent, color: '#651FFF' },
    { key: 'negotiation', label: t.pipeline.stages.negotiation, color: '#7C4DFF' },
    { key: 'closed-won', label: t.pipeline.stages.closedWon, color: '#00C853' },
  ];

  const funnelData = stageConfig.map(({ key, label, color }) => {
    const stageOpps = oppsData.filter((o: any) => o.stage === key);
    return {
      stage: label,
      count: stageOpps.length,
      value: stageOpps.reduce((sum: number, o: any) => sum + Number(o.total_contract_value || 0), 0),
      color,
    };
  });

  return (
    <DashboardLayout>
      <ErrorBoundary>
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
            value={stats.leads.toString()}
            change={12}
            changeLabel={t.dashboard.vsLastMonth}
            icon={<LeadsStatIcon className="w-6 h-6" />}
          />
          <StatCard
            label={t.dashboard.pipelineValue}
            value={`$${stats.pipelineValue.toLocaleString()}`}
            change={15}
            changeLabel={t.dashboard.vsLastMonth}
            icon={<PipelineStatIcon className="w-6 h-6" />}
          />
          <StatCard
            label={t.dashboard.activePartners}
            value={stats.activePartners.toString()}
            change={2}
            changeLabel={t.dashboard.newThisMonth}
            icon={<PartnersStatIcon className="w-6 h-6" />}
          />
          <StatCard
            label={t.dashboard.mrr}
            value={`$${stats.mrr.toLocaleString()}`}
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
              <Link href="/leads" className="btn-ghost text-sm">{t.dashboard.viewAll}</Link>
            </div>
            <div className="space-y-4">
              {activities.length > 0 ? activities.map((act, i) => (
                <ActivityItem
                  key={act.id || i}
                  icon={act.type === 'call' ? <PhoneIcon className="w-4 h-4" /> :
                        act.type === 'email' ? <EmailIcon className="w-4 h-4" /> :
                        act.type === 'task' ? <ChartIcon className="w-4 h-4" /> :
                        <VoiceIcon className="w-4 h-4" />}
                  title={act.subject || act.description || 'Activity'}
                  subtitle={act.description}
                  time={new Date(act.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
              )) : (
                <>
                  <ActivityItem
                    icon={<div className="relative"><VoiceIcon className="w-4 h-4" /><span className="absolute -top-1 -right-1 w-2 h-2 bg-functional-error rounded-full animate-pulse" /></div>}
                    title="LIVE: Voice session - Miami Plumbing"
                    subtitle="Customer asking about emergency rates"
                    time="Just now"
                    statusIcon={<span className="text-[10px] bg-functional-error/20 text-functional-error px-1.5 py-0.5 rounded font-bold animate-pulse">LIVE</span>}
                  />
                  <ActivityItem
                    icon={<VoiceIcon className="w-4 h-4" />}
                    title="Voice session - ABC Plumbing"
                    subtitle="5 questions, Spanish"
                    time="2m ago"
                    statusIcon={<span title="Hot Lead" className="text-lg">🔥</span>}
                  />
                </>
              )}
            </div>
          </div>

          {/* Tasks Due Today */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-white">{t.dashboard.tasksDueToday}</h2>
              <Link href="/leads" className="btn-ghost text-sm">{t.dashboard.viewAll}</Link>
            </div>
            <div className="space-y-3">
              {activities.filter((act: any) => act.type === 'task' || act.type === 'call' || act.type === 'meeting').length > 0 ? (
                activities
                  .filter((act: any) => act.type === 'task' || act.type === 'call' || act.type === 'meeting')
                  .slice(0, 4)
                  .map((act: any, i: number) => (
                    <TaskItem
                      key={act.id || i}
                      title={act.subject || act.description || 'Task'}
                      type={act.type === 'call' ? 'call' : act.type === 'meeting' ? 'meeting' : 'task'}
                      priority={act.status === 'pending' ? 'high' : 'medium'}
                    />
                  ))
              ) : (
                <p className="text-sm text-white/40 py-4 text-center">{t.common.noData}</p>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="card mt-[var(--space-gap)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-[var(--space-gap)]">
            <h2 className="text-base md:text-lg font-semibold text-white">{t.dashboard.pipelineOverview}</h2>
            <Link href="/pipeline" className="btn-secondary text-sm w-full sm:w-auto">{t.dashboard.viewPipeline}</Link>
          </div>
          <ErrorBoundary>
            <PipelineFunnel data={funnelData} />
          </ErrorBoundary>
        </div>
      </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}


