import { VoiceSession } from '@/types/voice';
import { generateSessionInsights } from './aiInsights';

export interface AutomatedTask {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'call' | 'email' | 'meeting' | 'task';
  dueDate: string;
}

/**
 * Automatically generates a task based on a voice session's AI insights.
 */
export function createTaskFromSession(session: VoiceSession): AutomatedTask {
  const insights = generateSessionInsights(session);
  const action = insights.nextBestAction;

  // Set due date to tomorrow at 9 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  return {
    title: action.action,
    description: `Automated follow-up based on Voice Session ${session.external_session_id.slice(0, 8)}. Reason: ${action.reason}`,
    priority: action.priority,
    type: action.action.toLowerCase().includes('call') ? 'call' : 
          action.action.toLowerCase().includes('email') ? 'email' : 
          action.action.toLowerCase().includes('meeting') ? 'meeting' : 'task',
    dueDate: tomorrow.toISOString(),
  };
}
