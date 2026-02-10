import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { createOpenAI, MODELS } from '@/lib/openai/config';
import { validateText } from '@/lib/security/requestValidator';
import { getSessionUser, type NCBEnv } from '@/lib/agent/ncbClient';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const { env: cfEnv } = getRequestContext();
  const env = cfEnv as unknown as NCBEnv & Record<string, string>;

  // Auth check
  const cookieHeader = request.headers.get('cookie') || '';
  const user = await getSessionUser(env, cookieHeader);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 });
  }
  const openai = createOpenAI(apiKey);

  try {
    const { text, language } = await request.json() as { text: string; language?: 'en' | 'es' };

    const validation = validateText(text);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const selectedVoice = language === 'es' ? MODELS.voice : MODELS.voice;

    const mp3 = await openai.audio.speech.create({
      model: MODELS.tts,
      voice: selectedVoice,
      input: validation.sanitized!,
      response_format: 'mp3',
      speed: 1.0,
    });

    const buffer = new Uint8Array(await mp3.arrayBuffer());
    const duration = Date.now() - startTime;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
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
