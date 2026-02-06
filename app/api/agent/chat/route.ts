import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@/lib/openai/config';
import { validateQuestion, detectPromptInjection } from '@/lib/security/requestValidator';
import { getSessionUser, extractAuthCookies } from '@/lib/agent/ncbClient';
import { selectModel } from '@/lib/agent/modelRouter';
import { getSession, addMessage } from '@/lib/agent/session';
import { ALL_CRM_FUNCTIONS } from '@/lib/agent/functions';
import { executeTool } from '@/lib/agent/tools';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are the AI Voice Operator for a CRM system. You help users manage their business by executing CRM operations through voice commands.

Guidelines:
- Be concise. Responses will be spoken aloud — keep them under 2-3 sentences.
- When executing write operations (create, update, delete), always confirm the action and summarize what was done.
- For read operations, summarize the key numbers and highlight anything noteworthy.
- If a request is ambiguous, ask ONE clarifying question before acting.
- Use natural, conversational language. Avoid technical jargon.
- When presenting numbers, round to whole numbers and use plain language ("about fifty leads" not "49.7 leads").
- Never expose raw IDs to the user. Refer to records by name.
- If a tool returns an error, explain the issue simply and suggest what to do.

Navigation:
- When the user asks to open, go to, show, or take me to a section (English or Spanish), call the navigate tool with a target from the allowed list.
- Only call the navigate tool when the intent to change pages is explicit — do not navigate if the user is merely discussing a section.
- English → Spanish synonyms:
  - dashboard/panel → target: dashboard
  - leads/prospects/clientes potenciales → target: leads
  - contacts/people/personas → target: contacts
  - companies/accounts/organizations/empresas → target: companies
  - pipeline/deals/opportunities/embudo/acuerdos/oportunidades → target: pipeline
  - bookings/calendar/appointments/reservas/calendario/citas/agenda → target: bookings
  - partnerships/alliances/socios → target: partnerships
  - voice sessions/voice transcripts/registros del agente de voz → target: voice_sessions
  - ROI calculator/ROI/calculadora de ROI → target: roi_calculations
  - weekly report/reports/reporte semanal/informes → target: reports_weekly (ask to clarify if just "reports")
  - settings/preferences/configuración/ajustes → target: settings
  - availability/disponibilidad (calendar availability) → target: bookings_availability
- If the user says just "reports" or otherwise ambiguous terms, ask one clarifying question before navigating.

On-page UI actions (English/Spanish):
- When the user asks to filter, search, open a new form, or open/edit a record on the current page, call the corresponding ui_* tool with the appropriate scope.
- Examples: "filter to qualified" / "filtra a calificados" → ui_set_filter { scope: 'leads', filter: 'qualified' }.
- "search for Maria" / "buscar Maria" → ui_search { scope: 'leads', query: 'maria' }.
- "new lead" / "nuevo lead" → ui_open_new { scope: 'leads' }.
- "edit John" / "editar John" → ui_open_edit { scope: 'leads', query: 'john' }.
- Prefer using an id if you have it; otherwise pass a short query string and the client will pick the first match.
`;

const NAV_FEWSHOTS = [
  // English example: Open pipeline
  {
    role: 'user',
    content: 'Open pipeline',
  },
  {
    role: 'assistant',
    content: null,
    tool_calls: [
      {
        id: 'nav1',
        type: 'function',
        function: { name: 'navigate', arguments: JSON.stringify({ target: 'pipeline' }) },
      },
    ],
  },
  {
    role: 'tool',
    tool_call_id: 'nav1',
    content: JSON.stringify({ ok: true, target: 'pipeline', route: '/pipeline', client_action: { type: 'navigate', route: '/pipeline', target: 'pipeline' } }),
  },
  {
    role: 'assistant',
    content: 'Opening pipeline.',
  },

  // Spanish example: Abrir configuración
  {
    role: 'user',
    content: 'Abrir configuración',
  },
  {
    role: 'assistant',
    content: null,
    tool_calls: [
      {
        id: 'nav2',
        type: 'function',
        function: { name: 'navigate', arguments: JSON.stringify({ target: 'settings' }) },
      },
    ],
  },
  {
    role: 'tool',
    tool_call_id: 'nav2',
    content: JSON.stringify({ ok: true, target: 'settings', route: '/settings', client_action: { type: 'navigate', route: '/settings', target: 'settings' } }),
  },
  {
    role: 'assistant',
    content: 'Abriendo configuración.',
  },

  // Leads filtering (EN)
  { role: 'user', content: 'Filter leads to qualified' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'ui1', type: 'function', function: { name: 'ui_set_filter', arguments: JSON.stringify({ scope: 'leads', filter: 'qualified' }) } } ] },
  { role: 'tool', tool_call_id: 'ui1', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'leads', action: 'set_filter', payload: { filter: 'qualified' } } }) },
  { role: 'assistant', content: 'Showing qualified leads.' },

  // Leads search (ES)
  { role: 'user', content: 'Buscar Maria' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'ui2', type: 'function', function: { name: 'ui_search', arguments: JSON.stringify({ scope: 'leads', query: 'maria' }) } } ] },
  { role: 'tool', tool_call_id: 'ui2', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'leads', action: 'search', payload: { query: 'maria' } } }) },
  { role: 'assistant', content: 'Buscando Maria.' },

  // Contacts new (ES)
  { role: 'user', content: 'Nuevo contacto' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'ui3', type: 'function', function: { name: 'ui_open_new', arguments: JSON.stringify({ scope: 'contacts' }) } } ] },
  { role: 'tool', tool_call_id: 'ui3', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'contacts', action: 'open_new' } }) },
  { role: 'assistant', content: 'Abriendo nuevo contacto.' },

  // Bookings filter (EN)
  { role: 'user', content: 'Show pending bookings' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'ui4', type: 'function', function: { name: 'ui_set_filter', arguments: JSON.stringify({ scope: 'bookings', filter: 'pending' }) } } ] },
  { role: 'tool', tool_call_id: 'ui4', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'bookings', action: 'set_filter', payload: { filter: 'pending' } } }) },
  { role: 'assistant', content: 'Showing pending bookings.' },

  // Partnerships view (ES)
  { role: 'user', content: 'Ver detalles de XYZ Property Management' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'ui5', type: 'function', function: { name: 'ui_open_view', arguments: JSON.stringify({ scope: 'partnerships', query: 'xyz property management' }) } } ] },
  { role: 'tool', tool_call_id: 'ui5', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'partnerships', action: 'open_view', payload: { query: 'xyz property management' } } }) },
  { role: 'assistant', content: 'Abriendo detalles de la alianza.' },

  // Pipeline new (EN)
  { role: 'user', content: 'New deal' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'ui6', type: 'function', function: { name: 'ui_open_new', arguments: JSON.stringify({ scope: 'pipeline' }) } } ] },
  { role: 'tool', tool_call_id: 'ui6', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'pipeline', action: 'open_new' } }) },
  { role: 'assistant', content: 'Opening new deal.' },

  // Voice sessions filter (EN)
  { role: 'user', content: 'Filter sessions to positive' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'ui7', type: 'function', function: { name: 'ui_set_filter', arguments: JSON.stringify({ scope: 'voice_sessions', filter: 'positive' }) } } ] },
  { role: 'tool', tool_call_id: 'ui7', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'voice_sessions', action: 'set_filter', payload: { filter: 'positive' } } }) },
  { role: 'assistant', content: 'Showing positive sessions.' },

  // ROI search (ES)
  { role: 'user', content: 'Buscar HVAC' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'ui8', type: 'function', function: { name: 'ui_search', arguments: JSON.stringify({ scope: 'roi_calculations', query: 'HVAC' }) } } ] },
  { role: 'tool', tool_call_id: 'ui8', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'roi_calculations', action: 'search', payload: { query: 'HVAC' } } }) },
  { role: 'assistant', content: 'Buscando HVAC.' },

  // Leads filtering (EN) — stay on page and adjust UI
  { role: 'user', content: 'Filter leads to qualified' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'ui1', type: 'function', function: { name: 'ui_set_filter', arguments: JSON.stringify({ scope: 'leads', filter: 'qualified' }) } } ] },
  { role: 'tool', tool_call_id: 'ui1', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'leads', action: 'set_filter', payload: { filter: 'qualified' } } }) },
  { role: 'assistant', content: 'Showing qualified leads.' },

  // Leads search (ES)
  { role: 'user', content: 'Buscar Maria' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'ui2', type: 'function', function: { name: 'ui_search', arguments: JSON.stringify({ scope: 'leads', query: 'maria' }) } } ] },
  { role: 'tool', tool_call_id: 'ui2', content: JSON.stringify({ ok: true, client_action: { type: 'ui_action', scope: 'leads', action: 'search', payload: { query: 'maria' } } }) },
  { role: 'assistant', content: 'Buscando Maria.' },
  
  // Leads (EN)
  { role: 'user', content: 'Open leads' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'nav3', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'leads' }) } } ] },
  { role: 'tool', tool_call_id: 'nav3', content: JSON.stringify({ ok: true, target: 'leads', route: '/leads', client_action: { type: 'navigate', route: '/leads', target: 'leads' } }) },
  { role: 'assistant', content: 'Opening leads.' },

  // Leads (ES)
  { role: 'user', content: 'Mostrar prospectos' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'nav4', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'leads' }) } } ] },
  { role: 'tool', tool_call_id: 'nav4', content: JSON.stringify({ ok: true, target: 'leads', route: '/leads', client_action: { type: 'navigate', route: '/leads', target: 'leads' } }) },
  { role: 'assistant', content: 'Abriendo leads.' },

  // Contacts (EN)
  { role: 'user', content: 'Go to contacts' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'nav5', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'contacts' }) } } ] },
  { role: 'tool', tool_call_id: 'nav5', content: JSON.stringify({ ok: true, target: 'contacts', route: '/contacts', client_action: { type: 'navigate', route: '/contacts', target: 'contacts' } }) },
  { role: 'assistant', content: 'Opening contacts.' },

  // Contacts (ES)
  { role: 'user', content: 'Ir a contactos' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'nav6', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'contacts' }) } } ] },
  { role: 'tool', tool_call_id: 'nav6', content: JSON.stringify({ ok: true, target: 'contacts', route: '/contacts', client_action: { type: 'navigate', route: '/contacts', target: 'contacts' } }) },
  { role: 'assistant', content: 'Abriendo contactos.' },

  // Bookings availability (EN)
  { role: 'user', content: 'Show availability' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'nav7', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'bookings_availability' }) } } ] },
  { role: 'tool', tool_call_id: 'nav7', content: JSON.stringify({ ok: true, target: 'bookings_availability', route: '/bookings/availability', client_action: { type: 'navigate', route: '/bookings/availability', target: 'bookings_availability' } }) },
  { role: 'assistant', content: 'Opening availability.' },

  // Bookings availability (ES)
  { role: 'user', content: 'Mostrar disponibilidad' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'nav8', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'bookings_availability' }) } } ] },
  { role: 'tool', tool_call_id: 'nav8', content: JSON.stringify({ ok: true, target: 'bookings_availability', route: '/bookings/availability', client_action: { type: 'navigate', route: '/bookings/availability', target: 'bookings_availability' } }) },
  { role: 'assistant', content: 'Abriendo disponibilidad.' },

  // ROI calculator (EN)
  { role: 'user', content: 'Open ROI calculator' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'nav9', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'roi_calculations' }) } } ] },
  { role: 'tool', tool_call_id: 'nav9', content: JSON.stringify({ ok: true, target: 'roi_calculations', route: '/roi-calculations', client_action: { type: 'navigate', route: '/roi-calculations', target: 'roi_calculations' } }) },
  { role: 'assistant', content: 'Opening ROI calculator.' },

  // ROI calculator (ES)
  { role: 'user', content: 'Abrir calculadora de ROI' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'nav10', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'roi_calculations' }) } } ] },
  { role: 'tool', tool_call_id: 'nav10', content: JSON.stringify({ ok: true, target: 'roi_calculations', route: '/roi-calculations', client_action: { type: 'navigate', route: '/roi-calculations', target: 'roi_calculations' } }) },
  { role: 'assistant', content: 'Abriendo calculadora de ROI.' },

  // Reports ambiguity (ES) — clarify instead of navigating
  { role: 'user', content: 'Ir a informes' },
  { role: 'assistant', content: '¿Te refieres al reporte semanal?' },

  // Voice sessions (EN)
  { role: 'user', content: 'Open voice sessions' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'nav11', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'voice_sessions' }) } } ] },
  { role: 'tool', tool_call_id: 'nav11', content: JSON.stringify({ ok: true, target: 'voice_sessions', route: '/voice-sessions', client_action: { type: 'navigate', route: '/voice-sessions', target: 'voice_sessions' } }) },
  { role: 'assistant', content: 'Opening voice sessions.' },

  // Partnerships (ES)
  { role: 'user', content: 'Abrir alianzas' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'nav12', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'partnerships' }) } } ] },
  { role: 'tool', tool_call_id: 'nav12', content: JSON.stringify({ ok: true, target: 'partnerships', route: '/partnerships', client_action: { type: 'navigate', route: '/partnerships', target: 'partnerships' } }) },
  { role: 'assistant', content: 'Abriendo alianzas.' },

  // Companies (EN)
  { role: 'user', content: 'Show companies' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'nav13', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'companies' }) } } ] },
  { role: 'tool', tool_call_id: 'nav13', content: JSON.stringify({ ok: true, target: 'companies', route: '/companies', client_action: { type: 'navigate', route: '/companies', target: 'companies' } }) },
  { role: 'assistant', content: 'Opening companies.' },

  // Dashboard (ES)
  { role: 'user', content: 'Ir al panel' },
  { role: 'assistant', content: null, tool_calls: [ { id: 'nav14', type: 'function', function: { name: 'navigate', arguments: JSON.stringify({ target: 'dashboard' }) } } ] },
  { role: 'tool', tool_call_id: 'nav14', content: JSON.stringify({ ok: true, target: 'dashboard', route: '/dashboard', client_action: { type: 'navigate', route: '/dashboard', target: 'dashboard' } }) },
  { role: 'assistant', content: 'Abriendo panel.' },
// Cast to SDK param type; examples use tool_calls which may not be in the param type
] as unknown as ChatCompletionMessageParam[];

const MAX_TOOL_ROUNDS = 5;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Auth check
  const cookieHeader = request.headers.get('cookie') || '';
  const user = await getSessionUser(cookieHeader);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 });
  }
  const openai = createOpenAI(apiKey);

  try {
    const { question, sessionId, pagePath } = await request.json() as {
      question: string;
      sessionId: string;
      pagePath?: string;
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

    // Get or create session
    const session = getSession(sessionId, user.id);

    // Select model based on complexity
    const model = selectModel(sanitizedQuestion);

    // Build messages
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: pagePath ? `Current page route: ${pagePath}` : 'Current page route: unknown' },
      ...NAV_FEWSHOTS,
      ...session.conversation,
      { role: 'user', content: sanitizedQuestion },
    ];

    // Add user message to session
    addMessage(sessionId, { role: 'user', content: sanitizedQuestion });

    const authCookies = extractAuthCookies(cookieHeader);

    // Tool call loop
    let currentMessages = messages;
    let response = '';
    const clientActions: Array<Record<string, unknown>> = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await openai.chat.completions.create({
        model,
        messages: currentMessages,
        tools: ALL_CRM_FUNCTIONS,
        temperature: 0.3,
        max_tokens: 500,
      });

      const choice = completion.choices[0];

      if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
        // No more tool calls — final response
        response = choice.message.content || 'I completed the operation.';
        break;
      }

      // Execute tool calls
      currentMessages = [...currentMessages, choice.message];

      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.type !== 'function') continue;
        const params = JSON.parse(toolCall.function.arguments);
        const result = await executeTool(
          toolCall.function.name,
          params,
          user.id,
          authCookies
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
          temperature: 0.3,
          max_tokens: 500,
        });
        response = finalCompletion.choices[0]?.message?.content || 'Done.';
      }
    }

    // Save assistant response to session
    addMessage(sessionId, { role: 'assistant', content: response });

    const duration = Date.now() - startTime;
    return NextResponse.json({ response, success: true, duration, model, clientActions });
  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
