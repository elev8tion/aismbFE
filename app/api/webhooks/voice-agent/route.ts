import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { ncbServerCreate, type NCBEnv } from '@/lib/agent/ncbClient';

export const runtime = 'edge';

interface VoiceMessage { role: 'user' | 'assistant'; content: string }
interface VoiceAgentWebhookPayload {
  external_session_id: string;
  language?: 'en' | 'es';
  start_time?: string; // ISO
  end_time?: string;   // ISO
  duration?: number;   // seconds
  messages: VoiceMessage[];
  topics?: string[];
  pain_points?: string[];
  objections?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed';
  total_questions?: number;
  outcome?: 'continued_browsing' | 'roi_calculator' | 'booking_scheduled' | 'left_site' | 'unknown';
  device?: 'desktop' | 'mobile' | 'tablet';
}

function json(res: unknown, init?: number | ResponseInit) {
  return NextResponse.json(res, init as ResponseInit);
}

export async function POST(req: NextRequest) {
  const { env: cfEnv } = getRequestContext();
  const env = cfEnv as unknown as NCBEnv & Record<string, string>;

  try {
    const secret = req.headers.get('x-webhook-secret') || '';
    const expected = env.LANDING_WEBHOOK_SECRET || '';
    if (!expected || secret !== expected) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await req.json()) as VoiceAgentWebhookPayload;

    if (!body || typeof body.external_session_id !== 'string' || !Array.isArray(body.messages)) {
      return json({ error: 'Invalid payload' }, { status: 400 });
    }

    const data: Record<string, unknown> = {
      external_session_id: body.external_session_id,
      language: body.language || 'en',
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      duration: body.duration ?? null,
      messages: JSON.stringify(body.messages),
      topics: body.topics ? JSON.stringify(body.topics) : null,
      pain_points: body.pain_points ? JSON.stringify(body.pain_points) : null,
      objections: body.objections ? JSON.stringify(body.objections) : null,
      sentiment: body.sentiment || null,
      total_questions: body.total_questions ?? null,
      outcome: body.outcome || null,
      device: body.device || null,
    };

    const res = await ncbServerCreate(env, 'voice_sessions', data);
    if (!res.ok) {
      const text = await res.text();
      return json({ error: 'DB create failed', details: text }, { status: 500 });
    }

    return json({ ok: true });
  } catch (error) {
    console.error('[Webhook voice-agent] Error:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

