import { describe, test, expect } from 'vitest';
import {
  ui_set_filter,
  ui_search,
  ui_open_new,
  ui_open_edit,
  ui_open_view,
} from '@/lib/agent/tools/ui';

describe('ui_set_filter', () => {
  test('returns filter action with scope and filter', async () => {
    const result = await ui_set_filter({ scope: 'leads', filter: 'qualified' }, 'cookies');
    expect(result.ok).toBe(true);
    expect(result.client_action).toEqual({
      type: 'ui_action',
      scope: 'leads',
      action: 'set_filter',
      payload: { filter: 'qualified' },
    });
  });

  test('works with different scopes', async () => {
    const result = await ui_set_filter({ scope: 'bookings', filter: 'confirmed' }, 'cookies');
    expect(result.client_action.scope).toBe('bookings');
    expect(result.client_action.payload.filter).toBe('confirmed');
  });
});

describe('ui_search', () => {
  test('returns search action', async () => {
    const result = await ui_search({ scope: 'contacts', query: 'maria' }, 'cookies');
    expect(result.ok).toBe(true);
    expect(result.client_action).toEqual({
      type: 'ui_action',
      scope: 'contacts',
      action: 'search',
      payload: { query: 'maria' },
    });
  });
});

describe('ui_open_new', () => {
  test('returns open_new action', async () => {
    const result = await ui_open_new({ scope: 'leads' }, 'cookies');
    expect(result.ok).toBe(true);
    expect(result.client_action).toEqual({
      type: 'ui_action',
      scope: 'leads',
      action: 'open_new',
    });
  });
});

describe('ui_open_edit', () => {
  test('returns open_edit with id', async () => {
    const result = await ui_open_edit({ scope: 'leads', id: '123' }, 'cookies');
    expect(result.ok).toBe(true);
    expect(result.client_action).toEqual({
      type: 'ui_action',
      scope: 'leads',
      action: 'open_edit',
      payload: { id: '123', query: undefined },
    });
  });

  test('returns open_edit with query', async () => {
    const result = await ui_open_edit({ scope: 'leads', query: 'john' }, 'cookies');
    expect(result.client_action.payload).toEqual({ id: undefined, query: 'john' });
  });
});

describe('ui_open_view', () => {
  test('returns open_view with id', async () => {
    const result = await ui_open_view({ scope: 'pipeline', id: '456' }, 'cookies');
    expect(result.ok).toBe(true);
    expect(result.client_action).toEqual({
      type: 'ui_action',
      scope: 'pipeline',
      action: 'open_view',
      payload: { id: '456', query: undefined },
    });
  });

  test('returns open_view with query', async () => {
    const result = await ui_open_view({ scope: 'partnerships', query: 'xyz' }, 'cookies');
    expect(result.client_action.payload.query).toBe('xyz');
  });
});
