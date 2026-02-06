/**
 * Session ID management utilities
 * Uses sessionStorage for client-side session persistence
 */

const SESSION_STORAGE_KEY = 'voice_agent_session_id';

/**
 * Generate a cryptographically secure random session ID
 */
export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create session ID from sessionStorage
 * Session persists until browser tab is closed
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return 'ssr-placeholder';
  }

  try {
    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }

    return sessionId;
  } catch {
    return generateSessionId();
  }
}

/**
 * Clear session ID from sessionStorage
 * Call this when user explicitly closes the voice agent
 */
export function clearSessionId(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // noop
  }
}

/**
 * Check if session ID exists
 */
export function hasSessionId(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
