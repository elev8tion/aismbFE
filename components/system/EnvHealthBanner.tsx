'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';

type Health = {
  ok?: boolean;
  authenticated?: boolean;
  env?: Record<string, boolean>;
};

export function EnvHealthBanner() {
  const { permissions } = usePermissions();
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const d = localStorage.getItem('envHealthBanner:dismissed');
      if (d === 'true') setDismissed(true);
    } catch { /* ignore */ }
  }, []);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/health', { credentials: 'include' });
      const data = (await res.json()) as Health;
      const env = data.env || {};
      const missingVars = Object.entries(env)
        .filter(([, ok]) => !ok)
        .map(([k]) => k);
      setMissing(missingVars);
    } catch {
      // If health fails, surface a generic banner
      setMissing(['HEALTH_ENDPOINT']);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (permissions.isAdmin) {
      void check();
    }
  }, [permissions.isAdmin, check]);

  if (!permissions.isAdmin || dismissed || loading || missing.length === 0) return null;

  const message = missing.includes('HEALTH_ENDPOINT')
    ? 'Agent health check failed — verify server configuration.'
    : `Missing environment variables: ${missing.join(', ')}`;

  return (
    <div className="mx-4 my-3 rounded-lg border p-3"
      style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.35)' }}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: 'rgba(239,68,68,0.9)' }}>Environment Issue Detected</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(239,68,68,0.8)' }}>{message}</p>
          <div className="mt-2 flex gap-2">
            <a
              href="/api/agent/health"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 text-xs rounded-md"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
            >
              View health JSON
            </a>
            <button
              onClick={() => check()}
              className="px-2.5 py-1 text-xs rounded-md"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: 'rgba(239,68,68,0.9)' }}
            >
              Refresh
            </button>
          </div>
        </div>
        <button
          aria-label="Dismiss"
          onClick={() => { setDismissed(true); try { localStorage.setItem('envHealthBanner:dismissed', 'true'); } catch {} }}
          className="px-2 py-1 text-xs rounded-md"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

