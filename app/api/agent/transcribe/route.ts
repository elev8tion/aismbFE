import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare/env';
import { createOpenAI, MODELS } from '@/lib/openai/config';
import { validateAudioFile } from '@/lib/security/requestValidator';
import { getSessionUser, type NCBEnv } from '@/lib/agent/ncbClient';
import { checkRateLimit, getClientIP } from '@/lib/security/rateLimiter.kv';
import { languageSchema } from '@kre8tion/shared-types';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const cfEnv = getEnv();
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

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const languageRaw = (formData.get('language') as string | null)?.toLowerCase();

    // Validate language
    const languageResult = languageSchema.safeParse(languageRaw);
    const validLanguage = languageResult.success ? languageResult.data : undefined;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const validation = validateAudioFile(audioFile);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const buffer = new Uint8Array(await audioFile.arrayBuffer());
    const getExtension = (mimeType: string): string => {
      if (mimeType.includes('webm')) return 'webm';
      if (mimeType.includes('mp4')) return 'm4a';
      if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
      if (mimeType.includes('ogg')) return 'ogg';
      if (mimeType.includes('wav')) return 'wav';
      return 'webm';
    };
    const extension = getExtension(audioFile.type);
    const file = new File([buffer], `audio.${extension}`, { type: audioFile.type });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: MODELS.transcription,
      response_format: 'json',
      ...(validLanguage ? { language: validLanguage } : {}),
    });

    const duration = Date.now() - startTime;
    return NextResponse.json({ text: transcription.text, success: true, duration });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
