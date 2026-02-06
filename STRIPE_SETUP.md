# Stripe Integration Setup

Follow these steps to enable Stripe Checkout and webhooks in this CRM.

## 1) Install dependencies

```bash
npm install
```

This installs the `stripe` SDK referenced by:
- app/api/integrations/stripe/checkout-session/route.ts:1
- app/api/webhooks/stripe/route.ts:1

## 2) Configure environment variables

Create `.env.local` (not committed) with:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # add after step 4
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

## 3) Start the dev server

```bash
npm run dev   # runs on http://localhost:3001
```

## 4) Authenticate Stripe CLI and get signing secret

Option A (recommended):
```bash
stripe login
```

Option B (no browser):
```bash
export STRIPE_API_KEY=sk_test_...   # temporary for CLI only
```

Then create a local webhook listener and print the signing secret:
```bash
stripe listen --forward-to http://localhost:3001/api/webhooks/stripe --print-secret
```

Copy the printed `whsec_...` into `.env.local` as `STRIPE_WEBHOOK_SECRET` and restart the dev server.

## 5) Test the webhook

With `stripe listen` running, trigger a test event:

```bash
stripe trigger payment_intent.succeeded
```

The server logs in `app/api/webhooks/stripe/route.ts:20` will show the received event.

## 6) Create a Checkout from the UI

- Open the Pipeline page, set a deal to `proposal-sent` or `negotiation`.
- Click “Collect Payment” on the deal card to start Checkout.

The endpoint used is:
- app/api/integrations/stripe/checkout-session/route.ts:1

Success redirects back to `/pipeline`.

## Notes

- Amounts passed from the UI are in cents (server expects integer cents).
- You can also pass existing Stripe Price IDs instead of raw amounts for subscriptions.
- Keep your `sk_live_...` key and `whsec_...` secrets out of version control.
