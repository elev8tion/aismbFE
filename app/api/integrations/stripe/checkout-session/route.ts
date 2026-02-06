import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });

  try {
    const body = await req.json();

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const {
      mode = 'payment',
      priceId,
      prices,
      amount,
      currency = 'usd',
      customer_email,
      metadata = {},
      opportunity_id,
      partnership_id,
      success_path = '/dashboard',
      cancel_path = '/pipeline',
      description = 'Checkout',
      product_name = 'Payment',
    } = body || {};

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
    } else {
      return NextResponse.json({ error: 'Missing priceId/prices or amount (in cents)' }, { status: 400 });
    }

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
