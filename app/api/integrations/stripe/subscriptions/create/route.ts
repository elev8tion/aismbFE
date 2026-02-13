import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare/env';
import Stripe from 'stripe';
import { getPriceEnvVar, type TierKey } from '@/lib/stripe/pricing';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const cfEnv = getEnv();
  const env = cfEnv as unknown as Record<string, string>;

  const secret = env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });

  try {
    const body = await req.json();
    const { customer_id, tier, partnership_id } = body as {
      customer_id: string;
      tier: string;
      partnership_id: string;
    };

    if (!customer_id || !tier || !partnership_id) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_id, tier, partnership_id' },
        { status: 400 }
      );
    }

    const envVar = getPriceEnvVar(tier as TierKey);
    if (!envVar) {
      return NextResponse.json({ error: `Invalid tier: ${tier}` }, { status: 400 });
    }

    const priceId = env[envVar];
    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for tier ${tier} (env: ${envVar})` },
        { status: 500 }
      );
    }

    const subscription = await stripe.subscriptions.create({
      customer: customer_id,
      items: [{ price: priceId }],
      collection_method: 'charge_automatically',
      metadata: { partnership_id, tier },
    });

    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
    });
  } catch (err: any) {
    console.error('Subscription creation error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create subscription' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
