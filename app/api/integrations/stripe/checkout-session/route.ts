import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare/env';
import Stripe from 'stripe';
import { createCheckoutSessionSchema } from '@/lib/validation/stripe.schemas';
import { formatZodErrors } from '@kre8tion/shared-types';

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

    // Validate with Zod
    const result = createCheckoutSessionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: formatZodErrors(result.error as any)
      }, { status: 400 });
    }

    const origin = req.headers.get('origin') || env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const {
      mode,
      priceId,
      prices,
      amount,
      currency,
      customer_email,
      metadata,
      opportunity_id,
      partnership_id,
      success_path,
      cancel_path,
      description,
      product_name,
    } = result.data;

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (Array.isArray(prices) && prices.length > 0) {
      for (const p of prices) {
        if (typeof p === 'string') {
          line_items.push({ price: p, quantity: 1 });
        } else if (p && typeof p === 'object') {
          line_items.push(p as Stripe.Checkout.SessionCreateParams.LineItem);
        }
      }
    } else if (priceId) {
      line_items.push({ price: priceId, quantity: 1 });
    } else if (typeof amount === 'number' && amount > 0) {
      const unit_amount = Math.round(amount); // expect cents from client
      line_items.push({
        price_data: {
          currency,
          product_data: { name: product_name, description },
          unit_amount,
        },
        quantity: 1,
      });
    }
    // Note: Zod validation ensures at least one of priceId, prices, or amount is provided

    const session = await stripe.checkout.sessions.create({
      mode: mode as 'payment' | 'subscription',
      payment_method_types: ['card'],
      line_items,
      success_url: `${origin}${success_path}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancel_path}`,
      customer_email,
      client_reference_id: opportunity_id || partnership_id || undefined,
      metadata: {
        ...metadata,
        opportunity_id: opportunity_id || '',
        partnership_id: partnership_id || '',
      },
      automatic_tax: { enabled: false },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
