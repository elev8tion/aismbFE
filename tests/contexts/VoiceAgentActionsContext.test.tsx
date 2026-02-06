import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
  VoiceAgentActionsProvider,
  useVoiceAgentActions,
  type ClientAction,
} from '@/contexts/VoiceAgentActionsContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <VoiceAgentActionsProvider>{children}</VoiceAgentActionsProvider>;
}

describe('VoiceAgentActionsContext', () => {
  test('useVoiceAgentActions returns noop context without provider', () => {
    const { result } = renderHook(() => useVoiceAgentActions());
    // Should not throw — returns noop
    expect(result.current.subscribe).toBeDefined();
    expect(result.current.emit).toBeDefined();

    // Noop subscribe returns unsubscribe function
    const unsub = result.current.subscribe(() => {});
    expect(typeof unsub).toBe('function');
    unsub(); // Should not throw
  });

  test('emit dispatches to subscribers', () => {
    const { result } = renderHook(() => useVoiceAgentActions(), { wrapper });
    const handler = vi.fn();

    act(() => {
      result.current.subscribe(handler);
    });

    const action: ClientAction = {
      type: 'ui_action',
      scope: 'leads',
      action: 'set_filter',
      payload: { filter: 'qualified' },
    };

    act(() => {
      result.current.emit(action);
    });

    expect(handler).toHaveBeenCalledWith(action);
  });

  test('unsubscribe removes handler', () => {
    const { result } = renderHook(() => useVoiceAgentActions(), { wrapper });
    const handler = vi.fn();

    let unsub: () => void;
    act(() => {
      unsub = result.current.subscribe(handler);
    });

    act(() => {
      unsub();
    });

    act(() => {
      result.current.emit({ type: 'navigate', route: '/leads' });
    });

    expect(handler).not.toHaveBeenCalled();
  });

  test('multiple subscribers all receive events', () => {
    const { result } = renderHook(() => useVoiceAgentActions(), { wrapper });
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    act(() => {
      result.current.subscribe(handler1);
      result.current.subscribe(handler2);
    });

    const action: ClientAction = { type: 'navigate', route: '/dashboard' };

    act(() => {
      result.current.emit(action);
    });

    expect(handler1).toHaveBeenCalledWith(action);
    expect(handler2).toHaveBeenCalledWith(action);
  });

  test('handler throwing does not break other handlers', () => {
    const { result } = renderHook(() => useVoiceAgentActions(), { wrapper });
    const badHandler = vi.fn(() => { throw new Error('boom'); });
    const goodHandler = vi.fn();

    act(() => {
      result.current.subscribe(badHandler);
      result.current.subscribe(goodHandler);
    });

    act(() => {
      result.current.emit({ type: 'navigate', route: '/leads' });
    });

    expect(badHandler).toHaveBeenCalled();
    expect(goodHandler).toHaveBeenCalled();
  });
});
