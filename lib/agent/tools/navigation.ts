// Navigation tool — returns a client_action for the UI to perform

type NavigateTarget =
  | 'dashboard'
  | 'leads'
  | 'contacts'
  | 'companies'
  | 'pipeline'
  | 'bookings'
  | 'bookings_availability'
  | 'partnerships'
  | 'drafts'
  | 'voice_sessions'
  | 'roi_calculations'
  | 'reports_weekly'
  | 'settings';

const TARGET_TO_ROUTE: Record<NavigateTarget, string> = {
  dashboard: '/dashboard',
  leads: '/leads',
  contacts: '/contacts',
  companies: '/companies',
  pipeline: '/pipeline',
  bookings: '/bookings',
  bookings_availability: '/bookings/availability',
  partnerships: '/partnerships',
  drafts: '/drafts',
  voice_sessions: '/voice-sessions',
  roi_calculations: '/roi-calculations',
  reports_weekly: '/reports/weekly',
  settings: '/settings',
};

export async function navigate(
  params: { target: NavigateTarget },
  _cookiesOrUserId: string
): Promise<{
  ok: boolean;
  target: string;
  route?: string;
  client_action?: { type: 'navigate'; route: string; target: string };
  error?: string;
}> {
  const target = String(params?.target || '').toLowerCase() as NavigateTarget;
  const route = TARGET_TO_ROUTE[target];
  if (!route) {
    return { ok: false, target, error: 'Invalid navigation target' };
  }

  return {
    ok: true,
    target,
    route,
    client_action: { type: 'navigate', route, target },
  };
}
