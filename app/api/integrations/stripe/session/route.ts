import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare/env';
import Stripe from 'stripe';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const cfEnv = getEnv();
  const env = cfEnv as unknown as Record<string, string>;

  const secret = env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email,
      metadata: session.metadata,
    });
  } catch (err: any) {
    console.error('Session retrieval error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to retrieve session' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
