import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { createOpenAI, buildChatParams } from '@/lib/openai/config';
import { selectModel } from '@/lib/agent/modelRouter';
import { validateQuestion, detectPromptInjection } from '@/lib/security/requestValidator';
import { getSession, addMessage } from '@/lib/agent/session';

export const runtime = 'edge';

const PUBLIC_SYSTEM_PROMPT_EN = `You are the AI Voice Agent for the public website.
- Be concise (1–3 short sentences).
- Be friendly and helpful.
- If appropriate, suggest using the ROI calculator or booking a call.
- Do not claim to perform actions in our internal CRM; you cannot access private data.
- If asked about plans/pricing/services, answer briefly and guide to contact or booking.
`;

const PUBLIC_SYSTEM_PROMPT_ES = `Eres el Agente de Voz para el sitio público.
- Sé conciso (1–3 oraciones breves).
- Sé amable y útil.
- Cuando sea apropiado, sugiere usar la calculadora de ROI o agendar una llamada.
- No digas que puedes hacer acciones en el CRM; no tienes acceso a datos privados.
- Si preguntan sobre planes/precios/servicios, responde brevemente y guía a contacto o reserva.
`;

function cors(req: NextRequest, headers: Record<string, string> = {}) {
  const origin = req.headers.get('origin') || '';
  const allowed = new Set([
    'https://kre8tion.com',
    'https://www.kre8tion.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ]);
  const allowOrigin = allowed.has(origin) ? origin : '';
  return {
    'Vary': 'Origin',
    ...(allowOrigin ? { 'Access-Control-Allow-Origin': allowOrigin } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Agent-Secret',
    ...headers,
  } as Record<string, string>;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}

export async function POST(request: NextRequest) {
  const { env: cfEnv } = getRequestContext();
  const env = cfEnv as unknown as Record<string, string>;

  const secret = request.headers.get('x-agent-secret') || '';
  if (!env.LANDING_AGENT_SECRET || secret !== env.LANDING_AGENT_SECRET) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...cors(request) },
    });
  }

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return new NextResponse(JSON.stringify({ error: 'OpenAI not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors(request) },
    });
  }

  try {
    const { question, sessionId, pagePath, language } = (await request.json()) as {
      question: string;
      sessionId: string;
      pagePath?: string;
      language?: 'en' | 'es';
    };

    if (!sessionId) {
      return new NextResponse(JSON.stringify({ error: 'Session ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...cors(request) },
      });
    }

    const validation = validateQuestion(question);
    if (!validation.valid) {
      return new NextResponse(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...cors(request) },
      });
    }

    const sanitized = validation.sanitized!;
    const inj = detectPromptInjection(sanitized);
    if (inj.detected) console.warn('[landing/chat] prompt injection:', inj.pattern);

    const kv = (cfEnv as any).AGENT_SESSIONS as KVNamespace | undefined;
    const session = await getSession(sessionId, 'public', kv);

    const model = selectModel(sanitized);
    const openai = createOpenAI(apiKey);
    const messages = [
      { role: 'system', content: language === 'es' ? PUBLIC_SYSTEM_PROMPT_ES : PUBLIC_SYSTEM_PROMPT_EN },
      { role: 'system', content: pagePath ? `Current page: ${pagePath}` : 'Current page: unknown' },
      ...session.conversation,
      { role: 'user', content: sanitized },
    ] as const;

    const params = buildChatParams(model);
    const completion = await openai.chat.completions.create({ model, messages: messages as any, ...params });
    const text = completion.choices?.[0]?.message?.content || 'Thanks!';

    await addMessage(sessionId, { role: 'user', content: sanitized }, kv);
    await addMessage(sessionId, { role: 'assistant', content: text }, kv);

    return new NextResponse(JSON.stringify({ response: text, success: true }), {
      headers: { 'Content-Type': 'application/json', ...cors(request) },
    });
  } catch (error) {
    console.error('[landing/chat] error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors(request) },
    });
  }
}

