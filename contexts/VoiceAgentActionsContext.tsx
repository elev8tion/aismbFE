'use client';

import { createContext, useContext, useRef, useMemo, ReactNode, useEffect } from 'react';

export interface ClientAction {
  type: string;
  // navigation
  route?: string;
  target?: string;
  // ui action
  scope?: string; // e.g., 'leads', 'contacts'
  action?: string; // e.g., 'set_filter', 'search', 'open_new', 'open_edit', 'open_view'
  payload?: Record<string, unknown>;
}

type Handler = (action: ClientAction) => void;

interface Ctx {
  subscribe: (handler: Handler) => () => void;
  emit: (action: ClientAction) => void;
}

const VoiceAgentActionsContext = createContext<Ctx | null>(null);

export function VoiceAgentActionsProvider({ children }: { children: ReactNode }) {
  const handlersRef = useRef(new Set<Handler>());

  const value = useMemo<Ctx>(() => ({
    subscribe: (handler: Handler) => {
      handlersRef.current.add(handler);
      return () => { handlersRef.current.delete(handler); };
    },
    emit: (action: ClientAction) => {
      for (const h of Array.from(handlersRef.current)) {
        try { h(action); } catch { /* non-fatal */ }
      }
    },
  }), []);

  // Cleanup on unmount
  useEffect(() => () => { handlersRef.current.clear(); }, []);

  return (
    <VoiceAgentActionsContext.Provider value={value}>
      {children}
    </VoiceAgentActionsContext.Provider>
  );
}

const noopCtx: Ctx = {
  subscribe: () => () => {},
  emit: () => {},
};

export function useVoiceAgentActions() {
  const ctx = useContext(VoiceAgentActionsContext);
  return ctx ?? noopCtx;
}

