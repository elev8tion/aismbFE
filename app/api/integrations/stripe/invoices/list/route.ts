import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import Stripe from 'stripe';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { env: cfEnv } = getRequestContext();
  const env = cfEnv as unknown as Record<string, string>;

  const secret = env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });

  try {
    const { searchParams } = new URL(req.url);
    const customer_id = searchParams.get('customer_id');
    const partnership_id = searchParams.get('partnership_id');

    const params: Stripe.InvoiceListParams = { limit: 50 };
    if (customer_id) {
      params.customer = customer_id;
    }

    const invoices = await stripe.invoices.list(params);

    // Filter by partnership_id in metadata if provided
    let filtered = invoices.data;
    if (partnership_id) {
      filtered = filtered.filter(
        (inv) => inv.metadata?.partnership_id === partnership_id
      );
    }

    const formatted = filtered.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount_due: inv.amount_due,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      created: inv.created,
      due_date: inv.due_date,
      paid: inv.paid,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
      customer_email: inv.customer_email,
      metadata: inv.metadata,
      subscription: inv.subscription,
    }));

    return NextResponse.json({ invoices: formatted });
  } catch (err: any) {
    console.error('Invoice list error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to list invoices' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
