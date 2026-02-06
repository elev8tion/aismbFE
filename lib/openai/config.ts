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
