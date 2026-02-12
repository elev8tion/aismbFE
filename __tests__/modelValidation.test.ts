import { MODELS } from '@/lib/openai/config';

/**
 * Valid OpenAI models as of February 2026
 * @see https://platform.openai.com/docs/models
 */
const VALID_MODELS = new Set([
  // Chat models
  'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo',
  // o-series reasoning models
  'o1', 'o1-mini', 'o1-preview', 'o3-mini',
  // Transcription
  'whisper-1',
  // Text-to-speech
  'tts-1', 'tts-1-hd',
  // Voices
  'echo', 'nova', 'alloy', 'fable', 'onyx', 'shimmer',
]);

describe('OpenAI Model Validation', () => {
  test('all models are valid OpenAI models', () => {
    Object.entries(MODELS).forEach(([key, model]) => {
      if (!VALID_MODELS.has(model)) {
        throw new Error(
          `Invalid OpenAI model "${model}" for key "${key}". ` +
          `Valid models: ${Array.from(VALID_MODELS).join(', ')}`
        );
      }
    });
  });

  test('fast tier uses cost-effective model', () => {
    const costEffectiveModels = ['gpt-4o-mini', 'gpt-3.5-turbo'];
    expect(costEffectiveModels).toContain(MODELS.fast);
  });

  test('tts model is valid', () => {
    expect(['tts-1', 'tts-1-hd']).toContain(MODELS.tts);
  });

  test('transcription model is whisper', () => {
    expect(MODELS.transcription).toBe('whisper-1');
  });

  test('voice models are valid', () => {
    const validVoices = ['echo', 'nova', 'alloy', 'fable', 'onyx', 'shimmer'];
    expect(validVoices).toContain(MODELS.voice);
    expect(validVoices).toContain(MODELS.voiceEs);
  });
});
