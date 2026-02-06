import OpenAI from 'openai';

export function createOpenAI(apiKey: string): OpenAI {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }
  return new OpenAI({ apiKey });
}

// Three-tier model routing for CRM agent
export const MODELS = {
  // Fast tier — greetings, simple lookups
  fast: 'gpt-4.1-nano',
  // Standard tier — multi-step queries, summaries
  standard: 'gpt-4.1-mini',
  // Reasoning tier — analysis, "why" questions
  reasoning: 'o4-mini',
  // Speech
  transcription: 'whisper-1',
  tts: 'gpt-4o-mini-tts',
  voice: 'echo',
} as const;

export type ModelTier = 'fast' | 'standard' | 'reasoning';

// Language → TTS voice mapping
export const VOICE_MAP: Record<string, string> = {
  en: 'echo',
  es: 'coral',
  default: 'echo',
};

// Whisper verbose_json returns full language names (e.g. "english", "spanish").
// Normalize to ISO 639-1 codes so they match VOICE_MAP keys and NCB enum values.
const LANGUAGE_NORMALIZE: Record<string, string> = {
  english: 'en',
  spanish: 'es',
  en: 'en',
  es: 'es',
};

export function normalizeLanguageCode(raw?: string): string | undefined {
  if (!raw) return undefined;
  return LANGUAGE_NORMALIZE[raw.toLowerCase()] || raw.toLowerCase();
}
