// Selective response cache for agent chat
// Only caches responses with zero tool calls (pure conversational)
// KV-backed with in-memory fallback

const CACHE_TTL_SECONDS = 300; // 5 minutes
const MAX_MEMORY_ENTRIES = 50;

interface CachedResponse {
  response: string;
  model: string;
  cachedAt: number;
}

// In-memory fallback
const memoryCache = new Map<string, CachedResponse>();

async function hashKey(userId: string, question: string, pagePath: string): Promise<string> {
  const raw = `${userId}:${question.toLowerCase().trim()}:${pagePath}`;
  const encoded = new TextEncoder().encode(raw);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  const bytes = new Uint8Array(hash);
  return `rc:${Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

export async function getCachedResponse(
  userId: string,
  question: string,
  pagePath: string,
  kv?: KVNamespace
): Promise<CachedResponse | null> {
  const key = await hashKey(userId, question, pagePath);

  if (kv) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        return JSON.parse(raw) as CachedResponse;
      } catch {
        return null;
      }
    }
    return null;
  }

  // In-memory fallback
  const entry = memoryCache.get(key);
  if (entry && Date.now() - entry.cachedAt < CACHE_TTL_SECONDS * 1000) {
    return entry;
  }
  if (entry) memoryCache.delete(key);
  return null;
}

export async function setCachedResponse(
  userId: string,
  question: string,
  pagePath: string,
  response: string,
  model: string,
  kv?: KVNamespace
): Promise<void> {
  const key = await hashKey(userId, question, pagePath);
  const entry: CachedResponse = { response, model, cachedAt: Date.now() };

  if (kv) {
    await kv.put(key, JSON.stringify(entry), { expirationTtl: CACHE_TTL_SECONDS });
    return;
  }

  // In-memory fallback with size limit
  if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
    const oldest = memoryCache.keys().next().value;
    if (oldest) memoryCache.delete(oldest);
  }
  memoryCache.set(key, entry);
}
