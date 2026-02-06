// UI client actions — return directives for the client to adjust UI state

type Scope = 'leads' | 'contacts' | 'companies' | 'pipeline' | 'bookings' | 'partnerships' | 'voice_sessions' | 'roi_calculations' | 'reports_weekly' | 'settings';

export async function ui_set_filter(
  params: { scope: Scope; filter: string },
  _cookiesOrUserId: string
) {
  return {
    ok: true,
    client_action: {
      type: 'ui_action',
      scope: params.scope,
      action: 'set_filter',
      payload: { filter: params.filter },
    },
  };
}

export async function ui_search(
  params: { scope: Scope; query: string },
  _cookiesOrUserId: string
) {
  return {
    ok: true,
    client_action: {
      type: 'ui_action',
      scope: params.scope,
      action: 'search',
      payload: { query: params.query },
    },
  };
}

export async function ui_open_new(
  params: { scope: Scope },
  _cookiesOrUserId: string
) {
  return {
    ok: true,
    client_action: {
      type: 'ui_action',
      scope: params.scope,
      action: 'open_new',
    },
  };
}

export async function ui_open_edit(
  params: { scope: Scope; id?: string; query?: string },
  _cookiesOrUserId: string
) {
  return {
    ok: true,
    client_action: {
      type: 'ui_action',
      scope: params.scope,
      action: 'open_edit',
      payload: { id: params.id, query: params.query },
    },
  };
}

export async function ui_open_view(
  params: { scope: Scope; id?: string; query?: string },
  _cookiesOrUserId: string
) {
  return {
    ok: true,
    client_action: {
      type: 'ui_action',
      scope: params.scope,
      action: 'open_view',
      payload: { id: params.id, query: params.query },
    },
  };
}

