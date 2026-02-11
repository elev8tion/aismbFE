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
  voiceEs: 'nova',
} as const;

export type ModelTier = 'fast' | 'standard' | 'reasoning';

// o-series models (o1, o3, o4) reject `temperature` and use `max_completion_tokens`.
// Build the correct params object based on the model name.
export function buildChatParams(model: string, extra?: { temperature?: number; max_tokens?: number }) {
  const isOSeries = /^o\d/.test(model);
  return {
    ...(isOSeries ? {} : { temperature: extra?.temperature ?? 0.3 }),
    ...(isOSeries
      ? { max_completion_tokens: extra?.max_tokens ?? 500 }
      : { max_tokens: extra?.max_tokens ?? 500 }),
  };
}
