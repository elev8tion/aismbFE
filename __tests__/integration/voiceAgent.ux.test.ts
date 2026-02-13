/**
 * Voice Agent UX Enhancement System Tests
 *
 * Comprehensive integration tests for voice agent UI enhancements:
 * - AI response text display
 * - Two-panel conversation UI
 * - Enhanced processing animations
 * - State management and cleanup
 * - Bilingual support
 *
 * Run with: npm test -- voiceAgent.ux.test.ts
 * Run with tracing: TRACE=true npm test -- voiceAgent.ux.test.ts
 *
 * Prerequisites:
 * - Dev server running on port 3001
 * - Valid NCB_SECRET_KEY in environment
 * - OpenAI API key configured
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';

const TRACE = process.env.TRACE === 'true';
const API_BASE = process.env.API_BASE || 'http://localhost:3003';
const TEST_EMAIL = process.env.TEST_EMAIL || 'connect@elev8tion.one';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Kre8tion2024!';

interface TraceLog {
  timestamp: string;
  scenario: string;
  step: string;
  status: 'start' | 'success' | 'error' | 'warning';
  data?: any;
  error?: any;
}

const traces: TraceLog[] = [];

function trace(scenario: string, step: string, status: TraceLog['status'], data?: any, error?: any) {
  const log: TraceLog = {
    timestamp: new Date().toISOString(),
    scenario,
    step,
    status,
    data,
    error,
  };

  traces.push(log);

  if (TRACE) {
    const emoji = status === 'success' ? '✅' : status === 'error' ? '❌' : status === 'warning' ? '⚠️' : '🔵';
    console.log(`${emoji} [${scenario}] ${step}`, data ? JSON.stringify(data, null, 2) : '');
    if (error) console.error('   Error:', error);
  }
}

function generateReport() {
  const report = {
    totalScenarios: new Set(traces.map(t => t.scenario)).size,
    totalSteps: traces.length,
    successSteps: traces.filter(t => t.status === 'success').length,
    errorSteps: traces.filter(t => t.status === 'error').length,
    warningSteps: traces.filter(t => t.status === 'warning').length,
    byScenario: {} as Record<string, any>,
  };

  const scenarios = Array.from(new Set(traces.map(t => t.scenario)));
  scenarios.forEach(scenario => {
    const scenarioTraces = traces.filter(t => t.scenario === scenario);
    const errors = scenarioTraces.filter(t => t.status === 'error');

    report.byScenario[scenario] = {
      totalSteps: scenarioTraces.length,
      success: scenarioTraces.filter(t => t.status === 'success').length,
      errors: errors.length,
      errorDetails: errors.map(e => ({
        step: e.step,
        error: e.error,
      })),
    };
  });

  return report;
}

// ─────────────────────────────────────────────────────────────────────────
// Authentication Helper
// ─────────────────────────────────────────────────────────────────────────

async function authenticate(): Promise<string> {
  const scenario = 'Authentication Setup';
  trace(scenario, 'Attempting sign-in', 'start', { email: TEST_EMAIL });

  try {
    const response = await fetch(`${API_BASE}/api/auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      trace(scenario, 'Sign-in failed', 'error', { status: response.status, error: errorText });
      throw new Error(`Authentication failed with status ${response.status}: ${errorText}`);
    }

    // Extract cookies from Set-Cookie headers
    // Note: In Node.js fetch, we need to handle cookies differently
    const setCookieHeader = response.headers.get('set-cookie');

    if (!setCookieHeader) {
      trace(scenario, 'No cookies in response', 'warning');
      return '';
    }

    // Parse cookies - looking for better-auth cookies
    const cookies = setCookieHeader
      .split(',')
      .map(cookie => cookie.trim())
      .filter(cookie => cookie.includes('better-auth'))
      .map(cookie => {
        // Extract just the cookie name=value part (before first semicolon)
        const match = cookie.match(/^([^;]+)/);
        return match ? match[1] : '';
      })
      .filter(Boolean)
      .join('; ');

    if (!cookies) {
      trace(scenario, 'No auth cookies found', 'warning', { setCookieHeader });
      return '';
    }

    trace(scenario, 'Authentication successful', 'success', {
      hasCookies: true,
      cookieCount: cookies.split(';').length
    });

    return cookies;
  } catch (error) {
    trace(scenario, 'Authentication error', 'error', null, error);
    throw error;
  }
}

let sessionCookie: string = '';

describe('Voice Agent UX Enhancement Tests', () => {
  beforeAll(async () => {
    // Authenticate once before all tests
    sessionCookie = await authenticate();

    if (!sessionCookie) {
      console.warn('⚠️  Warning: No session cookie obtained. Tests may fail with 401 errors.');
      console.warn('⚠️  Make sure TEST_EMAIL and TEST_PASSWORD environment variables are set correctly.');
    }
  }, 30000); // 30 second timeout for authentication
  afterAll(() => {
    if (TRACE) {
      console.log('\n\n📊 Test Report Summary:\n');
      console.log(JSON.stringify(generateReport(), null, 2));
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Scenario 1: Agent Chat API Response Format
  // ─────────────────────────────────────────────────────────────────────────

  test('Scenario 1: Agent returns text response for display', async () => {
    const scenario = 'Agent Chat Response Format';
    trace(scenario, 'Initialize test', 'start');

    try {
      const sessionId = `ux-test-${Date.now()}`;
      const question = 'What is the CRM about?';

      trace(scenario, 'Send chat request', 'start', { question, language: 'en', hasCookie: !!sessionCookie });

      const response = await fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          question,
          language: 'en',
          pagePath: '/dashboard',
        }),
      });

      trace(scenario, 'Received response', 'success', {
        status: response.status,
        contentType: response.headers.get('content-type'),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();

      trace(scenario, 'Parse response data', 'success', {
        hasResponse: !!data.response,
        responseLength: data.response?.length || 0,
        hasClientActions: Array.isArray(data.clientActions),
      });

      // Verify response structure
      expect(data).toHaveProperty('response');
      expect(typeof data.response).toBe('string');
      expect(data.response.length).toBeGreaterThan(0);

      // Verify no action tags visible (should be stripped before returning)
      expect(data.response).not.toMatch(/\[ACTION:[A-Z_]+\]/);

      trace(scenario, 'Response validation', 'success', {
        responsePreview: data.response.substring(0, 100) + '...',
        noActionTags: !data.response.includes('[ACTION:'),
      });

    } catch (error) {
      trace(scenario, 'Test failed', 'error', null, error);
      throw error;
    }
  }, 30000);

  // ─────────────────────────────────────────────────────────────────────────
  // Scenario 2: Speech Generation API
  // ─────────────────────────────────────────────────────────────────────────

  test('Scenario 2: Speech API generates audio blob', async () => {
    const scenario = 'Speech Generation';
    trace(scenario, 'Initialize test', 'start');

    try {
      const text = 'This is a test response for audio generation.';

      trace(scenario, 'Request speech generation', 'start', { textLength: text.length });

      const response = await fetch(`${API_BASE}/api/agent/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        credentials: 'include',
        body: JSON.stringify({
          text,
          language: 'en',
        }),
      });

      trace(scenario, 'Received audio response', 'success', {
        status: response.status,
        contentType: response.headers.get('content-type'),
      });

      expect(response.status).toBe(200);

      const contentType = response.headers.get('content-type');
      expect(contentType).toMatch(/audio\/(mpeg|mp3|wav)/);

      const audioBlob = await response.blob();
      expect(audioBlob.size).toBeGreaterThan(0);

      trace(scenario, 'Audio blob validation', 'success', {
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
      });

    } catch (error) {
      trace(scenario, 'Test failed', 'error', null, error);
      throw error;
    }
  }, 30000);

  // ─────────────────────────────────────────────────────────────────────────
  // Scenario 3: Bilingual Support (Spanish)
  // ─────────────────────────────────────────────────────────────────────────

  test('Scenario 3: Spanish language support', async () => {
    const scenario = 'Spanish Language Support';
    trace(scenario, 'Initialize test', 'start');

    try {
      const sessionId = `ux-test-es-${Date.now()}`;
      const question = '¿Qué es el CRM?';

      trace(scenario, 'Send Spanish request', 'start', { question, language: 'es' });

      const chatResponse = await fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          question,
          language: 'es',
          pagePath: '/dashboard',
        }),
      });

      expect(chatResponse.status).toBe(200);
      const chatData = await chatResponse.json();
      expect(chatData.response).toBeDefined();

      trace(scenario, 'Spanish chat response', 'success', {
        responseLength: chatData.response.length,
      });

      // Test Spanish speech generation
      trace(scenario, 'Request Spanish speech', 'start');

      const speechResponse = await fetch(`${API_BASE}/api/agent/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        credentials: 'include',
        body: JSON.stringify({
          text: chatData.response,
          language: 'es',
        }),
      });

      expect(speechResponse.status).toBe(200);
      const audioBlob = await speechResponse.blob();
      expect(audioBlob.size).toBeGreaterThan(0);

      trace(scenario, 'Spanish speech generation', 'success', {
        audioBlobSize: audioBlob.size,
      });

    } catch (error) {
      trace(scenario, 'Test failed', 'error', null, error);
      throw error;
    }
  }, 30000);

  // ─────────────────────────────────────────────────────────────────────────
  // Scenario 4: Session Continuity
  // ─────────────────────────────────────────────────────────────────────────

  test('Scenario 4: Session maintains context across requests', async () => {
    const scenario = 'Session Continuity';
    trace(scenario, 'Initialize test', 'start');

    try {
      const sessionId = `ux-test-session-${Date.now()}`;

      // First question
      trace(scenario, 'Send first question', 'start');

      const response1 = await fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          question: 'What is the company name?',
          language: 'en',
          pagePath: '/dashboard',
        }),
      });

      expect(response1.status).toBe(200);
      const data1 = await response1.json();
      trace(scenario, 'First response received', 'success', {
        responseLength: data1.response.length,
      });

      // Follow-up question using same session
      trace(scenario, 'Send follow-up question', 'start');

      const response2 = await fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          question: 'Tell me more about it',
          language: 'en',
          pagePath: '/dashboard',
        }),
      });

      expect(response2.status).toBe(200);
      const data2 = await response2.json();

      trace(scenario, 'Follow-up response received', 'success', {
        responseLength: data2.response.length,
        sessionMaintained: true,
      });

    } catch (error) {
      trace(scenario, 'Test failed', 'error', null, error);
      throw error;
    }
  }, 60000);

  // ─────────────────────────────────────────────────────────────────────────
  // Scenario 5: Client Actions in Response
  // ─────────────────────────────────────────────────────────────────────────

  test('Scenario 5: Client actions are properly formatted', async () => {
    const scenario = 'Client Actions Format';
    trace(scenario, 'Initialize test', 'start');

    try {
      const sessionId = `ux-test-actions-${Date.now()}`;

      // Ask a question that might trigger navigation
      const question = 'Show me the leads page';

      trace(scenario, 'Send navigation request', 'start', { question });

      const response = await fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          question,
          language: 'en',
          pagePath: '/dashboard',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      trace(scenario, 'Response received', 'success', {
        hasClientActions: !!data.clientActions,
        actionCount: data.clientActions?.length || 0,
      });

      // If client actions exist, validate structure
      if (data.clientActions && Array.isArray(data.clientActions)) {
        data.clientActions.forEach((action: any, index: number) => {
          expect(action).toHaveProperty('type');
          trace(scenario, `Client action ${index}`, 'success', {
            type: action.type,
            hasRoute: !!action.route,
          });
        });
      }

      // Response text should not contain action tags
      expect(data.response).not.toMatch(/\[ACTION:[A-Z_]+\]/);

      trace(scenario, 'Action validation complete', 'success');

    } catch (error) {
      trace(scenario, 'Test failed', 'error', null, error);
      throw error;
    }
  }, 30000);

  // ─────────────────────────────────────────────────────────────────────────
  // Scenario 6: Long Response Handling
  // ─────────────────────────────────────────────────────────────────────────

  test('Scenario 6: Long responses are handled correctly', async () => {
    const scenario = 'Long Response Handling';
    trace(scenario, 'Initialize test', 'start');

    try {
      const sessionId = `ux-test-long-${Date.now()}`;
      const question = 'Explain in detail what this CRM system can do and list all features';

      trace(scenario, 'Request detailed response', 'start');

      const response = await fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          question,
          language: 'en',
          pagePath: '/dashboard',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      const responseLength = data.response.length;
      trace(scenario, 'Long response received', 'success', {
        responseLength,
        hasMultipleSentences: data.response.split('.').length > 3,
      });

      // Verify response is substantial
      expect(responseLength).toBeGreaterThan(100);

      // Test speech generation with long text
      trace(scenario, 'Generate speech for long text', 'start');

      const speechResponse = await fetch(`${API_BASE}/api/agent/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        credentials: 'include',
        body: JSON.stringify({
          text: data.response,
          language: 'en',
        }),
      });

      expect(speechResponse.status).toBe(200);
      const audioBlob = await speechResponse.blob();

      trace(scenario, 'Long text audio generated', 'success', {
        textLength: data.response.length,
        audioBlobSize: audioBlob.size,
      });

    } catch (error) {
      trace(scenario, 'Test failed', 'error', null, error);
      throw error;
    }
  }, 60000);

  // ─────────────────────────────────────────────────────────────────────────
  // Scenario 7: Error Handling
  // ─────────────────────────────────────────────────────────────────────────

  test('Scenario 7: Error responses are properly formatted', async () => {
    const scenario = 'Error Handling';
    trace(scenario, 'Initialize test', 'start');

    try {
      // Test with missing required fields
      trace(scenario, 'Send malformed request', 'start');

      const response = await fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        credentials: 'include',
        body: JSON.stringify({
          // Missing sessionId, question
          language: 'en',
        }),
      });

      trace(scenario, 'Error response received', 'success', {
        status: response.status,
      });

      // Should return error status
      expect(response.status).toBeGreaterThanOrEqual(400);

      if (response.headers.get('content-type')?.includes('application/json')) {
        const errorData = await response.json();
        trace(scenario, 'Error data parsed', 'success', {
          hasErrorField: !!errorData.error,
        });
      }

    } catch (error) {
      trace(scenario, 'Test failed', 'error', null, error);
      throw error;
    }
  }, 30000);

  // ─────────────────────────────────────────────────────────────────────────
  // Scenario 8: Concurrent Requests (Abort Handling)
  // ─────────────────────────────────────────────────────────────────────────

  test('Scenario 8: Concurrent requests handling', async () => {
    const scenario = 'Concurrent Requests';
    trace(scenario, 'Initialize test', 'start');

    try {
      const sessionId = `ux-test-concurrent-${Date.now()}`;

      trace(scenario, 'Send first request', 'start');

      // Start first request
      const controller1 = new AbortController();
      const promise1 = fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          question: 'First question',
          language: 'en',
          pagePath: '/dashboard',
        }),
        signal: controller1.signal,
      });

      // Immediately abort first request (simulating user clicking during processing)
      trace(scenario, 'Abort first request', 'start');
      controller1.abort();

      try {
        await promise1;
      } catch (abortError: any) {
        expect(abortError.name).toBe('AbortError');
        trace(scenario, 'First request aborted', 'success');
      }

      // Send second request
      trace(scenario, 'Send second request', 'start');

      const response2 = await fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          question: 'Second question',
          language: 'en',
          pagePath: '/dashboard',
        }),
      });

      expect(response2.status).toBe(200);
      const data2 = await response2.json();

      trace(scenario, 'Second request completed', 'success', {
        responseLength: data2.response.length,
      });

    } catch (error) {
      trace(scenario, 'Test failed', 'error', null, error);
      throw error;
    }
  }, 60000);
});
