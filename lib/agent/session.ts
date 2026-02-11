import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface AgentSession {
  session_id: string;
  user_id: string;
  conversation: ChatCompletionMessageParam[];
  created_at: number;
}

const MAX_TURNS = 20;
const SESSION_TTL_SECONDS = 1800; // 30 minutes

// In-memory fallback for local dev (no KV binding)
const fallbackSessions = new Map<string, AgentSession>();

function kvKey(sessionId: string): string {
  return `session:${sessionId}`;
}

function newSession(sessionId: string, userId: string): AgentSession {
  return {
    session_id: sessionId,
    user_id: userId,
    conversation: [],
    created_at: Date.now(),
  };
}

export async function getSession(sessionId: string, userId: string, kv?: KVNamespace): Promise<AgentSession> {
  if (!kv) {
    console.warn('[session] AGENT_SESSIONS KV not available — using in-memory fallback');
    const existing = fallbackSessions.get(sessionId);
    if (existing && existing.user_id === userId) {
      if (Date.now() - existing.created_at > SESSION_TTL_SECONDS * 1000) {
        fallbackSessions.delete(sessionId);
      } else {
        return existing;
      }
    }
    const session = newSession(sessionId, userId);
    fallbackSessions.set(sessionId, session);
    return session;
  }

  const raw = await kv.get(kvKey(sessionId));
  if (raw) {
    try {
      const session: AgentSession = JSON.parse(raw);
      if (session.user_id === userId) {
        return session;
      }
    } catch {
      // corrupted — create fresh
    }
  }

  const session = newSession(sessionId, userId);
  await kv.put(kvKey(sessionId), JSON.stringify(session), { expirationTtl: SESSION_TTL_SECONDS });
  return session;
}

export async function addMessage(sessionId: string, message: ChatCompletionMessageParam, kv?: KVNamespace): Promise<void> {
  if (!kv) {
    const session = fallbackSessions.get(sessionId);
    if (!session) return;
    session.conversation.push(message);
    trimConversation(session);
    return;
  }

  const raw = await kv.get(kvKey(sessionId));
  if (!raw) return;

  try {
    const session: AgentSession = JSON.parse(raw);
    session.conversation.push(message);
    trimConversation(session);
    await kv.put(kvKey(sessionId), JSON.stringify(session), { expirationTtl: SESSION_TTL_SECONDS });
  } catch {
    // corrupted — skip
  }
}

export async function clearSession(sessionId: string, kv?: KVNamespace): Promise<void> {
  if (!kv) {
    fallbackSessions.delete(sessionId);
    return;
  }
  await kv.delete(kvKey(sessionId));
}

function trimConversation(session: AgentSession): void {
  const nonSystem = session.conversation.filter(m => m.role !== 'system');
  if (nonSystem.length > MAX_TURNS * 2) {
    const systemMsgs = session.conversation.filter(m => m.role === 'system');
    const recentNonSystem = nonSystem.slice(-MAX_TURNS * 2);
    session.conversation = [...systemMsgs, ...recentNonSystem];
  }
}
