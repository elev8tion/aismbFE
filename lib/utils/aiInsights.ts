import { VoiceSession, ConversationMessage } from '@/types/voice';

export interface AIInsight {
  emotionalArc: { time: number; sentiment: number; label: string }[];
  topIntents: { label: string; confidence: number }[];
  nextBestAction: { action: string; priority: 'high' | 'medium' | 'low'; reason: string };
  summary: string;
}

/**
 * Simulates an AI analysis of a voice session transcript.
 * In production, this would call an LLM API.
 */
export function generateSessionInsights(session: VoiceSession): AIInsight {
  const messages: ConversationMessage[] = session.messages ? JSON.parse(session.messages) : [];
  const text = messages.map(m => m.content).join(' ').toLowerCase();

  // 1. Generate Emotional Arc (Mocked based on sentiment)
  // Maps the session duration into 4 key points
  const baseSentiment = session.sentiment === 'positive' ? 0.8 : session.sentiment === 'negative' ? 0.2 : 0.5;
  const emotionalArc = [
    { time: 0, sentiment: 0.5, label: 'Start' },
    { time: 0.33, sentiment: baseSentiment - 0.1, label: 'Discovery' },
    { time: 0.66, sentiment: baseSentiment + 0.1, label: 'Solution' },
    { time: 1, sentiment: baseSentiment, label: 'Close' },
  ];

  // 2. Extract Top Intents (Deterministic matching)
  const topIntents = [];
  if (text.includes('price') || text.includes('cost') || text.includes('expensive')) {
    topIntents.push({ label: 'Pricing Query', confidence: 0.95 });
  }
  if (text.includes('schedule') || text.includes('book') || text.includes('calendar')) {
    topIntents.push({ label: 'Scheduling Intent', confidence: 0.98 });
  }
  if (text.includes('hvac') || text.includes('plumbing') || text.includes('electrical')) {
    topIntents.push({ label: 'Industry Fit', confidence: 0.90 });
  }
  if (text.includes('roi') || text.includes('save') || text.includes('hours')) {
    topIntents.push({ label: 'ROI Focus', confidence: 0.85 });
  }
  if (topIntents.length === 0) {
    topIntents.push({ label: 'General Inquiry', confidence: 0.70 });
  }

  // 3. Determine Next Best Action
  let nextBestAction: AIInsight['nextBestAction'];

  if (session.outcome === 'booking_scheduled') {
    nextBestAction = {
      action: 'Prepare Discovery Call Deck',
      priority: 'high',
      reason: 'User has booked a slot; prep industry-specific case studies.',
    };
  } else if (session.outcome === 'roi_calculator') {
    nextBestAction = {
      action: 'Send ROI Report Email',
      priority: 'high',
      reason: 'User engaged with calculator but did not book yet.',
    };
  } else if (session.sentiment === 'negative') {
    nextBestAction = {
      action: 'Manual Follow-up (Feedback)',
      priority: 'medium',
      reason: 'User had a negative experience; personal outreach recommended.',
    };
  } else {
    nextBestAction = {
      action: 'Add to Nurture Sequence',
      priority: 'low',
      reason: 'General interest shown; keep top of mind.',
    };
  }

  // 4. Generate Summary
  const summary = `User discussed ${topIntents.map(i => i.label).join(', ')}. ` +
    `Session lasted ${Math.round(session.duration / 60)} mins with ${session.sentiment} sentiment. ` +
    `Ended with ${session.outcome?.replace('_', ' ')}.`;

  return {
    emotionalArc,
    topIntents,
    nextBestAction,
    summary,
  };
}
