import { NextRequest, NextResponse } from 'next/server';
import { getOptionalRequestContext } from '@cloudflare/next-on-pages';
import { createOpenAI, buildChatParams } from '@/lib/openai/config';
import { validateQuestion, detectPromptInjection } from '@/lib/security/requestValidator';
import { getSessionUser, extractAuthCookies, type NCBEnv } from '@/lib/agent/ncbClient';
import { checkRateLimit, getClientIP } from '@/lib/security/rateLimiter.kv';
import { selectModel } from '@/lib/agent/modelRouter';
import { getSession, addMessage } from '@/lib/agent/session';
import { getCachedResponse, setCachedResponse } from '@/lib/agent/responseCache';
import { ALL_CRM_FUNCTIONS } from '@/lib/agent/functions';
import { executeTool } from '@/lib/agent/tools';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export const runtime = 'edge';

// ─── Language-specific system prompts ──────────────────────────────────────

const GUIDELINES = `Guidelines:
- Be concise. Responses will be spoken aloud — keep them under 2-3 sentences.
- CRITICAL: NEVER call a create/write tool (create_partnership, create_lead, create_contact, create_company, create_opportunity, create_task, log_activity, run_roi_calculation, bulk_update_lead_status, bulk_assign_leads) unless the user EXPLICITLY asks to create, add, or log something. Merely mentioning a topic is NOT a create request. When in doubt, ask first.
- When executing write operations (create, update, delete), always confirm the action and summarize what was done.
- For read operations, summarize the key numbers and highlight anything noteworthy.
- If a request is ambiguous, ask ONE clarifying question before acting.
- Use natural, conversational language. Avoid technical jargon.
- When presenting numbers, round to whole numbers and use plain language ("about fifty leads" not "49.7 leads").
- Never expose raw IDs to the user. Refer to records by name.
- If a tool returns an error, explain the issue simply and suggest what to do.
- Prefer using an id if you have it; otherwise pass a short query string and the client will pick the first match.`;

const SYSTEM_PROMPT_EN = `You are the AI Voice Operator for a CRM system. You help users manage their business by executing CRM operations through voice commands. You MUST respond ONLY in English.

${GUIDELINES}

Navigation:
- When the user asks to open, go to, show, or take me to a section, call the navigate tool with a target from the allowed list.
- Only call the navigate tool when the intent to change pages is explicit — do not navigate if the user is merely discussing a section.
- Synonyms:
  - dashboard → target: dashboard
  - leads/prospects → target: leads
  - contacts/people → target: contacts
  - companies/accounts/organizations → target: companies
  - pipeline/deals/opportunities → target: pipeline
  - bookings/calendar/appointments → target: bookings
  - partnerships/alliances → target: partnerships
  - drafts/notes/notepad → target: drafts
  - voice sessions/voice transcripts → target: voice_sessions
  - ROI calculator/ROI → target: roi_calculations
  - weekly report/reports → target: reports_weekly (ask to clarify if just "reports")
  - settings/preferences → target: settings
  - availability (calendar availability) → target: bookings_availability
- If the user says just "reports" or otherwise ambiguous terms, ask one clarifying question before navigating.

On-page UI actions:
- When the user asks to filter, search, open a new form, or open/edit a record on the current page, call the corresponding ui_* tool with the appropriate scope.
- "filter to qualified" → ui_set_filter { scope: 'leads', filter: 'qualified' }
- "search for Maria" → ui_search { scope: 'leads', query: 'maria' }
- "new lead" → ui_open_new { scope: 'leads' }
- "edit John" → ui_open_edit { scope: 'leads', query: 'john' }
`;

const SYSTEM_PROMPT_ES = `Eres el Operador de Voz IA para un sistema CRM. Ayudas a los usuarios a gestionar su negocio mediante comandos de voz. DEBES responder SOLO en español.

${GUIDELINES}

Navegación:
- Cuando el usuario pida abrir, ir a, mostrar o llevar a una sección, llama al tool navigate con un target de la lista.
- Solo llama navigate cuando la intención de cambiar página es explícita — no navegues si el usuario solo menciona una sección.
- Sinónimos:
  - panel/tablero → target: dashboard
  - leads/prospectos/clientes potenciales → target: leads
  - contactos/personas → target: contacts
  - empresas/compañías/organizaciones → target: companies
  - embudo/acuerdos/oportunidades → target: pipeline
  - reservas/calendario/citas/agenda → target: bookings
  - alianzas/socios → target: partnerships
  - borradores/notas/bloc de notas → target: drafts
  - sesiones de voz/registros del agente de voz → target: voice_sessions
  - calculadora de ROI → target: roi_calculations
  - reporte semanal/informes → target: reports_weekly (preguntar si solo dice "informes")
  - configuración/ajustes → target: settings
  - disponibilidad → target: bookings_availability
- Si el usuario dice solo "informes" o algo ambiguo, haz una pregunta aclaratoria antes de navegar.

Acciones de UI en la página:
- Cuando el usuario pida filtrar, buscar, abrir un formulario nuevo, o abrir/editar un registro, llama al tool ui_* correspondiente con el scope apropiado.
- "filtra a calificados" → ui_set_filter { scope: 'leads', filter: 'qualified' }
- "buscar Maria" → ui_search { scope: 'leads', query: 'maria' }
- "nuevo lead" → ui_open_new { scope: 'leads' }
- "editar John" → ui_open_edit { scope: 'leads', query: 'john' }
`;

// ─── Few-shot examples — English only ──────────────────────────────────────

const FEWSHOTS_EN = [
  // Navigation: pipeline
  { role: 'user', content: 'Open pipeline' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'en1', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'pipeline' }) } } ] },
  { role: 'tool', tool_call_id: 'en1', content: JSON.stringify({ ok: true, target: 'pipeline', route: '/pipeline', client_action: { type: 'navigate', route: '/pipeline', target: 'pipeline' } }) },
  { role: 'assistant', content: 'Opening pipeline.' },

  // Navigation: leads
  { role: 'user', content: 'Open leads' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'en2', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'leads' }) } } ] },
  { role: 'tool', tool_call_id: 'en2', content: JSON.stringify({ ok: true, target: 'leads', route: '/leads', client_action: { type: 'navigate', route: '/leads', target: 'leads' } }) },
  { role: 'assistant', content: 'Opening leads.' },

  // Navigation: contacts
  { role: 'user', content: 'Go to contacts' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'en3', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'contacts' }) } } ] },
  { role: 'tool', tool_call_id: 'en3', content: JSON.stringify({ ok: true, target: 'contacts', route: '/contacts', client_action: { type: 'navigate', route: '/contacts', target: 'contacts' } }) },
  { role: 'assistant', content: 'Opening contacts.' },

  // Navigation: availability
  { role: 'user', content: 'Show availability' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'en4', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'bookings_availability' }) } } ] },
  { role: 'tool', tool_call_id: 'en4', content: JSON.stringify({ ok: true, target: 'bookings_availability', route: '/bookings/availability', client_action: { type: 'navigate', route: '/bookings/availability', target: 'bookings_availability' } }) },
  { role: 'assistant', content: 'Opening availability.' },

  // Navigation: ROI calculator
  { role: 'user', content: 'Open ROI calculator' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'en5', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'roi_calculations' }) } } ] },
  { role: 'tool', tool_call_id: 'en5', content: JSON.stringify({ ok: true, target: 'roi_calculations', route: '/roi-calculations', client_action: { type: 'navigate', route: '/roi-calculations', target: 'roi_calculations' } }) },
  { role: 'assistant', content: 'Opening ROI calculator.' },

  // Navigation: voice sessions
  { role: 'user', content: 'Open voice sessions' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'en6', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'voice_sessions' }) } } ] },
  { role: 'tool', tool_call_id: 'en6', content: JSON.stringify({ ok: true, target: 'voice_sessions', route: '/voice-sessions', client_action: { type: 'navigate', route: '/voice-sessions', target: 'voice_sessions' } }) },
  { role: 'assistant', content: 'Opening voice sessions.' },

  // Navigation: companies
  { role: 'user', content: 'Show companies' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'en7', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'companies' }) } } ] },
  { role: 'tool', tool_call_id: 'en7', content: JSON.stringify({ ok: true, target: 'companies', route: '/companies', client_action: { type: 'navigate', route: '/companies', target: 'companies' } }) },
  { role: 'assistant', content: 'Opening companies.' },

  // Navigation: drafts
  { role: 'user', content: 'Open drafts' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'en8a', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'drafts' }) } } ] },
  { role: 'tool', tool_call_id: 'en8a', content: JSON.stringify({ ok: true, target: 'drafts', route: '/drafts', client_action: { type: 'navigate', route: '/drafts', target: 'drafts' } }) },
  { role: 'assistant', content: 'Opening drafts.' },

  // Reports ambiguity — clarify
  { role: 'user', content: 'Open reports' },
  { role: 'assistant', content: 'Do you mean the weekly report?' },

  // UI: filter leads
  { role: 'user', content: 'Filter leads to qualified' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'en8', type: 'function', function: { name: 'ui_set_filter', arguments: JSON.stringify({ scope: 'leads', filter: 'qualified' }) } } ] },
  { role: 'tool', tool_call_id: 'en8', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'leads', action: 'set_filter', payload: { filter: 'qualified' } } }) },
  { role: 'assistant', content: 'Showing qualified leads.' },

  // UI: filter bookings
  { role: 'user', content: 'Show pending bookings' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'en9', type: 'function', function: { name: 'ui_set_filter', arguments: JSON.stringify({ scope: 'bookings', filter: 'pending' }) } } ] },
  { role: 'tool', tool_call_id: 'en9', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'bookings', action: 'set_filter', payload: { filter: 'pending' } } }) },
  { role: 'assistant', content: 'Showing pending bookings.' },

  // UI: new deal
  { role: 'user', content: 'New deal' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'en10', type: 'function', function: { name: 'ui_open_new', arguments: JSON.stringify({ scope: 'pipeline' }) } } ] },
  { role: 'tool', tool_call_id: 'en10', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'pipeline', action: 'open_new' } }) },
  { role: 'assistant', content: 'Opening new deal.' },

  // UI: filter voice sessions
  { role: 'user', content: 'Filter sessions to positive' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'en11', type: 'function', function: { name: 'ui_set_filter', arguments: JSON.stringify({ scope: 'voice_sessions', filter: 'positive' }) } } ] },
  { role: 'tool', tool_call_id: 'en11', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'voice_sessions', action: 'set_filter', payload: { filter: 'positive' } } }) },
  { role: 'assistant', content: 'Showing positive sessions.' },

  // Tool: activity logging
  { role: 'user', content: 'Log a call with ABC Plumbing' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'en12', type: 'function', function: { name: 'log_activity', arguments: JSON.stringify({ type: 'call', subject: 'Call with ABC Plumbing' }) } } ] },
  { role: 'tool', tool_call_id: 'en12', content: JSON.stringify({ success: true, activity: { id: '1', type: 'call' } }) },
  { role: 'assistant', content: 'Logged a call with ABC Plumbing.' },

  // Tool: conversion rate
  { role: 'user', content: "What's my conversion rate?" },
  { role: 'assistant', content: null, tool_calls: [ { id: 'en13', type: 'function', function: { name: 'get_conversion_rate', arguments: '{}' } } ] },
  { role: 'tool', tool_call_id: 'en13', content: JSON.stringify({ total_leads: 50, converted: 8, conversion_rate_percent: 16 }) },
  { role: 'assistant', content: 'Your conversion rate is about 16%. You have 8 converted leads out of 50 total.' },

  // Tool: stale leads
  { role: 'user', content: "Find leads I haven't touched in 2 weeks" },
  { role: 'assistant', content: null, tool_calls: [ { id: 'en14', type: 'function', function: { name: 'get_stale_leads', arguments: JSON.stringify({ days_inactive: 14 }) } } ] },
  { role: 'tool', tool_call_id: 'en14', content: JSON.stringify({ stale_leads: [{ id: '1', name: 'Acme Corp', status: 'contacted' }], total: 1, days_inactive: 14 }) },
  { role: 'assistant', content: 'Found 1 lead inactive for 2 weeks: Acme Corp, currently in contacted status.' },
] as unknown as ChatCompletionMessageParam[];

// ─── Few-shot examples — Spanish only ──────────────────────────────────────

const FEWSHOTS_ES = [
  // Navegación: configuración
  { role: 'user', content: 'Abrir configuración' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'es1', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'settings' }) } } ] },
  { role: 'tool', tool_call_id: 'es1', content: JSON.stringify({ ok: true, target: 'settings', route: '/settings', client_action: { type: 'navigate', route: '/settings', target: 'settings' } }) },
  { role: 'assistant', content: 'Abriendo configuración.' },

  // Navegación: leads
  { role: 'user', content: 'Mostrar prospectos' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'es2', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'leads' }) } } ] },
  { role: 'tool', tool_call_id: 'es2', content: JSON.stringify({ ok: true, target: 'leads', route: '/leads', client_action: { type: 'navigate', route: '/leads', target: 'leads' } }) },
  { role: 'assistant', content: 'Abriendo leads.' },

  // Navegación: contactos
  { role: 'user', content: 'Ir a contactos' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'es3', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'contacts' }) } } ] },
  { role: 'tool', tool_call_id: 'es3', content: JSON.stringify({ ok: true, target: 'contacts', route: '/contacts', client_action: { type: 'navigate', route: '/contacts', target: 'contacts' } }) },
  { role: 'assistant', content: 'Abriendo contactos.' },

  // Navegación: disponibilidad
  { role: 'user', content: 'Mostrar disponibilidad' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'es4', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'bookings_availability' }) } } ] },
  { role: 'tool', tool_call_id: 'es4', content: JSON.stringify({ ok: true, target: 'bookings_availability', route: '/bookings/availability', client_action: { type: 'navigate', route: '/bookings/availability', target: 'bookings_availability' } }) },
  { role: 'assistant', content: 'Abriendo disponibilidad.' },

  // Navegación: calculadora de ROI
  { role: 'user', content: 'Abrir calculadora de ROI' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'es5', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'roi_calculations' }) } } ] },
  { role: 'tool', tool_call_id: 'es5', content: JSON.stringify({ ok: true, target: 'roi_calculations', route: '/roi-calculations', client_action: { type: 'navigate', route: '/roi-calculations', target: 'roi_calculations' } }) },
  { role: 'assistant', content: 'Abriendo calculadora de ROI.' },

  // Navegación: alianzas
  { role: 'user', content: 'Abrir alianzas' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'es6', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'partnerships' }) } } ] },
  { role: 'tool', tool_call_id: 'es6', content: JSON.stringify({ ok: true, target: 'partnerships', route: '/partnerships', client_action: { type: 'navigate', route: '/partnerships', target: 'partnerships' } }) },
  { role: 'assistant', content: 'Abriendo alianzas.' },

  // Navegación: panel
  { role: 'user', content: 'Ir al panel' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'es7', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'dashboard' }) } } ] },
  { role: 'tool', tool_call_id: 'es7', content: JSON.stringify({ ok: true, target: 'dashboard', route: '/dashboard', client_action: { type: 'navigate', route: '/dashboard', target: 'dashboard' } }) },
  { role: 'assistant', content: 'Abriendo panel.' },

  // Navegación: borradores
  { role: 'user', content: 'Abrir borradores' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'es7a', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'drafts' }) } } ] },
  { role: 'tool', tool_call_id: 'es7a', content: JSON.stringify({ ok: true, target: 'drafts', route: '/drafts', client_action: { type: 'navigate', route: '/drafts', target: 'drafts' } }) },
  { role: 'assistant', content: 'Abriendo borradores.' },

  // Ambigüedad: informes
  { role: 'user', content: 'Ir a informes' },
  { role: 'assistant', content: '¿Te refieres al reporte semanal?' },

  // UI: buscar leads
  { role: 'user', content: 'Buscar Maria' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'es8', type: 'function', function: { name: 'ui_search', arguments: JSON.stringify({ scope: 'leads', query: 'maria' }) } } ] },
  { role: 'tool', tool_call_id: 'es8', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'leads', action: 'search', payload: { query: 'maria' } } }) },
  { role: 'assistant', content: 'Buscando Maria.' },

  // UI: nuevo contacto
  { role: 'user', content: 'Nuevo contacto' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'es9', type: 'function', function: { name: 'ui_open_new', arguments: JSON.stringify({ scope: 'contacts' }) } } ] },
  { role: 'tool', tool_call_id: 'es9', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'contacts', action: 'open_new' } }) },
  { role: 'assistant', content: 'Abriendo nuevo contacto.' },

  // UI: ver detalles de alianza
  { role: 'user', content: 'Ver detalles de XYZ Property Management' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'es10', type: 'function', function: { name: 'ui_open_view', arguments: JSON.stringify({ scope: 'partnerships', query: 'xyz property management' }) } } ] },
  { role: 'tool', tool_call_id: 'es10', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'partnerships', action: 'open_view', payload: { query: 'xyz property management' } } }) },
  { role: 'assistant', content: 'Abriendo detalles de la alianza.' },

  // UI: buscar ROI
  { role: 'user', content: 'Buscar HVAC' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'es11', type: 'function', function: { name: 'ui_search', arguments: JSON.stringify({ scope: 'roi_calculations', query: 'HVAC' }) } } ] },
  { role: 'tool', tool_call_id: 'es11', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'roi_calculations', action: 'search', payload: { query: 'HVAC' } } }) },
  { role: 'assistant', content: 'Buscando HVAC.' },

  // Tool: registrar actividad
  { role: 'user', content: 'Registrar una llamada con ABC Plumbing' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'es12', type: 'function', function: { name: 'log_activity', arguments: JSON.stringify({ type: 'call', subject: 'Llamada con ABC Plumbing' }) } } ] },
  { role: 'tool', tool_call_id: 'es12', content: JSON.stringify({ success: true, activity: { id: '1', type: 'call' } }) },
  { role: 'assistant', content: 'Registrada una llamada con ABC Plumbing.' },

  // Tool: tasa de conversión
  { role: 'user', content: '¿Cuál es mi tasa de conversión?' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'es13', type: 'function', function: { name: 'get_conversion_rate', arguments: '{}' } } ] },
  { role: 'tool', tool_call_id: 'es13', content: JSON.stringify({ total_leads: 50, converted: 8, conversion_rate_percent: 16 }) },
  { role: 'assistant', content: 'Tu tasa de conversión es del 16%. Tienes 8 leads convertidos de 50 en total.' },

  // Tool: leads inactivos
  { role: 'user', content: 'Buscar leads inactivos por 2 semanas' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'es14', type: 'function', function: { name: 'get_stale_leads', arguments: JSON.stringify({ days_inactive: 14 }) } } ] },
  { role: 'tool', tool_call_id: 'es14', content: JSON.stringify({ stale_leads: [{ id: '1', name: 'Acme Corp', status: 'contacted' }], total: 1, days_inactive: 14 }) },
  { role: 'assistant', content: 'Encontré 1 lead inactivo por 2 semanas: Acme Corp, en estado contactado.' },
] as unknown as ChatCompletionMessageParam[];

const MAX_TOOL_ROUNDS = 5;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
  const ctx = getOptionalRequestContext(); const cfEnv = (ctx?.env || process.env) as any;
  const env = cfEnv as unknown as NCBEnv & Record<string, string>;

  // Pre-auth IP rate limit (brute-force protection)
  const rateLimitKv = (env as any).RATE_LIMIT_KV as KVNamespace | undefined;
  if (rateLimitKv) {
    const ip = getClientIP(request);
    const ipCheck = await checkRateLimit(rateLimitKv, `ip:${ip}`);
    if (!ipCheck.allowed) {
      return NextResponse.json({ error: ipCheck.reason }, {
        status: 429,
        headers: { 'Retry-After': String(ipCheck.retryAfter) },
      });
    }
  }

  // Auth check
  const cookieHeader = request.headers.get('cookie') || '';
  const user = await getSessionUser(env, cookieHeader);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Per-user rate limit (budget protection)
  if (rateLimitKv) {
    const userCheck = await checkRateLimit(rateLimitKv, `user:${user.id}`);
    if (!userCheck.allowed) {
      return NextResponse.json({ error: userCheck.reason }, {
        status: 429,
        headers: { 'Retry-After': String(userCheck.retryAfter) },
      });
    }
  }

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 });
  }
  const openai = createOpenAI(apiKey);
    const { question, sessionId, pagePath, language } = await request.json() as {
      question: string;
      sessionId: string;
      pagePath?: string;
      language?: 'en' | 'es';
    };

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Input validation
    const validation = validateQuestion(question);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const sanitizedQuestion = validation.sanitized!;
    const injection = detectPromptInjection(sanitizedQuestion);
    if (injection.detected) {
      console.warn(`Agent prompt injection attempt: ${injection.pattern}`);
    }

    // Get or create session (KV-backed with in-memory fallback)
    const kv = (env as any).AGENT_SESSIONS as KVNamespace | undefined;
    const session = await getSession(sessionId, user.id, kv);

    // Select model based on complexity
    const model = selectModel(sanitizedQuestion);

    // Build messages — select language-matched system prompt and few-shots based on UI toggle
    const isSpanish = language === 'es';
    const systemPrompt = isSpanish ? SYSTEM_PROMPT_ES : SYSTEM_PROMPT_EN;
    const fewShots = isSpanish ? FEWSHOTS_ES : FEWSHOTS_EN;

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: pagePath ? `Current page route: ${pagePath}` : 'Current page route: unknown' },
      ...fewShots,
      ...session.conversation,
      { role: 'user', content: sanitizedQuestion },
    ];

    // Check response cache (only pure conversational responses are cached)
    const cacheKv = (env as any).AGENT_SESSIONS as KVNamespace | undefined;
    const cached = await getCachedResponse(user.id, sanitizedQuestion, pagePath || '', cacheKv);
    if (cached) {
      await addMessage(sessionId, { role: 'user', content: sanitizedQuestion }, kv);
      await addMessage(sessionId, { role: 'assistant', content: cached.response }, kv);
      const duration = Date.now() - startTime;
      return NextResponse.json({ response: cached.response, success: true, duration, model: cached.model, clientActions: [], cached: true });
    }

    // Add user message to session
    await addMessage(sessionId, { role: 'user', content: sanitizedQuestion }, kv);

    const authCookies = extractAuthCookies(cookieHeader);

    // Tool call loop
    let currentMessages = messages;
    let response = '';
    let usedTools = false;
    const clientActions: Array<Record<string, unknown>> = [];
    const chatParams = buildChatParams(model);

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await openai.chat.completions.create({
        model,
        messages: currentMessages,
        tools: ALL_CRM_FUNCTIONS,
        ...chatParams,
      });

      const choice = completion.choices[0];

      if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
        // No more tool calls — final response
        response = choice.message.content || 'I completed the operation.';
        break;
      }

      // Execute tool calls
      usedTools = true;
      currentMessages = [...currentMessages, choice.message];

      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.type !== 'function') continue;
        const params = JSON.parse(toolCall.function.arguments);
        const result = await executeTool(
          toolCall.function.name,
          params,
          user.id,
          authCookies,
          env
        );

        currentMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });

        // Collect client actions to return to the UI (e.g., navigate)
        try {
          const r: any = result as any;
          if (r && typeof r === 'object' && r.client_action) {
            clientActions.push(r.client_action);
          }
        } catch {
          // non-fatal
        }
      }

      // If this is the last round, force a response
      if (round === MAX_TOOL_ROUNDS - 1) {
        const finalCompletion = await openai.chat.completions.create({
          model,
          messages: currentMessages,
          ...chatParams,
        });
        response = finalCompletion.choices[0]?.message?.content || 'Done.';
      }
    }

    // Save assistant response to session
    await addMessage(sessionId, { role: 'assistant', content: response }, kv);

    // Cache pure conversational responses (no tool calls)
    if (!usedTools && response) {
      await setCachedResponse(user.id, sanitizedQuestion, pagePath || '', response, model, cacheKv);
    }

    const duration = Date.now() - startTime;
    return NextResponse.json({ response, success: true, duration, model, clientActions });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: `Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
