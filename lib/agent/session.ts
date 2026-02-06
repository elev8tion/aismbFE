import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface AgentSession {
  session_id: string;
  user_id: string;
  conversation: ChatCompletionMessageParam[];
  created_at: number;
  language?: string;
  voiceSessionDbId?: string;
}

const MAX_TURNS = 20;
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

// In-memory session store (KV integration later)
const sessions = new Map<string, AgentSession>();

export function getSession(sessionId: string, userId: string): AgentSession {
  cleanupExpired();
  const existing = sessions.get(sessionId);

  if (existing && existing.user_id === userId) {
    // Check TTL
    if (Date.now() - existing.created_at > SESSION_TTL) {
      sessions.delete(sessionId);
    } else {
      return existing;
    }
  }

  const session: AgentSession = {
    session_id: sessionId,
    user_id: userId,
    conversation: [],
    created_at: Date.now(),
  };
  sessions.set(sessionId, session);
  return session;
}

export function addMessage(sessionId: string, message: ChatCompletionMessageParam): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.conversation.push(message);

  // Keep last MAX_TURNS messages (system messages excluded from count)
  const nonSystem = session.conversation.filter(m => m.role !== 'system');
  if (nonSystem.length > MAX_TURNS * 2) {
    // Keep system messages + last MAX_TURNS*2 non-system messages
    const systemMsgs = session.conversation.filter(m => m.role === 'system');
    const recentNonSystem = nonSystem.slice(-MAX_TURNS * 2);
    session.conversation = [...systemMsgs, ...recentNonSystem];
  }
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}

// Cleanup expired sessions on access (edge-safe — no global timers)
function cleanupExpired() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.created_at > SESSION_TTL) {
      sessions.delete(id);
    }
  }
}
