import { describe, test, expect, vi } from 'vitest';
import { executeTool } from '@/lib/agent/tools';

describe('executeTool', () => {
  test('returns error for unknown tool', async () => {
    const result = await executeTool('nonexistent_tool', {}, 'user-1', 'cookies');
    expect(result).toEqual({ error: 'Unknown tool: nonexistent_tool' });
  });

  test('executes navigate tool successfully', async () => {
    const result = await executeTool('navigate', { target: 'dashboard' }, 'user-1', 'cookies') as any;
    expect(result.ok).toBe(true);
    expect(result.route).toBe('/dashboard');
    expect(result.client_action.type).toBe('navigate');
  });

  test('executes ui_set_filter tool', async () => {
    const result = await executeTool(
      'ui_set_filter',
      { scope: 'leads', filter: 'qualified' },
      'user-1',
      'cookies'
    ) as any;
    expect(result.ok).toBe(true);
    expect(result.client_action.action).toBe('set_filter');
  });

  test('executes ui_search tool', async () => {
    const result = await executeTool(
      'ui_search',
      { scope: 'contacts', query: 'john' },
      'user-1',
      'cookies'
    ) as any;
    expect(result.ok).toBe(true);
    expect(result.client_action.payload.query).toBe('john');
  });

  test('executes ui_open_new tool', async () => {
    const result = await executeTool('ui_open_new', { scope: 'pipeline' }, 'user-1', 'cookies') as any;
    expect(result.ok).toBe(true);
    expect(result.client_action.action).toBe('open_new');
  });

  test('handles tool execution errors gracefully', async () => {
    // list_leads will try to fetch from NCB and fail — should return an error message
    const result = await executeTool('list_leads', {}, 'user-1', 'cookies') as any;
    expect(result).toHaveProperty('error');
  });
});
