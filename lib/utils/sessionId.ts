// Session ID utility - generates and persists a session identifier

const SESSION_KEY = 'voice_session_id';

/**
 * Generates a unique session ID using crypto API with timestamp prefix
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).substring(2, 10);
  return `session_${timestamp}_${randomPart}`;
}

/**
 * Gets the current session ID from sessionStorage, or creates a new one
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return generateSessionId();
  }

  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      return stored;
    }

    const newId = generateSessionId();
    try {
      sessionStorage.setItem(SESSION_KEY, newId);
    } catch {
      console.warn('sessionStorage unavailable — using ephemeral session ID');
    }
    return newId;
  } catch {
    return generateSessionId();
  }
}

/**
 * Clears the current session ID (forces new session on next call)
 */
export function clearSessionId(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    console.warn('Failed to clear session ID from sessionStorage');
  }
}

/**
 * Resets and returns a fresh session ID
 */
export function resetSessionId(): string {
  clearSessionId();
  return getSessionId();
}
