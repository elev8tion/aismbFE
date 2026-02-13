import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare/env';
import Stripe from 'stripe';
import { getTierPricing, getPriceEnvVar, type TierKey } from '@/lib/stripe/pricing';
import { sendWelcomeEmail, sendPaymentFailedAlert } from '@/lib/email/sendEmail';
import { ncbServerCreate, ncbServerUpdate, type NCBEnv } from '@/lib/agent/ncbClient';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const cfEnv = getEnv();
  const env = cfEnv as unknown as NCBEnv & Record<string, string>;

  const secret = env.STRIPE_SECRET_KEY;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

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
      // ─── Checkout (existing — assessment payments) ───
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout completed:', {
          id: session.id,
          amount_total: session.amount_total,
          email: session.customer_details?.email,
          metadata: session.metadata,
        });
        break;
      }

      // ─── Invoice Paid ───
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const meta = invoice.metadata || {};
        const isSetup = meta.type === 'setup';
        const partnershipId = meta.partnership_id;
        const tier = meta.tier as TierKey | undefined;

        console.log(`[Webhook] invoice.paid:`, {
          id: invoice.id,
          amount_paid: invoice.amount_paid,
          isSetup,
          partnershipId,
          subscription: invoice.subscription,
        });

        // Record payment in NCB
        await ncbServerCreate(env, 'payments', {
          type: isSetup ? 'setup' : 'subscription',
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
          stripe_invoice_id: invoice.id,
          stripe_customer_id: typeof invoice.customer === 'string' ? invoice.customer : '',
          customer_email: invoice.customer_email || '',
          partnership_id: partnershipId || null,
          subscription_id: typeof invoice.subscription === 'string' ? invoice.subscription : null,
        });

        if (isSetup && partnershipId) {
          // Update partnership status
          await ncbServerUpdate(env, 'partnerships', partnershipId, {
            payment_status: 'setup_paid',
          });

          // Create monthly subscription
          if (tier) {
            const envVar = getPriceEnvVar(tier);
            const priceId = envVar ? env[envVar] : null;
            const customerId = typeof invoice.customer === 'string' ? invoice.customer : '';

            if (priceId && customerId) {
              try {
                const subscription = await stripe.subscriptions.create({
                  customer: customerId,
                  items: [{ price: priceId }],
                  collection_method: 'charge_automatically',
                  metadata: { partnership_id: partnershipId, tier },
                });
                console.log(`[Webhook] Subscription created: ${subscription.id}`);

                // Record subscription in NCB
                await ncbServerCreate(env, 'subscriptions', {
                  stripe_subscription_id: subscription.id,
                  stripe_customer_id: customerId,
                  partnership_id: partnershipId,
                  tier,
                  status: subscription.status,
                  current_period_start: new Date(subscription.current_period_start * 1000).toISOString().split('T')[0],
                  current_period_end: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
                });
              } catch (subErr: any) {
                console.error('[Webhook] Failed to create subscription:', subErr?.message);
              }
            } else {
              console.warn(`[Webhook] Cannot create subscription: priceId=${priceId}, customerId=${customerId}`);
            }

            // Send welcome email
            const pricing = getTierPricing(tier);
            if (pricing) {
              await sendWelcomeEmail({
                to: invoice.customer_email || '',
                name: invoice.customer_name || meta.company_name || '',
                tier,
                tierName: pricing.name,
                company: meta.company_name || '',
                monthlyAmount: `$${(pricing.monthly / 100).toLocaleString()}`,
              });
            }
          }
        } else if (invoice.subscription) {
          // Recurring subscription payment — update subscription period
          const subId = typeof invoice.subscription === 'string' ? invoice.subscription : '';
          if (subId) {
            try {
              const sub = await stripe.subscriptions.retrieve(subId);
              // Find NCB subscription record by stripe_subscription_id and update period
              console.log(`[Webhook] Recurring payment for subscription ${subId}, period ends ${new Date(sub.current_period_end * 1000).toISOString()}`);
            } catch (subErr: any) {
              console.error('[Webhook] Failed to retrieve subscription:', subErr?.message);
            }
          }
        }
        break;
      }

      // ─── Invoice Payment Failed ───
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const meta = invoice.metadata || {};
        const partnershipId = meta.partnership_id;

        console.log(`[Webhook] invoice.payment_failed:`, {
          id: invoice.id,
          amount_due: invoice.amount_due,
          attempt_count: invoice.attempt_count,
          partnershipId,
        });

        // Record failed payment
        await ncbServerCreate(env, 'payments', {
          type: meta.type === 'setup' ? 'setup' : 'subscription',
          amount: invoice.amount_due / 100,
          currency: invoice.currency,
          status: 'failed',
          stripe_invoice_id: invoice.id,
          stripe_customer_id: typeof invoice.customer === 'string' ? invoice.customer : '',
          customer_email: invoice.customer_email || '',
          partnership_id: partnershipId || null,
          subscription_id: typeof invoice.subscription === 'string' ? invoice.subscription : null,
        });

        // Flag partnership health if applicable
        if (partnershipId) {
          await ncbServerUpdate(env, 'partnerships', partnershipId, {
            payment_status: 'past_due',
          });
        }

        // Alert admin about payment failure
        sendPaymentFailedAlert({
          adminEmail: 'connect@elev8tion.one',
          customerEmail: invoice.customer_email || '',
          customerName: invoice.customer_name || '',
          tier: meta.tier || 'unknown',
          amount: invoice.amount_due,
          attemptCount: invoice.attempt_count || 1,
          partnershipId: partnershipId || undefined,
        }).catch((err) => console.error('[Email] Failed to send payment failed alert:', err));

        break;
      }

      // ─── Subscription Created ───
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const meta = subscription.metadata || {};
        console.log(`[Webhook] subscription.created: ${subscription.id}`, meta);

        // Record in NCB (may already be recorded from invoice.paid handler)
        await ncbServerCreate(env, 'subscriptions', {
          stripe_subscription_id: subscription.id,
          stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : '',
          partnership_id: meta.partnership_id || null,
          tier: meta.tier || '',
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString().split('T')[0],
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
        });
        break;
      }

      // ─── Subscription Updated ───
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const meta = subscription.metadata || {};
        console.log(`[Webhook] subscription.updated: ${subscription.id}, status=${subscription.status}`);

        // We log the update — full NCB sync would require finding the record by stripe_subscription_id
        // For now, record the status change
        if (meta.partnership_id && subscription.status === 'past_due') {
          await ncbServerUpdate(env, 'partnerships', meta.partnership_id, {
            payment_status: 'past_due',
          });
        }
        break;
      }

      // ─── Subscription Deleted (Cancelled) ───
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const meta = subscription.metadata || {};
        console.log(`[Webhook] subscription.deleted: ${subscription.id}`);

        if (meta.partnership_id) {
          await ncbServerUpdate(env, 'partnerships', meta.partnership_id, {
            payment_status: 'cancelled',
          });
        }
        break;
      }

      // ─── Legacy / existing events ───
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', { id: pi.id, amount: pi.amount });
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
