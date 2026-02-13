'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, useCallback } from 'react';
import { VoiceIcon, LeadsStatIcon } from '@/components/icons';
import { VoiceSession, ConversationMessage, ParsedVoiceSession } from '@kre8tion/shared-types';
import Link from 'next/link';
import { generateSessionInsights, AIInsight } from '@/lib/utils/aiInsights';
import { scoreVoiceSession, LeadScore } from '@/lib/utils/leadScoring';
import { createTaskFromSession } from '@/lib/utils/taskAutomation';
import { useVoiceAgentActions } from '@/contexts/VoiceAgentActionsContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function VoiceSessionsPage() {
  const { t } = useTranslations();
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creatingTaskId, setCreatingTaskId] = useState<string | null>(null);
  const [sessionToLeadMap, setSessionToLeadMap] = useState<Record<string, boolean>>({});

  const fetchSessions = useCallback(async () => {
    try {
      const [sessionsRes, leadsRes] = await Promise.all([
        fetch('/api/data/read/voice_sessions', { credentials: 'include' }),
        fetch('/api/data/read/leads', { credentials: 'include' }),
      ]);
      const [sessionsData, leadsData]: any[] = await Promise.all([
        sessionsRes.json(), leadsRes.json(),
      ]);

      // Build reverse lookup: which sessions have generated leads
      const leadMap: Record<string, boolean> = {};
      (leadsData.data || []).forEach((lead: any) => {
        if (lead.voice_session_id) {
          leadMap[String(lead.voice_session_id)] = true;
        }
      });
      setSessionToLeadMap(leadMap);

      const sorted = (sessionsData.data || []).sort((a: VoiceSession, b: VoiceSession) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
      setSessions(sorted);
    } catch (err) {
      console.error('Failed to fetch voice sessions:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Voice actions
  const { subscribe } = useVoiceAgentActions();
  useEffect(() => {
    const unsub = subscribe((action) => {
      if (!action || action.type !== 'ui_action' || action.scope !== 'voice_sessions') return;
      const a = action.action;
      const payload = (action.payload || {}) as any;
      if (a === 'set_filter' && typeof payload.filter === 'string') {
        setFilter(payload.filter);
      } else if (a === 'search' && typeof payload.query === 'string') {
        setSearch(payload.query);
      } else if (a === 'open_view') {
        const { id, query } = payload as { id?: string; query?: string };
        let match: VoiceSession | undefined;
        if (id) match = sessions.find(s => String(s.id) === String(id));
        if (!match && query) {
          const q = String(query).toLowerCase();
          match = sessions.find(s => (
            s.external_session_id.toLowerCase().includes(q)
          ));
        }
        if (match) setExpandedId(match.id);
      }
    });
    return () => { unsub(); };
  }, [subscribe, sessions]);

  // Parse JSON fields safely
  const parseJSON = <T,>(str?: string): T | null => {
    if (!str) return null;
    try { return JSON.parse(str); } catch { return null; }
  };

  // Filters
  const filtered = sessions.filter(s => {
    if (filter === 'positive') return s.sentiment === 'positive';
    if (filter === 'neutral') return s.sentiment === 'neutral';
    if (filter === 'negative') return s.sentiment === 'negative';
    if (filter === 'en') return s.language === 'en';
    if (filter === 'es') return s.language === 'es';
    return true;
  }).filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    const topics = parseJSON<string[]>(s.topics) || [];
    const painPoints = parseJSON<string[]>(s.pain_points) || [];
    return s.external_session_id.toLowerCase().includes(q) ||
           topics.some(t => t.toLowerCase().includes(q)) ||
           painPoints.some(p => p.toLowerCase().includes(q));
  });

  // Stats
  const totalSessions = sessions.length;
  const avgDuration = totalSessions > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessions)
    : 0;
  const positiveCount = sessions.filter(s => s.sentiment === 'positive').length;
  const positiveRate = totalSessions > 0 ? Math.round((positiveCount / totalSessions) * 100) : 0;
  const totalQuestions = sessions.reduce((sum, s) => sum + (s.total_questions || 0), 0);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}${t.voiceSessions.minutes} ${secs}${t.voiceSessions.seconds}`;
    return `${secs}${t.voiceSessions.seconds}`;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  };

  const getSentimentClass = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'tag-success';
      case 'negative': return 'tag-error';
      case 'mixed': return 'tag-warning';
      default: return '';
    }
  };

  const getSentimentLabel = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return t.voiceSessions.sentiments.positive;
      case 'neutral': return t.voiceSessions.sentiments.neutral;
      case 'negative': return t.voiceSessions.sentiments.negative;
      case 'mixed': return t.voiceSessions.sentiments.mixed;
      default: return '—';
    }
  };

  const getOutcomeLabel = (outcome?: string) => {
    switch (outcome) {
      case 'continued_browsing': return t.voiceSessions.outcomes.continuedBrowsing;
      case 'roi_calculator': return t.voiceSessions.outcomes.roiCalculator;
      case 'booking_scheduled': return t.voiceSessions.outcomes.bookingScheduled;
      case 'left_site': return t.voiceSessions.outcomes.leftSite;
      default: return t.voiceSessions.outcomes.unknown;
    }
  };

  const getOutcomeClass = (outcome?: string) => {
    switch (outcome) {
      case 'booking_scheduled': return 'tag-success';
      case 'roi_calculator': return 'tag-warning';
      case 'left_site': return 'tag-error';
      default: return '';
    }
  };

  const getDeviceLabel = (device?: string) => {
    switch (device) {
      case 'desktop': return t.voiceSessions.devices.desktop;
      case 'mobile': return t.voiceSessions.devices.mobile;
      case 'tablet': return t.voiceSessions.devices.tablet;
      default: return '—';
    }
  };

  // Helper for Lead Score Icon
  const getScoreIcon = (level: LeadScore['level']) => {
    switch (level) {
      case 'fire': return <span className="text-xl">🔥</span>;
      case 'hot': return <span className="text-xl">🌡️</span>;
      case 'warm': return <span className="text-xl">☀️</span>;
      case 'cold': return <span className="text-xl">❄️</span>;
    }
  };

  const filterTabs = [
    { key: 'all', label: t.voiceSessions.all },
    { key: 'positive', label: t.voiceSessions.positive },
    { key: 'neutral', label: t.voiceSessions.neutral },
    { key: 'negative', label: t.voiceSessions.negative },
    { key: 'en', label: t.voiceSessions.english },
    { key: 'es', label: t.voiceSessions.spanish },
  ];

  const handleCreateTask = async (session: VoiceSession) => {
    setCreatingTaskId(session.id);
    const task = createTaskFromSession(session);
    
    try {
      const res = await fetch('/api/data/create/activities', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          title: task.title,
          description: task.description,
          status: 'pending',
          priority: task.priority,
          metadata: JSON.stringify({ source: 'voice_session', sessionId: session.id }),
          due_date: task.dueDate,
        }),
      });

      if (res.ok) {
        alert('Success: Task added to your dashboard.');
      } else {
        throw new Error('Failed to create task');
      }
    } catch (err) {
      console.error('Task creation error:', err);
      alert('Error: Could not save task to database.');
    } finally {
      setCreatingTaskId(null);
    }
  };

  return (
    <DashboardLayout>
      <ErrorBoundary>
      <div className="page-content">
        <PageHeader
          title={t.voiceSessions.title}
          subtitle={t.voiceSessions.subtitle}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--space-gap)] mb-[var(--space-section)]">
          <StatCard
            label={t.voiceSessions.totalSessions}
            value={totalSessions.toString()}
            icon={<VoiceIcon className="w-6 h-6" />}
          />
          <StatCard
            label={t.voiceSessions.avgDuration}
            value={formatDuration(avgDuration)}
            icon={<ClockIcon className="w-6 h-6" />}
          />
          <StatCard
            label={t.voiceSessions.positiveRate}
            value={`${positiveRate}%`}
            icon={<SmileIcon className="w-6 h-6" />}
          />
          <StatCard
            label={t.voiceSessions.questionsAsked}
            value={totalQuestions.toString()}
            icon={<QuestionIcon className="w-6 h-6" />}
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

        {/* Sessions Table */}
        {loading ? (
          <div className="card p-12 text-center">
            <p className="text-white/60">{t.common.loading}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <VoiceIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">{t.voiceSessions.noSessions}</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-glass min-w-[800px]">
                <thead>
                  <tr>
                    <th>{t.voiceSessions.session}</th>
                    <th>{t.voiceSessions.language}</th>
                    <th>{t.voiceSessions.duration}</th>
                    <th>{t.voiceSessions.questions}</th>
                    <th>{t.voiceSessions.sentiment}</th>
                    <th>{t.voiceSessions.outcome}</th>
                    <th>Score</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((session) => {
                    const messages = parseJSON<ConversationMessage[]>(session.messages);
                    const topics = parseJSON<string[]>(session.topics);
                    const painPoints = parseJSON<string[]>(session.pain_points);
                    const objections = parseJSON<string[]>(session.objections);
                    const actions = parseJSON<string[]>(session.actions_taken);
                    const isExpanded = expandedId === session.id;
                    const leadScore = scoreVoiceSession(session);
                    const aiInsight = isExpanded ? generateSessionInsights(session) : null;

                    return (
                      <>
                        <tr
                          key={session.id}
                          className="cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : session.id)}
                        >
                          <td>
                            <div>
                              <p className="font-medium text-white text-sm">
                                {formatDateTime(session.start_time)}
                              </p>
                              <p className="text-xs text-white/40 font-mono">
                                {session.external_session_id.slice(0, 12)}...
                              </p>
                            </div>
                          </td>
                          <td>
                            <span className="tag text-xs">
                              {session.language === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
                            </span>
                          </td>
                          <td className="text-white/80 text-sm">
                            {formatDuration(session.duration || 0)}
                          </td>
                          <td className="text-white/80 text-sm text-center">
                            {session.total_questions}
                          </td>
                          <td>
                            <span className={`tag text-xs ${getSentimentClass(session.sentiment)}`}>
                              {getSentimentLabel(session.sentiment)}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`tag text-xs ${getOutcomeClass(session.outcome)}`}>
                                {getOutcomeLabel(session.outcome)}
                              </span>
                              {sessionToLeadMap[String(session.id)] && (
                                <Link href="/leads" className="tag tag-success text-[10px] flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                  <LeadsStatIcon className="w-3 h-3" /> Lead Created
                                </Link>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2" title={leadScore.reasons.join(', ')}>
                              {getScoreIcon(leadScore.level)}
                              <span className={`text-sm font-bold ${
                                leadScore.level === 'fire' ? 'text-orange-500' :
                                leadScore.level === 'hot' ? 'text-red-400' :
                                leadScore.level === 'warm' ? 'text-yellow-400' :
                                'text-blue-300'
                              }`}>
                                {leadScore.score}
                              </span>
                            </div>
                          </td>
                          <td>
                            <ChevronDownIcon className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </td>
                        </tr>
                        {isExpanded && aiInsight && (
                          <tr key={`${session.id}-details`}>
                            <td colSpan={8}>
                              <div className="p-4 mx-2 mb-2 bg-black/20 rounded-lg border border-white/5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                                
                                {/* Left Column: Meta & Tags */}
                                <div className="space-y-4">
                                  {/* Meta Grid */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 rounded-lg p-3">
                                      <p className="text-xs text-white/50 mb-1">{t.voiceSessions.device}</p>
                                      <p className="text-sm text-white">{getDeviceLabel(session.device)}</p>
                                    </div>
                                    {session.referrer_page && (
                                      <div className="bg-white/5 rounded-lg p-3">
                                        <p className="text-xs text-white/50 mb-1">{t.voiceSessions.referrer}</p>
                                        <p className="text-sm text-white truncate">{session.referrer_page}</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Topics */}
                                  {topics && topics.length > 0 && (
                                    <div className="bg-white/5 rounded-lg p-3">
                                      <p className="text-xs text-white/50 mb-2">{t.voiceSessions.topics}</p>
                                      <div className="flex flex-wrap gap-1">
                                        {topics.map((topic, i) => (
                                          <span key={i} className="tag text-xs">{topic}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Pain Points & Objections */}
                                  {((painPoints && painPoints.length > 0) || (objections && objections.length > 0)) && (
                                    <div className="bg-white/5 rounded-lg p-3 space-y-3">
                                      {painPoints && painPoints.length > 0 && (
                                        <div>
                                          <p className="text-xs text-white/50 mb-1">{t.voiceSessions.painPoints}</p>
                                          <div className="flex flex-wrap gap-1">
                                            {painPoints.map((pp, i) => (
                                              <span key={i} className="tag tag-warning text-xs">{pp}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {objections && objections.length > 0 && (
                                        <div>
                                          <p className="text-xs text-white/50 mb-1">{t.voiceSessions.objections}</p>
                                          <div className="flex flex-wrap gap-1">
                                            {objections.map((obj, i) => (
                                              <span key={i} className="tag tag-error text-xs">{obj}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Middle Column: Transcript */}
                                <div className="lg:col-span-1 flex flex-col h-full max-h-[500px]">
                                  <div className="bg-white/5 rounded-lg p-3 flex-1 overflow-hidden flex flex-col">
                                    <p className="text-xs text-white/50 mb-3 uppercase tracking-wide">{t.voiceSessions.transcript}</p>
                                    <div className="space-y-3 overflow-y-auto pr-2 flex-1">
                                      {messages && messages.map((msg, i) => (
                                        <div
                                          key={i}
                                          className={`flex gap-3 ${msg.role === 'user' ? '' : 'flex-row-reverse'}`}
                                        >
                                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                            msg.role === 'user'
                                              ? 'bg-primary-electricBlue/20 text-primary-electricBlue'
                                              : 'bg-functional-success/20 text-functional-success'
                                          }`}>
                                            {msg.role === 'user' ? 'V' : 'AI'}
                                          </div>
                                          <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                                            msg.role === 'user'
                                              ? 'bg-primary-electricBlue/10 text-white/90'
                                              : 'bg-white/5 text-white/80'
                                          }`}>
                                            {msg.content}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Right Column: AI Insights Panel */}
                                <div className="space-y-4">
                                  {/* AI Summary */}
                                  <div className="bg-gradient-to-br from-primary-electricBlue/10 to-primary-purple/10 border border-primary-electricBlue/20 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-lg">✨</span>
                                      <h3 className="text-sm font-semibold text-white">AI Executive Summary</h3>
                                    </div>
                                    <p className="text-sm text-white/80 leading-relaxed">
                                      {aiInsight.summary}
                                    </p>
                                  </div>

                                  {/* Next Best Action */}
                                  <div className="bg-white/5 border-l-4 border-functional-success rounded-r-lg p-4 relative group">
                                    <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Recommended Action</p>
                                    <p className="text-base font-bold text-white mb-1">{aiInsight.nextBestAction.action}</p>
                                    <p className="text-xs text-white/60 mb-3">{aiInsight.nextBestAction.reason}</p>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCreateTask(session);
                                      }}
                                      disabled={creatingTaskId === session.id}
                                      className="text-[10px] bg-functional-success/20 hover:bg-functional-success/40 text-functional-success px-2 py-1 rounded transition-colors uppercase font-bold tracking-wider disabled:opacity-50"
                                    >
                                      {creatingTaskId === session.id ? 'Saving...' : 'Add to Tasks'}
                                    </button>
                                  </div>

                                  {/* Intent Analysis */}
                                  <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-xs text-white/50 uppercase tracking-wide mb-3">Detected Intents</p>
                                    <div className="space-y-2">
                                      {aiInsight.topIntents.map((intent, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                          <span className="text-sm text-white/90">{intent.label}</span>
                                          <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                              <div 
                                                className="h-full bg-primary-electricBlue rounded-full" 
                                                style={{ width: `${intent.confidence * 100}%` }} 
                                              />
                                            </div>
                                            <span className="text-xs text-white/50">{Math.round(intent.confidence * 100)}%</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Emotional Arc Visualization */}
                                  <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-xs text-white/50 uppercase tracking-wide mb-3">Emotional Arc</p>
                                    <div className="flex items-end justify-between h-24 px-2">
                                      {aiInsight.emotionalArc.map((point, i) => (
                                        <div key={i} className="flex flex-col items-center gap-1 w-1/4">
                                          <div 
                                            className={`w-full mx-1 rounded-t-sm transition-all ${
                                              point.sentiment > 0.6 ? 'bg-functional-success/60' : 
                                              point.sentiment < 0.4 ? 'bg-functional-error/60' : 
                                              'bg-white/20'
                                            }`}
                                            style={{ height: `${point.sentiment * 100}%` }}
                                          />
                                          <span className="text-[10px] text-white/40">{point.label}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

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
      </ErrorBoundary>
    </DashboardLayout>
  );
}

// Page-specific icons
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SmileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function QuestionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
