// Request Validator - Input validation and sanitization

export const LIMITS = {
  MAX_QUESTION_LENGTH: 2000,
  MAX_TEXT_LENGTH: 1000,
  MAX_AUDIO_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_AUDIO_DURATION: 60, // seconds
} as const;

interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validate and sanitize question text
 */
export function validateQuestion(question: unknown): ValidationResult {
  if (typeof question !== 'string') {
    return { valid: false, error: 'Question must be a string' };
  }

  const trimmed = question.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Question cannot be empty' };
  }

  if (trimmed.length > LIMITS.MAX_QUESTION_LENGTH) {
    return { valid: false, error: `Question too long (max ${LIMITS.MAX_QUESTION_LENGTH} characters, got ${trimmed.length})` };
  }

  const sanitized = sanitizeText(trimmed);

  // Check for suspicious patterns (XSS, injection attempts)
  const suspiciousPatterns = [
    /ignore\s+previous\s+instructions/i,
    /forget\s+your\s+instructions/i,
    /you\s+are\s+now/i,
    /system\s*:/i,
    /assistant\s*:/i,
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onclick=/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      console.warn(`⚠️ SUSPICIOUS PATTERN DETECTED: ${pattern.source}`);
    }
  }

  return { valid: true, sanitized };
}

/**
 * Validate text for TTS
 */
export function validateText(text: unknown): ValidationResult {
  if (typeof text !== 'string') {
    return { valid: false, error: 'Text must be a string' };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Text cannot be empty' };
  }

  if (trimmed.length > LIMITS.MAX_TEXT_LENGTH) {
    return { valid: false, error: `Text too long (max ${LIMITS.MAX_TEXT_LENGTH} characters, got ${trimmed.length})` };
  }

  const sanitized = sanitizeText(trimmed);
  return { valid: true, sanitized };
}

/**
 * Validate audio file
 */
export function validateAudioFile(file: File): ValidationResult {
  if (file.size > LIMITS.MAX_AUDIO_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxMB = (LIMITS.MAX_AUDIO_SIZE / (1024 * 1024)).toFixed(2);
    return { valid: false, error: `Audio file too large (${sizeMB}MB, max ${maxMB}MB)` };
  }

  const validTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
  const baseType = file.type.split(';')[0].trim();

  if (!validTypes.includes(baseType)) {
    return { valid: false, error: `Invalid audio type (${file.type}). Allowed: ${validTypes.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Sanitize text (remove dangerous characters)
 */
function sanitizeText(text: string): string {
  return text
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect potential prompt injection
 */
export function detectPromptInjection(text: string): { detected: boolean; pattern?: string } {
  const injectionPatterns = [
    { pattern: /ignore\s+(all\s+)?previous\s+instructions/i, name: 'Ignore instructions' },
    { pattern: /forget\s+(everything|all|your\s+instructions)/i, name: 'Forget instructions' },
    { pattern: /you\s+are\s+now\s+(a|an|the)/i, name: 'Role override' },
    { pattern: /new\s+instructions:/i, name: 'New instructions' },
    { pattern: /system\s*:\s*\w+/i, name: 'System message injection' },
    { pattern: /assistant\s*:\s*\w+/i, name: 'Assistant injection' },
    { pattern: /CRITICAL\s+SECURITY\s+UPDATE/i, name: 'Fake security update' },
  ];

  for (const { pattern, name } of injectionPatterns) {
    if (pattern.test(text)) {
      return { detected: true, pattern: name };
    }
  }

  return { detected: false };
}

/**
 * Check for profanity/inappropriate content (basic)
 */
export function containsProfanity(text: string): boolean {
  const profanityList: string[] = [];
  const lowerText = text.toLowerCase();
  return profanityList.some(word => lowerText.includes(word));
}

/**
 * Validate request body size
 */
export function validateBodySize(body: string, maxSize: number = 10 * 1024): ValidationResult {
  const size = new TextEncoder().encode(body).length;

  if (size > maxSize) {
    return { valid: false, error: `Request body too large (${size} bytes, max ${maxSize} bytes)` };
  }

  return { valid: true };
}
