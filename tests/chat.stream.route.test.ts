import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
// We stub global fetch for auth and data calls instead of module-mocking

vi.mock('@/lib/agent/tools', () => ({
  executeTool: vi.fn().mockResolvedValue({ ok: true }),
}));

// Make a fake streaming iterable
async function* streamParts(parts: string[]) {
  for (const p of parts) {
    yield { choices: [{ delta: { content: p } }] };
  }
}

let nonStreamCalls = 0;
vi.mock('@/lib/openai/config', () => ({
  createOpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn((args: any) => {
          // First pass: tool loop (non-stream)
          if (!args.stream) {
            nonStreamCalls++;
            return Promise.resolve({ choices: [{ message: { role: 'assistant', content: 'ok' } }] });
          }
          // Streaming pass
          return streamParts(['Hello', ' ', 'world']);
        }),
      },
    },
  })),
  buildChatParams: vi.fn().mockReturnValue({ max_tokens: 200 }),
  MODELS: { fast: 'gpt-4.1-nano', standard: 'gpt-4.1-mini', reasoning: 'o4-mini' },
}));

// Route is imported dynamically after env+fetch mocks are set
// no import of ncbClient; network calls are intercepted

function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let out = '';
  return reader.read().then(function process(result): any {
    if (result.done) return out;
    out += decoder.decode(result.value, { stream: true });
    return reader.read().then(process);
  });
}

describe('chat stream route', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    nonStreamCalls = 0;
    process.env.NCB_INSTANCE = 'test_instance';
    process.env.NCB_AUTH_API_URL = 'https://auth.example.com/api/user-auth';
    process.env.NCB_DATA_API_URL = 'https://data.example.com/api/data';
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (typeof url === 'string' && url.includes('/get-session')) {
        return new Response(JSON.stringify({ user: { id: 'u1', email: 'test@example.com', name: 'Test' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }) as any;
      }
      if (typeof url === 'string' && url.includes('/create/voice_sessions')) {
        return new Response(JSON.stringify({ id: 'vs-1' }), { status: 200, headers: { 'Content-Type': 'application/json' } }) as any;
      }
      if (typeof url === 'string' && url.includes('/update/voice_sessions')) {
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }) as any;
      }
      throw new Error('Unexpected fetch: ' + url);
    });
  });

  it('streams SSE with meta, deltas, and done', async () => {
    const ncb = await import('@/lib/agent/ncbClient');
    vi.spyOn(ncb, 'getSessionUser').mockResolvedValue({ id: 'u1', email: 't', name: 't' } as any);
    const { POST: chatStreamPOST } = await import('@/app/api/agent/chat/stream/route');
    const req = new Request('http://localhost/api/agent/chat/stream', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cookie': 'better-auth.session_token=abc' },
      body: JSON.stringify({ question: 'Say hello', sessionId: 's1', pagePath: '/dashboard', language: 'en' }),
    });

    const res = await chatStreamPOST(req as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');

    const body = await readAll(res.body as any);
    expect(body).toContain('event: meta');
    expect(body).toContain('event: delta');
    expect(body).toContain('Hello');
    expect(body).toContain('world');
    expect(body).toContain('event: done');
    expect(nonStreamCalls).toBeGreaterThan(0);
  });
});
