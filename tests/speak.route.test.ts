import { describe, it, expect, vi, beforeEach } from 'vitest';

// We will stub global fetch for get-session rather than mocking the module

// Counter to simulate retries
let ttsAttempts = 0;

// Mock OpenAI client factory
vi.mock('@/lib/openai/config', () => ({
  createOpenAI: vi.fn(() => ({
    audio: {
      speech: {
        create: vi.fn(async () => {
          ttsAttempts++;
          if (ttsAttempts < 2) {
            throw new Error('Transient TTS failure');
          }
          // Return a minimal fetch-like response with arrayBuffer
          return {
            async arrayBuffer() {
              return new Uint8Array([1, 2, 3, 4]).buffer;
            },
          } as any;
        }),
      },
    },
  })),
  MODELS: { tts: 'gpt-4o-mini-tts' },
  VOICE_MAP: { default: 'echo', en: 'echo' },
}));

// Import after mocks
// Route is imported dynamically after env+fetch mocks are set
// no import of ncbClient; we simulate its network calls instead

describe('speak route', () => {
  beforeEach(() => {
    ttsAttempts = 0;
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.NCB_INSTANCE = 'test_instance';
    process.env.NCB_AUTH_API_URL = 'https://auth.example.com/api/user-auth';
    // Stub fetch for get-session
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (typeof url === 'string' && url.includes('/get-session')) {
        return new Response(JSON.stringify({ user: { id: 'u1', email: 'test@example.com', name: 'Test' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }) as any;
      }
      throw new Error('Unexpected fetch: ' + url);
    });
  });

  it('retries TTS and returns MP3 with no-store header', async () => {
    const ncb = await import('@/lib/agent/ncbClient');
    vi.spyOn(ncb, 'getSessionUser').mockResolvedValue({ id: 'u1', email: 't', name: 't' } as any);
    const { POST: speakPOST } = await import('@/app/api/agent/speak/route');
    const req = new Request('http://localhost/api/agent/speak', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cookie': 'better-auth.session_token=abc' },
      body: JSON.stringify({ text: 'Hello there', language: 'en' }),
    });

    const res = await speakPOST(req as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    // Ensure we retried at least once
    expect(ttsAttempts).toBeGreaterThan(1);
  });
});
