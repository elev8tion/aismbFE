import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI, MODELS, VOICE_MAP } from '@/lib/openai/config';
import { validateText } from '@/lib/security/requestValidator';
import { getSessionUser } from '@/lib/agent/ncbClient';
import { rateLimiter, getClientIP } from '@/lib/security/rateLimiter';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Auth check
  const cookieHeader = request.headers.get('cookie') || '';
  const user = await getSessionUser(cookieHeader);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit per user+IP
  const limiterKey = `speak:${user.id}:${getClientIP(request as unknown as Request)}`;
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
    const { text, language } = await request.json() as { text: string; language?: string };

    const validation = validateText(text);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const voice = (language && VOICE_MAP[language]) || VOICE_MAP.default;

    async function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }
    async function generateTTSWithRetry(): Promise<Response> {
      const maxAttempts = 3;
      let attempt = 0;
      let lastErr: unknown = null;
      while (attempt < maxAttempts) {
        try {
          return await openai.audio.speech.create({
            model: MODELS.tts,
            voice: voice as any,
            input: validation.sanitized!,
            response_format: 'mp3',
            speed: 1.0,
          });
        } catch (e) {
          lastErr = e;
          attempt++;
          if (attempt >= maxAttempts) break;
          // Exponential backoff: 200ms, 500ms
          await sleep(attempt === 1 ? 200 : 500);
        }
      }
      throw lastErr ?? new Error('TTS generation failed');
    }

    const mp3 = await generateTTSWithRetry();

    const buffer = new Uint8Array(await mp3.arrayBuffer());
    const duration = Date.now() - startTime;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store',
        'X-Duration': duration.toString(),
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
