import { describe, test, expect } from 'vitest';
import { selectModel } from '@/lib/agent/modelRouter';
import { MODELS } from '@/lib/openai/config';

describe('selectModel', () => {
  describe('fast tier (greetings)', () => {
    test.each([
      'hi',
      'hello',
      'hey',
      'good morning',
      'good afternoon',
      'good evening',
      "what's up",
      'yo',
    ])('selects fast model for greeting: "%s"', (greeting) => {
      expect(selectModel(greeting)).toBe(MODELS.fast);
    });

    test('requires short greeting (< 30 chars)', () => {
      // Long text starting with greeting should not match fast
      const long = 'hello, can you analyze the quarterly revenue trends and compare them to last year?';
      expect(selectModel(long)).not.toBe(MODELS.fast);
    });
  });

  describe('reasoning tier', () => {
    test.each([
      'analyze my pipeline',
      'why did revenue drop?',
      'explain the trend in leads',
      'compare Q1 and Q2 performance',
      'recommend the best approach',
      'what strategy should we use?',
      'forecast next month revenue',
      'predict lead conversion',
      'what is the correlation between leads and revenue?',
      'root cause of the booking decline',
    ])('selects reasoning model for: "%s"', (question) => {
      expect(selectModel(question)).toBe(MODELS.reasoning);
    });
  });

  describe('standard tier (complex queries)', () => {
    test('selects standard for multiple questions', () => {
      const multi = 'How many leads do I have? And what about bookings?';
      expect(selectModel(multi)).toBe(MODELS.standard);
    });

    test('selects standard for long input (>200 chars)', () => {
      const long = 'Please help me understand the current state of all my ' + 'a'.repeat(200);
      expect(selectModel(long)).toBe(MODELS.standard);
    });
  });

  describe('default (fast)', () => {
    test('defaults to fast for simple queries', () => {
      expect(selectModel('show me leads')).toBe(MODELS.fast);
      expect(selectModel('open dashboard')).toBe(MODELS.fast);
      expect(selectModel('count my bookings')).toBe(MODELS.fast);
    });
  });

  test('trims whitespace before evaluating', () => {
    expect(selectModel('  hi  ')).toBe(MODELS.fast);
  });
});
