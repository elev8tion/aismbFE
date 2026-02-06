'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, useCallback } from 'react';
import { VoiceIcon } from '@/components/icons';
import { VoiceSession, ConversationMessage } from '@/types/voice';
import { generateSessionInsights, AIInsight } from '@/lib/utils/aiInsights';
import { scoreVoiceSession, LeadScore } from '@/lib/utils/leadScoring';
import { createTaskFromSession } from '@/lib/utils/taskAutomation';

const MOCK_VOICE_SESSIONS: VoiceSession[] = [
  {
    id: 'vs-1',
    external_session_id: 'a3f8c2d1e9b4',
    start_time: '2026-02-05T14:23:00Z',
    end_time: '2026-02-05T14:29:45Z',
    duration: 405,
    language: 'en',
    device: 'desktop',
    referrer_page: 'kre8tion.com/pricing',
    total_questions: 7,
    sentiment: 'positive',
    outcome: 'booking_scheduled',
    messages: JSON.stringify([
      { role: 'assistant', content: 'Hey there! Welcome to KRE8TION. I\'m your AI assistant — ask me anything about how we help small businesses save time with automation.' },
      { role: 'user', content: 'How does the AI automation actually work for an HVAC company?' },
      { role: 'assistant', content: 'Great question! For HVAC companies, we typically automate three key areas: scheduling and dispatch, customer follow-ups, and invoice generation. Most HVAC businesses save 15-20 hours per week. Would you like me to walk through a specific example?' },
      { role: 'user', content: 'Yeah, tell me about the scheduling part' },
      { role: 'assistant', content: 'Sure! We build a custom AI system that handles incoming service requests — it reads the customer\'s issue, checks technician availability, and auto-schedules the optimal route. No more manual dispatching. One of our partners, a 12-person HVAC company, went from 3 hours/day on scheduling to about 15 minutes of oversight.' },
      { role: 'user', content: 'That sounds good. What does it cost?' },
      { role: 'assistant', content: 'We have three tiers: Discovery starts at $2,500 setup + $750/month for 2 months — that gets you 3 custom systems. Foundation is $5,000 + $1,500/month for 3 months with 6 systems. Most HVAC companies start with Discovery. Want to see your projected ROI?' },
      { role: 'user', content: 'How long until I see results?' },
      { role: 'assistant', content: 'Most partners see measurable time savings within the first 2 weeks of deployment. The full ROI typically materializes by week 4-6. Our Discovery tier partners average a 340% ROI over the engagement period.' },
      { role: 'user', content: 'OK I\'m interested. Can I book a call?' },
      { role: 'assistant', content: 'Absolutely! Let me take you to our booking page where you can schedule a free 30-minute strategy call. We\'ll review your specific workflows and show you exactly where automation can help.' },
    ]),
    topics: JSON.stringify(['HVAC automation', 'scheduling', 'pricing', 'ROI timeline']),
    pain_points: JSON.stringify(['manual scheduling', 'time-consuming dispatch']),
    objections: JSON.stringify([]),
    intents: JSON.stringify(['pricing_inquiry', 'service_understanding', 'booking_intent']),
    actions_taken: JSON.stringify(['SCROLL_TO_PRICING', 'SCROLL_TO_TESTIMONIALS', 'OPEN_BOOKING']),
  },
  {
    id: 'vs-2',
    external_session_id: 'b7e4f1a9c3d6',
    start_time: '2026-02-05T11:05:00Z',
    end_time: '2026-02-05T11:09:30Z',
    duration: 270,
    language: 'es',
    device: 'mobile',
    referrer_page: 'kre8tion.com',
    total_questions: 5,
    sentiment: 'positive',
    outcome: 'roi_calculator',
    messages: JSON.stringify([
      { role: 'assistant', content: '¡Hola! Bienvenido a KRE8TION. Soy tu asistente de IA — pregúntame lo que quieras sobre cómo ayudamos a las pequeñas empresas a ahorrar tiempo con automatización.' },
      { role: 'user', content: '¿Cómo pueden ayudar a una empresa de plomería?' },
      { role: 'assistant', content: '¡Excelente pregunta! Para empresas de plomería, automatizamos la programación de citas, seguimiento con clientes, y generación de cotizaciones. Las empresas de plomería típicamente ahorran 12-18 horas por semana.' },
      { role: 'user', content: '¿Cuánto cuesta?' },
      { role: 'assistant', content: 'Tenemos tres niveles. El nivel Descubrimiento empieza en $2,500 de instalación + $750/mes por 2 meses. Te construimos 3 sistemas personalizados. ¿Te gustaría ver cuánto podrías ahorrar con nuestra calculadora de ROI?' },
      { role: 'user', content: 'Sí, quiero ver los números' },
      { role: 'assistant', content: '¡Perfecto! Te llevo a nuestra calculadora de ROI donde puedes ingresar los datos de tu empresa y ver exactamente cuánto ahorrarías.' },
    ]),
    topics: JSON.stringify(['plumbing automation', 'pricing', 'ROI']),
    pain_points: JSON.stringify(['manual quoting', 'customer follow-up']),
    objections: JSON.stringify([]),
    intents: JSON.stringify(['pricing_inquiry', 'roi_interest']),
    actions_taken: JSON.stringify(['SCROLL_TO_ROI', 'OPEN_ROI_CALCULATOR']),
  },
  {
    id: 'vs-3',
    external_session_id: 'c9d2e5f8a1b7',
    start_time: '2026-02-04T16:42:00Z',
    end_time: '2026-02-04T16:47:15Z',
    duration: 315,
    language: 'en',
    device: 'desktop',
    referrer_page: 'google.com/search',
    total_questions: 4,
    sentiment: 'neutral',
    outcome: 'continued_browsing',
    messages: JSON.stringify([
      { role: 'assistant', content: 'Hey there! Welcome to KRE8TION. I\'m your AI assistant — how can I help you today?' },
      { role: 'user', content: 'What exactly is this? AI for small businesses?' },
      { role: 'assistant', content: 'Exactly! We partner with small businesses to build custom AI automation systems. Think of us as your AI department — we identify your biggest time-wasters and build systems that handle them automatically. Things like customer communication, scheduling, invoicing, lead follow-up, and more.' },
      { role: 'user', content: 'Is this like ChatGPT or something different?' },
      { role: 'assistant', content: 'Different! ChatGPT is a general chatbot. We build custom automation systems specifically for YOUR business workflows. For example, instead of just answering questions, our systems can actually process invoices, schedule appointments, send follow-ups, and generate reports — all automatically integrated with your existing tools.' },
      { role: 'user', content: 'What kind of businesses do you work with?' },
      { role: 'assistant', content: 'We specialize in service-based SMBs — HVAC, plumbing, construction, property management, electrical, landscaping, and similar trades. These businesses have the most repetitive admin work that AI can automate. Would you like to see case studies from businesses in your industry?' },
      { role: 'user', content: 'I\'ll look around the site first' },
      { role: 'assistant', content: 'Sounds good! Feel free to check out our pricing section and ROI calculator. I\'m here if you have any more questions.' },
    ]),
    topics: JSON.stringify(['general inquiry', 'AI explanation', 'target industries']),
    pain_points: JSON.stringify([]),
    objections: JSON.stringify(['confusion about AI vs ChatGPT']),
    intents: JSON.stringify(['general_inquiry', 'education']),
    actions_taken: JSON.stringify(['SCROLL_TO_SERVICES']),
  },
  {
    id: 'vs-4',
    external_session_id: 'd1a3b5c7e9f2',
    start_time: '2026-02-04T09:18:00Z',
    end_time: '2026-02-04T09:22:40Z',
    duration: 280,
    language: 'en',
    device: 'mobile',
    referrer_page: 'instagram.com',
    total_questions: 6,
    sentiment: 'negative',
    outcome: 'left_site',
    messages: JSON.stringify([
      { role: 'assistant', content: 'Hey there! Welcome to KRE8TION. I\'m your AI assistant — ask me anything about how we help small businesses.' },
      { role: 'user', content: 'How much does this cost?' },
      { role: 'assistant', content: 'We have three tiers: Discovery ($2,500 setup + $750/mo for 2 months = $4,000 total), Foundation ($5,000 + $1,500/mo for 3 months = $9,500), and Architect ($12,000 + $3,000/mo for 6 months = $30,000). Most small businesses start with Discovery.' },
      { role: 'user', content: 'That\'s too expensive for my budget' },
      { role: 'assistant', content: 'I understand budget is a concern. Here\'s the thing — our Discovery partners typically save 15+ hours per week. If your time is worth even $30/hour, that\'s $450/week in saved time, or about $3,600 over the 8-week engagement. The $4,000 investment usually pays for itself before the engagement ends.' },
      { role: 'user', content: 'I only have 2 employees, it\'s too much for us' },
      { role: 'assistant', content: 'Actually, smaller teams benefit the most! When you only have 2 people, every hour counts. Our systems can handle the work of an additional employee at a fraction of the cost. Would you like to try our ROI calculator to see the exact numbers for your situation?' },
      { role: 'user', content: 'No thanks, not right now' },
      { role: 'assistant', content: 'No problem at all! If you change your mind, we\'re here. You can also check out our free resources section for tips on automating your business workflows.' },
    ]),
    topics: JSON.stringify(['pricing', 'budget concerns', 'small team']),
    pain_points: JSON.stringify(['limited budget', 'small team size']),
    objections: JSON.stringify(['too expensive', 'team too small']),
    intents: JSON.stringify(['pricing_inquiry', 'objection']),
    actions_taken: JSON.stringify(['SCROLL_TO_PRICING']),
  },
  {
    id: 'vs-5',
    external_session_id: 'e4f6a8b2c0d3',
    start_time: '2026-02-03T13:55:00Z',
    end_time: '2026-02-03T14:03:20Z',
    duration: 500,
    language: 'en',
    device: 'desktop',
    referrer_page: 'kre8tion.com/blog',
    total_questions: 8,
    sentiment: 'positive',
    outcome: 'booking_scheduled',
    messages: JSON.stringify([
      { role: 'assistant', content: 'Hey there! Welcome to KRE8TION. I\'m your AI assistant — what can I help you with?' },
      { role: 'user', content: 'I run a property management company with 35 units. Can you help us?' },
      { role: 'assistant', content: 'Absolutely! Property management is one of our strongest areas. With 35 units, you\'re likely spending significant time on tenant communications, maintenance requests, rent reminders, and vendor coordination. We can automate all of that.' },
      { role: 'user', content: 'We spend so much time on maintenance requests and tenant emails' },
      { role: 'assistant', content: 'That\'s exactly what we solve. We build an AI system that triages maintenance requests — it categorizes urgency, dispatches to the right vendor, sends tenant updates, and tracks completion. For tenant emails, we set up auto-responses for common questions (lease terms, payment info, policies) while flagging anything that needs your personal attention.' },
      { role: 'user', content: 'What about rent collection and reminders?' },
      { role: 'assistant', content: 'Great thinking! We build automated rent reminder sequences — friendly reminders before due date, confirmations on payment, and escalation notices for late payments. One of our property management partners reduced late payments by 40% with this system alone.' },
      { role: 'user', content: 'That\'s impressive. Which tier would you recommend for us?' },
      { role: 'assistant', content: 'For 35 units, I\'d recommend Foundation tier. You\'d get 6 custom systems — enough to cover maintenance triage, tenant communications, rent automation, vendor management, lease renewal reminders, and reporting. The $9,500 investment typically saves property managers 20+ hours per week.' },
      { role: 'user', content: 'Can we start with Discovery and upgrade later?' },
      { role: 'assistant', content: 'Yes, absolutely! Many partners do exactly that. You can start with Discovery ($4,000) to get your top 3 systems built, see the results, then upgrade to Foundation for the remaining systems. Would you like to book a strategy call to map out which systems would have the biggest impact for your portfolio?' },
      { role: 'user', content: 'Yes, let\'s do it' },
      { role: 'assistant', content: 'Perfect! Let me take you to our booking calendar. You\'ll be meeting with our founder who will do a free workflow audit of your property management operations.' },
    ]),
    topics: JSON.stringify(['property management', 'maintenance automation', 'tenant comms', 'rent collection', 'tier recommendation']),
    pain_points: JSON.stringify(['maintenance request overload', 'tenant email volume', 'late rent payments']),
    objections: JSON.stringify([]),
    intents: JSON.stringify(['service_understanding', 'tier_comparison', 'booking_intent']),
    actions_taken: JSON.stringify(['SCROLL_TO_SERVICES', 'SCROLL_TO_PRICING', 'SCROLL_TO_TESTIMONIALS', 'OPEN_BOOKING']),
  },
  {
    id: 'vs-6',
    external_session_id: 'f2a4c6d8e0b1',
    start_time: '2026-02-03T10:30:00Z',
    end_time: '2026-02-03T10:33:10Z',
    duration: 190,
    language: 'es',
    device: 'tablet',
    referrer_page: 'facebook.com',
    total_questions: 3,
    sentiment: 'mixed',
    outcome: 'roi_calculator',
    messages: JSON.stringify([
      { role: 'assistant', content: '¡Hola! Bienvenido a KRE8TION. ¿En qué puedo ayudarte hoy?' },
      { role: 'user', content: 'Tengo una empresa de construcción pequeña. ¿Me pueden ayudar?' },
      { role: 'assistant', content: '¡Por supuesto! Trabajamos mucho con empresas de construcción. Automatizamos cotizaciones, seguimiento de proyectos, comunicación con clientes, y facturación. ¿Cuántos empleados tiene tu empresa?' },
      { role: 'user', content: 'Somos 8 personas. No estoy seguro si necesitamos IA' },
      { role: 'assistant', content: 'Entiendo la duda. Con 8 personas, probablemente alguien está dedicando varias horas al día a tareas administrativas — correos, cotizaciones, programación. Nuestra calculadora de ROI puede mostrarte exactamente cuántas horas y dinero ahorrarías. ¿Te gustaría probarla?' },
      { role: 'user', content: 'Bueno, vamos a ver' },
      { role: 'assistant', content: '¡Excelente! Te llevo a la calculadora. Solo necesitas ingresar tu industria, número de empleados, y valor por hora. Te mostrará los números exactos.' },
    ]),
    topics: JSON.stringify(['construction', 'team size', 'ROI']),
    pain_points: JSON.stringify(['admin overhead', 'manual quoting']),
    objections: JSON.stringify(['unsure if AI is needed']),
    intents: JSON.stringify(['general_inquiry', 'roi_interest']),
    actions_taken: JSON.stringify(['SCROLL_TO_ROI', 'OPEN_ROI_CALCULATOR']),
  },
  {
    id: 'vs-7',
    external_session_id: 'g5h7i9j1k3l5',
    start_time: '2026-02-02T15:12:00Z',
    end_time: '2026-02-02T15:16:50Z',
    duration: 290,
    language: 'en',
    device: 'desktop',
    referrer_page: 'linkedin.com',
    total_questions: 5,
    sentiment: 'positive',
    outcome: 'roi_calculator',
    messages: JSON.stringify([
      { role: 'assistant', content: 'Hey there! Welcome to KRE8TION. What brings you here today?' },
      { role: 'user', content: 'I saw your post on LinkedIn about AI for electricians. Tell me more.' },
      { role: 'assistant', content: 'Thanks for checking us out! For electrical contractors, we build AI systems that handle estimate generation, job scheduling, permit tracking, customer follow-ups, and warranty management. The average electrician we work with saves about 18 hours per week on admin work.' },
      { role: 'user', content: 'We currently use ServiceTitan. Would this replace it?' },
      { role: 'assistant', content: 'No, we integrate WITH ServiceTitan! Our AI systems sit on top of your existing tools and automate the repetitive tasks within them. Think of it as giving ServiceTitan superpowers — auto-generating estimates from photos, smart scheduling based on job complexity and location, automated customer updates, etc.' },
      { role: 'user', content: 'That makes more sense. What\'s the ROI look like for an electrical company?' },
      { role: 'assistant', content: 'For a typical electrical contractor with 10-25 employees, our Discovery partners see a 280-350% ROI. The $4,000 investment saves roughly $1,200-1,800 per week in labor costs. Want to plug in your specific numbers?' },
      { role: 'user', content: 'Yeah, let me try the calculator' },
      { role: 'assistant', content: 'Here you go! The ROI calculator will give you a personalized breakdown based on your team size, hourly rates, and the tier you\'re interested in.' },
    ]),
    topics: JSON.stringify(['electrical contracting', 'ServiceTitan integration', 'ROI']),
    pain_points: JSON.stringify(['admin overhead', 'manual estimates']),
    objections: JSON.stringify(['existing software concern']),
    intents: JSON.stringify(['service_understanding', 'integration_question', 'roi_interest']),
    actions_taken: JSON.stringify(['SCROLL_TO_SERVICES', 'SCROLL_TO_ROI', 'OPEN_ROI_CALCULATOR']),
  },
  {
    id: 'vs-8',
    external_session_id: 'm2n4o6p8q0r2',
    start_time: '2026-02-02T08:45:00Z',
    end_time: '2026-02-02T08:47:30Z',
    duration: 150,
    language: 'en',
    device: 'mobile',
    referrer_page: 'kre8tion.com',
    total_questions: 2,
    sentiment: 'neutral',
    outcome: 'left_site',
    messages: JSON.stringify([
      { role: 'assistant', content: 'Hey there! Welcome to KRE8TION. How can I help you today?' },
      { role: 'user', content: 'Are you guys hiring?' },
      { role: 'assistant', content: 'Thanks for your interest! We\'re always looking for talented people. You can reach us at connect@elev8tion.one with your resume and what role you\'re interested in. Is there anything else I can help with?' },
      { role: 'user', content: 'No that\'s it, thanks' },
      { role: 'assistant', content: 'You\'re welcome! Good luck with your job search. Have a great day!' },
    ]),
    topics: JSON.stringify(['hiring', 'careers']),
    pain_points: JSON.stringify([]),
    objections: JSON.stringify([]),
    intents: JSON.stringify(['job_inquiry']),
    actions_taken: JSON.stringify([]),
  },
];

export default function VoiceSessionsPage() {
  const { t } = useTranslations();
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creatingTaskId, setCreatingTaskId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/data/read/voice_sessions', { credentials: 'include' });
      const data: { data?: VoiceSession[] } = await res.json();
      if (data.data && data.data.length > 0) {
        const sorted = data.data.sort((a, b) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        );
        setSessions(sorted);
      } else {
        setSessions(MOCK_VOICE_SESSIONS);
      }
    } catch (err) {
      console.error('Failed to fetch voice sessions:', err);
      setSessions(MOCK_VOICE_SESSIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

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
                            <span className={`tag text-xs ${getOutcomeClass(session.outcome)}`}>
                              {getOutcomeLabel(session.outcome)}
                            </span>
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
