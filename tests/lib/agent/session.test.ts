import { describe, test, expect, vi, beforeEach } from 'vitest';

let sessionModule: typeof import('@/lib/agent/session');

beforeEach(async () => {
  vi.resetModules();
  sessionModule = await import('@/lib/agent/session');
});

describe('getSession', () => {
  test('creates new session for new sessionId', () => {
    const session = sessionModule.getSession('sess-1', 'user-1');
    expect(session.session_id).toBe('sess-1');
    expect(session.user_id).toBe('user-1');
    expect(session.conversation).toEqual([]);
    expect(session.created_at).toBeGreaterThan(0);
  });

  test('returns existing session for same sessionId and userId', () => {
    const first = sessionModule.getSession('sess-2', 'user-1');
    sessionModule.addMessage('sess-2', { role: 'user', content: 'hello' });
    const second = sessionModule.getSession('sess-2', 'user-1');
    expect(second.conversation).toHaveLength(1);
    expect(second).toBe(first);
  });

  test('creates new session if userId does not match', () => {
    sessionModule.getSession('sess-3', 'user-1');
    sessionModule.addMessage('sess-3', { role: 'user', content: 'hello' });
    const different = sessionModule.getSession('sess-3', 'user-2');
    expect(different.conversation).toEqual([]);
    expect(different.user_id).toBe('user-2');
  });

  test('creates new session if TTL expired', () => {
    const original = sessionModule.getSession('sess-4', 'user-1');
    sessionModule.addMessage('sess-4', { role: 'user', content: 'hello' });

    // Fast-forward past the 30-minute TTL
    vi.spyOn(Date, 'now').mockReturnValue(original.created_at + 31 * 60 * 1000);

    const refreshed = sessionModule.getSession('sess-4', 'user-1');
    expect(refreshed.conversation).toEqual([]);
    expect(refreshed).not.toBe(original);

    vi.restoreAllMocks();
  });
});

describe('addMessage', () => {
  test('adds message to existing session', () => {
    sessionModule.getSession('sess-5', 'user-1');
    sessionModule.addMessage('sess-5', { role: 'user', content: 'hello' });
    const session = sessionModule.getSession('sess-5', 'user-1');
    expect(session.conversation).toHaveLength(1);
    expect(session.conversation[0]).toEqual({ role: 'user', content: 'hello' });
  });

  test('ignores add for non-existent session', () => {
    // Should not throw
    sessionModule.addMessage('nonexistent', { role: 'user', content: 'hello' });
  });

  test('trims old non-system messages when exceeding MAX_TURNS*2', () => {
    const session = sessionModule.getSession('sess-6', 'user-1');
    sessionModule.addMessage('sess-6', { role: 'system', content: 'system prompt' });

    // Add 42 non-system messages (MAX_TURNS=20, so MAX_TURNS*2=40)
    for (let i = 0; i < 42; i++) {
      sessionModule.addMessage('sess-6', { role: 'user', content: `msg-${i}` });
    }

    const updated = sessionModule.getSession('sess-6', 'user-1');
    // System messages are preserved
    const systemMsgs = updated.conversation.filter(m => m.role === 'system');
    expect(systemMsgs).toHaveLength(1);

    // Non-system messages are trimmed to MAX_TURNS*2
    const nonSystem = updated.conversation.filter(m => m.role !== 'system');
    expect(nonSystem.length).toBeLessThanOrEqual(40);
  });
});

describe('clearSession', () => {
  test('removes session', () => {
    sessionModule.getSession('sess-7', 'user-1');
    sessionModule.addMessage('sess-7', { role: 'user', content: 'hello' });
    sessionModule.clearSession('sess-7');

    const fresh = sessionModule.getSession('sess-7', 'user-1');
    expect(fresh.conversation).toEqual([]);
  });
});
