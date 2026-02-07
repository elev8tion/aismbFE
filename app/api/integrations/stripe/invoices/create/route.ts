import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getTierPricing, type TierKey } from '@/lib/stripe/pricing';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });

  try {
    const body = await req.json();
    const {
      partnership_id,
      customer_email,
      customer_name,
      tier,
      company_name,
    } = body as {
      partnership_id: string;
      customer_email: string;
      customer_name: string;
      tier: string;
      company_name: string;
    };

    if (!partnership_id || !customer_email || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: partnership_id, customer_email, tier' },
        { status: 400 }
      );
    }

    const pricing = getTierPricing(tier);
    if (!pricing) {
      return NextResponse.json({ error: `Invalid tier: ${tier}` }, { status: 400 });
    }

    // Find or create Stripe customer
    const existing = await stripe.customers.list({ email: customer_email, limit: 1 });
    let customer: Stripe.Customer;

    if (existing.data.length > 0) {
      customer = existing.data[0];
    } else {
      customer = await stripe.customers.create({
        name: customer_name || company_name,
        email: customer_email,
        metadata: { partnership_id, company_name: company_name || '' },
      });
    }

    // Create invoice item (setup fee)
    await stripe.invoiceItems.create({
      customer: customer.id,
      amount: pricing.setup,
      currency: 'usd',
      description: `${pricing.name} — Setup Fee (${company_name || ''})`,
    });

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 0,
      metadata: {
        partnership_id,
        tier,
        type: 'setup',
        company_name: company_name || '',
      },
    });

    // Finalize and send
    await stripe.invoices.finalizeInvoice(invoice.id);
    await stripe.invoices.sendInvoice(invoice.id);

    return NextResponse.json({
      success: true,
      invoice_id: invoice.id,
      invoice_url: invoice.hosted_invoice_url,
      customer_id: customer.id,
    });
  } catch (err: any) {
    console.error('Invoice creation error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create invoice' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
