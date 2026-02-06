import { VoiceSession, ConversationMessage } from '@/types/voice';
import { ROICalculation, ROIMetrics } from '@/types/roi';

export interface LeadScore {
  score: number; // 0-100
  level: 'cold' | 'warm' | 'hot' | 'fire';
  reasons: string[];
}

/**
 * Calculates a predictive lead score based on Voice Session data.
 */
export function scoreVoiceSession(session: VoiceSession): LeadScore {
  let score = 0;
  const reasons: string[] = [];

  // 1. Sentiment Analysis
  if (session.sentiment === 'positive') {
    score += 25;
    reasons.push('Positive sentiment detected');
  } else if (session.sentiment === 'neutral') {
    score += 5;
  } else if (session.sentiment === 'negative') {
    score -= 15;
    reasons.push('Negative sentiment flagged');
  }

  // 2. Engagement (Duration)
  if (session.duration > 300) { // > 5 mins
    score += 20;
    reasons.push('High engagement duration (>5m)');
  } else if (session.duration > 120) { // > 2 mins
    score += 10;
  }

  // 3. Curiosity (Questions Asked)
  if (session.total_questions >= 5) {
    score += 15;
    reasons.push('High curiosity (5+ questions)');
  }

  // 4. Outcome Value
  if (session.outcome === 'booking_scheduled') {
    score += 40;
    reasons.push('Booking scheduled');
  } else if (session.outcome === 'roi_calculator') {
    score += 20;
    reasons.push('Proceeded to ROI Calculator');
  }

  // 5. Intent Signals
  const intents = session.intents ? JSON.parse(session.intents) as string[] : [];
  if (intents.includes('pricing_inquiry')) {
    score += 10;
    reasons.push('Asked about pricing');
  }
  if (intents.includes('booking_intent')) {
    score += 15;
    reasons.push('Expressed booking intent');
  }

  // Normalize and cap at 100
  score = Math.min(Math.max(score, 0), 100);

  return {
    score,
    level: getLevel(score),
    reasons,
  };
}

/**
 * Calculates a predictive lead score based on ROI Calculation data.
 */
export function scoreROICalculation(calc: ROICalculation): LeadScore {
  let score = 0;
  const reasons: string[] = [];
  const metrics = calc.calculations ? JSON.parse(calc.calculations) as ROIMetrics : null;

  // 1. Conversion Actions
  if (calc.report_requested) {
    score += 30;
    reasons.push('ROI Report requested');
  }
  if (calc.email_captured) {
    score += 20;
    reasons.push('Email provided');
  }

  // 2. Engagement (Time & Adjustments)
  if (calc.time_on_calculator > 180) { // > 3 mins
    score += 15;
    reasons.push('Deep engagement with calculator');
  }
  if (calc.adjustments_count >= 3) {
    score += 10;
    reasons.push('Multiple scenario adjustments');
  }

  // 3. Financial Viability (Projected ROI)
  if (metrics?.roi && metrics.roi > 300) {
    score += 15;
    reasons.push('High projected ROI (>300%)');
  } else if (metrics?.roi && metrics.roi > 100) {
    score += 5;
  }

  // 4. Tier Selection
  if (calc.selected_tier === 'architect') {
    score += 10;
    reasons.push('Interested in top tier');
  }

  // Normalize and cap at 100
  score = Math.min(Math.max(score, 0), 100);

  return {
    score,
    level: getLevel(score),
    reasons,
  };
}

function getLevel(score: number): LeadScore['level'] {
  if (score >= 80) return 'fire';
  if (score >= 60) return 'hot';
  if (score >= 30) return 'warm';
  return 'cold';
}
