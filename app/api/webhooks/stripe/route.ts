import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 500 });
  }

  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });

  const payload = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: any) {
    console.error('Stripe signature verification failed:', err?.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout completed:', {
          id: session.id,
          amount_total: session.amount_total,
          currency: session.currency,
          email: session.customer_details?.email,
          metadata: session.metadata,
        });

        // Payment record is created from the success page (user is authenticated there)
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', {
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          metadata: pi.metadata,
        });
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', {
          id: invoice.id,
          amount_paid: invoice.amount_paid,
          customer_email: invoice.customer_email,
        });

        break;
      }
      default: {
        console.log('Unhandled Stripe event:', event.type);
      }
    }
  } catch (err: any) {
    console.error('Webhook processing error:', err?.message);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export const dynamic = 'force-dynamic';
