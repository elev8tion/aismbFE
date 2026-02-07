import { ncbUpdate } from '../ncbClient';

export async function bulk_update_lead_status(
  params: { lead_ids: string[]; status: string },
  cookies: string
) {
  const results = await Promise.all(
    params.lead_ids.map(id =>
      ncbUpdate('leads', id, { status: params.status }, cookies)
    )
  );
  return { success: true, updated: results.length, status: params.status };
}

export async function bulk_assign_leads(
  params: { lead_ids: string[]; assignee: string },
  cookies: string
) {
  const results = await Promise.all(
    params.lead_ids.map(id =>
      ncbUpdate('leads', id, { assigned_to: params.assignee }, cookies)
    )
  );
  return { success: true, assigned: results.length, assignee: params.assignee };
}
