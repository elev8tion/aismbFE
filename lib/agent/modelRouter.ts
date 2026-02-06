import { MODELS, type ModelTier } from '@/lib/openai/config';

const GREETING_PATTERNS = /^(hi|hello|hey|good\s*(morning|afternoon|evening)|what'?s?\s*up|yo)\b/i;
const REASONING_PATTERNS = /\b(analyze|why|explain|compare|recommend|strategy|forecast|predict|trend|correlation|root\s*cause)\b/i;
const MULTI_QUESTION = /\?.*\?/;

export function selectModel(transcript: string): typeof MODELS[ModelTier] {
  const trimmed = transcript.trim();

  // Short greetings → nano
  if (trimmed.length < 30 && GREETING_PATTERNS.test(trimmed)) {
    return MODELS.fast;
  }

  // Reasoning keywords → o4-mini
  if (REASONING_PATTERNS.test(trimmed)) {
    return MODELS.reasoning;
  }

  // Multiple questions or long input → mini
  if (MULTI_QUESTION.test(trimmed) || trimmed.length > 200) {
    return MODELS.standard;
  }

  // Default → nano for speed
  return MODELS.fast;
}
