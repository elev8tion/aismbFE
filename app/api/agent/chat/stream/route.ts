import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI, buildChatParams } from '@/lib/openai/config';
import { validateQuestion, detectPromptInjection } from '@/lib/security/requestValidator';
import { getSessionUser, extractAuthCookies, ncbCreate, ncbUpdate } from '@/lib/agent/ncbClient';
import { selectModel } from '@/lib/agent/modelRouter';
import { getSession, addMessage } from '@/lib/agent/session';
import { ALL_CRM_FUNCTIONS } from '@/lib/agent/functions';
import { executeTool } from '@/lib/agent/tools';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { rateLimiter, getClientIP } from '@/lib/security/rateLimiter';

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
- Always respond in the same language as the user. If the detected language is Spanish, respond entirely in Spanish. If English, respond in English.
`;

const MAX_TOOL_ROUNDS = 5;

function sseEncode(obj: Record<string, unknown>, event?: string) {
  const data = `data: ${JSON.stringify(obj)}\n\n`;
  return event ? `event: ${event}\n${data}` : data;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Auth check
  const cookieHeader = request.headers.get('cookie') || '';
  const user = await getSessionUser(cookieHeader);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit per user+IP
  const limiterKey = `chat_stream:${user.id}:${getClientIP(request as unknown as Request)}`;
  const limit = rateLimiter.check(limiterKey);
  if (!limit.allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded', details: limit.reason }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.max(1, Math.ceil((limit.resetTime - Date.now()) / 1000)).toString(),
          'X-RateLimit-Remaining': String(limit.remaining),
        },
      }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 });
  }
  const openai = createOpenAI(apiKey);

  try {
    const { question, sessionId, pagePath, language } = await request.json() as {
      question: string;
      sessionId: string;
      pagePath?: string;
      language?: string;
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

    // Update session language when provided
    if (language) {
      session.language = language;
    }

    // Build initial messages (keep this minimal; tool loop will enrich with tool messages)
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: pagePath ? `Current page route: ${pagePath}` : 'Current page route: unknown' },
      { role: 'system', content: `User language: ${language || 'en'}` },
      ...session.conversation,
      { role: 'user', content: sanitizedQuestion },
    ];

    // Add user message to session
    addMessage(sessionId, { role: 'user', content: sanitizedQuestion });

    const authCookies = extractAuthCookies(cookieHeader);
    const chatParams = buildChatParams(model);

    // Tool call loop (non-streaming) to collect client actions
    let currentMessages = messages;
    const clientActions: Array<Record<string, unknown>> = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await openai.chat.completions.create({
        model,
        messages: currentMessages,
        tools: ALL_CRM_FUNCTIONS,
        ...chatParams,
      });

      const choice = completion.choices?.[0];
      if (!choice?.message?.tool_calls || choice.message.tool_calls.length === 0) {
        // No tools — use this as the last message context
        currentMessages = [...currentMessages, choice?.message || { role: 'assistant', content: '' }];
        break;
      }

      currentMessages = [...currentMessages, choice.message];

      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.type !== 'function') continue;
        let params: Record<string, unknown> = {};
        try { params = JSON.parse(toolCall.function.arguments); } catch { /* ignore */ }
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

        try {
          const r = result as any;
          if (r && typeof r === 'object' && r.client_action) {
            clientActions.push(r.client_action);
          }
        } catch { /* non-fatal */ }
      }
    }

    // Start SSE stream for final assistant answer
    const encoder = new TextEncoder();
    let assistantText = '';

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        // Send metadata (client actions and model) first
        try {
          controller.enqueue(encoder.encode(sseEncode({ clientActions, model }, 'meta')));
        } catch { /* best-effort */ }

        try {
          const finalParams = buildChatParams(model);
          const completion = await openai.chat.completions.create({
            model,
            messages: currentMessages,
            stream: true,
            ...finalParams,
          } as any);

          for await (const chunk of completion as any) {
            const part = chunk?.choices?.[0]?.delta?.content || '';
            if (part) {
              assistantText += part;
              controller.enqueue(encoder.encode(sseEncode({ text: part }, 'delta')));
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(encoder.encode(sseEncode({ error: msg }, 'error')));
        } finally {
          try {
            // Save assistant response to session
            if (assistantText) {
              addMessage(sessionId, { role: 'assistant', content: assistantText });
            }

            // Persist to voice_sessions (fire-and-forget)
            const userMessages = session.conversation.filter(m => m.role === 'user');
            const langCode = session.language || language || 'en';
            const sessionData: Record<string, unknown> = {
              external_session_id: sessionId,
              start_time: new Date(session.created_at).toISOString(),
              language: langCode === 'en' || langCode === 'es' ? langCode : 'en',
              messages: JSON.stringify(session.conversation.filter(m => m.role === 'user' || m.role === 'assistant')),
              total_questions: userMessages.length,
              referrer_page: pagePath || '/',
              actions_taken: JSON.stringify(clientActions),
              duration: Math.round((Date.now() - session.created_at) / 1000),
            };

            if (!session.voiceSessionDbId) {
              ncbCreate<{ data?: { id?: string }; id?: string }>(
                'voice_sessions',
                sessionData,
                user.id,
                authCookies
              ).then(result => {
                const dbId = (result as any)?.data?.id || (result as any)?.id;
                if (dbId) session.voiceSessionDbId = String(dbId);
              }).catch(err => console.error('Voice session create error (non-fatal):', err));
            } else {
              ncbUpdate('voice_sessions', session.voiceSessionDbId, sessionData, authCookies)
                .catch(err => console.error('Voice session update error (non-fatal):', err));
            }
          } catch { /* non-fatal */ }

          controller.enqueue(encoder.encode(sseEncode({ success: true, duration: Date.now() - startTime }, 'done')));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Agent chat stream error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

