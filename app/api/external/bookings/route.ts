/**
 * External Bookings API
 *
 * Accepts booking data from the landing page (kre8tion.com) and creates
 * or updates the record in NCB via the OpenAPI endpoint.
 * Optionally upserts the guest as a lead at the same time.
 *
 * Auth: EXTERNAL_API_KEY env var.
 *
 * POST /api/external/bookings
 * Body: {
 *   guest_name, guest_email, guest_phone?,
 *   booking_date, start_time, end_time, timezone,
 *   booking_type?,          // "consultation" | "assessment"
 *   status?,                // "confirmed" | "cancelled" | "pending"
 *   company_name?, industry?, employee_count?, challenge?,
 *   stripe_session_id?, payment_status?, payment_amount_cents?,
 *   sync_lead?              // boolean — also upsert guest as a CRM lead
 * }
 * Response: { success: true, booking_id: number, lead_id?: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOptionalRequestContext } from '@cloudflare/next-on-pages';
import { ncbOpenApiRead, ncbOpenApiCreate, ncbOpenApiUpdate, type NCBEnv } from '@/lib/agent/ncbClient';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const ctx = getOptionalRequestContext();
  const env = (ctx?.env || process.env) as any as NCBEnv & { EXTERNAL_API_KEY?: string };

  // Validate API key
  const authHeader = req.headers.get('Authorization') || '';
  const apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!env.EXTERNAL_API_KEY || !apiKey || apiKey !== env.EXTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { guest_email, guest_name, booking_date, start_time, end_time, timezone } = body;
  if (!guest_email || !guest_name || !booking_date || !start_time || !end_time || !timezone) {
    return NextResponse.json(
      { error: 'Required fields: guest_email, guest_name, booking_date, start_time, end_time, timezone' },
      { status: 400 },
    );
  }

  try {
    // Build booking payload for NCB (bookings table has no user_id column)
    const bookingPayload: Record<string, unknown> = {
      guest_name,
      guest_email,
      booking_date,
      start_time,
      end_time,
      timezone,
      status: body.status || 'confirmed',
      booking_type: body.booking_type || 'consultation',
    };
    const optionalFields = ['guest_phone', 'company_name', 'industry', 'employee_count',
      'challenge', 'referral_source', 'website_url',
      'stripe_session_id', 'payment_status', 'payment_amount_cents'] as const;
    for (const field of optionalFields) {
      if (body[field] != null) bookingPayload[field] = body[field];
    }

    const bookingId = await ncbOpenApiCreate(env, 'bookings', bookingPayload);

    // Optionally upsert the guest as a CRM lead
    let leadId: number | null = null;
    if (body.sync_lead && typeof guest_email === 'string' && typeof guest_name === 'string') {
      const [firstName, ...rest] = guest_name.split(' ');
      const lastName = rest.join(' ') || null;

      const existing = await ncbOpenApiRead(env, 'leads', { email: guest_email.toLowerCase() });

      const leadPayload: Record<string, unknown> = {
        first_name: firstName,
        ...(lastName && { last_name: lastName }),
        ...(body.guest_phone != null && { phone: body.guest_phone }),
        ...(body.company_name != null && { company_name: body.company_name }),
        ...(body.industry != null && { industry: body.industry }),
        ...(body.employee_count != null && { employee_count: body.employee_count }),
        source: 'Calendar Booking',
        source_detail: `${booking_date} at ${start_time}${body.challenge ? ` — ${body.challenge}` : ''}`,
        lead_score: body.booking_type === 'assessment' ? 80 : 60,
      };

      if (existing.length > 0) {
        leadId = existing[0].id;
        await ncbOpenApiUpdate(env, 'leads', leadId!, leadPayload);
      } else {
        leadId = await ncbOpenApiCreate(env, 'leads', {
          email: guest_email.toLowerCase(),
          ...leadPayload,
          status: 'new',
        });
      }
    }

    return NextResponse.json({
      success: true,
      booking_id: bookingId,
      ...(leadId != null && { lead_id: leadId }),
    });
  } catch (error) {
    console.error('[External Bookings] Error:', error);
    return NextResponse.json({ error: 'Failed to sync booking' }, { status: 500 });
  }
}
