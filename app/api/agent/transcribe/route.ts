import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI, MODELS, normalizeLanguageCode } from '@/lib/openai/config';
import { validateAudioFile } from '@/lib/security/requestValidator';
import { getSessionUser, extractAuthCookies } from '@/lib/agent/ncbClient';

export const runtime = 'edge';

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
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = (formData.get('language') as string | null)?.toLowerCase();

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
      response_format: 'verbose_json',
      ...(language === 'es' || language === 'en' ? { language } : {}),
    });

    const rawLanguage = (transcription as any).language as string | undefined;
    const detectedLanguage = normalizeLanguageCode(rawLanguage);
    const duration = Date.now() - startTime;
    return NextResponse.json({ text: transcription.text, language: detectedLanguage, success: true, duration });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
