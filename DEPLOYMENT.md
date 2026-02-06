# AI SMB CRM - Cloudflare Deployment Guide

## Project Information

| Setting | Value |
|---------|-------|
| **Project Name** | `ai-smb-crm` |
| **Production URL** | https://app.kre8tion.com |
| **Database** | NoCodeBackend `36905_ai_smb_crm` |
| **Related Project** | Landing Page at https://kre8tion.com |

---

## Architecture Overview

```
kre8tion.com (Landing Page)          app.kre8tion.com (CRM)
├── ai-smb-partners/                 ├── ai_smb_crm_frontend/
├── Cloudflare: kre8tion-app         ├── Cloudflare: ai-smb-crm
├── Voice Agent + ROI Calculator     ├── Dashboard + Pipeline + Leads
└── Lead Capture → ──────────────────└── Lead Management
```

---

## Initial Cloudflare Setup

### 1. Create Pages Project

```bash
# Navigate to CRM project
cd /Users/kcdacre8tor/ai_smb_crm_frontend

# Build for Cloudflare
npm run pages:build

# Create and deploy project
npx wrangler pages deploy .vercel/output/static --project-name=ai-smb-crm --commit-dirty=true --no-bundle
```

### 2. Configure Custom Domain

1. Go to Cloudflare Dashboard → Workers & Pages → ai-smb-crm
2. Click "Custom domains" tab
3. Add `app.kre8tion.com`
4. Cloudflare will auto-configure DNS if kre8tion.com is managed there

### 3. Set Environment Variables

In Cloudflare Dashboard → ai-smb-crm → Settings → Environment variables:

```
NCB_INSTANCE=36905_ai_smb_crm
NCB_AUTH_API_URL=https://app.nocodebackend.com/api/user-auth
NCB_DATA_API_URL=https://app.nocodebackend.com/api/data
```

---

## Deployment

There is NO auto-deploy from GitHub. Every deployment is manual via CLI:

```bash
# Build and deploy
npm run pages:build
npx wrangler pages deploy .vercel/output/static --project-name=ai-smb-crm --commit-dirty=true --no-bundle
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (port 3001 to avoid conflict with landing page on 3000)
npm run dev

# Access at http://localhost:3001
```

---

## Database (NoCodeBackend)

### Instance Details

| Setting | Value |
|---------|-------|
| **Instance Name** | `36905_ai_smb_crm` |
| **Dashboard** | https://app.nocodebackend.com |
| **Swagger API Docs** | https://app.nocodebackend.com/swagger?instance=36905_ai_smb_crm |

### Tables

- `companies` - Company/account records
- `contacts` - Contact management
- `leads` - Lead capture from landing page
- `opportunities` - Sales pipeline deals
- `partnerships` - Active engagements
- `voice_sessions` - Voice agent transcripts
- `roi_calculations` - ROI calculator submissions
- `proposed_systems` - Proposed systems in deals
- `delivered_systems` - Systems in active partnerships
- `payments` - Payment records
- `activities` - Activity log

---

## Integration with Landing Page

### Lead Flow

```
Landing Page (kre8tion.com)
    │
    ├── Voice Agent Session → POST /api/webhooks/voice-agent
    │                               ↓
    ├── ROI Calculator    → POST /api/webhooks/roi-calculator
    │                               ↓
    └── Calendar Booking  → POST /api/webhooks/calendar
                                    ↓
                            CRM Database (NCB)
                                    ↓
                            CRM Dashboard (app.kre8tion.com)
```

### Webhook Endpoints (To Implement)

| Endpoint | Purpose | Source |
|----------|---------|--------|
| `POST /api/webhooks/voice-agent` | Sync voice sessions | Landing page voice agent |
| `POST /api/webhooks/roi-calculator` | Sync ROI calculations | Landing page ROI calc |
| `POST /api/webhooks/calendar` | New bookings | Cal.com |
| `POST /api/webhooks/stripe` | Payment events | Stripe |

---

## Quick Commands

```bash
# Development
npm run dev                    # Start dev server on port 3001
npm run build                  # Standard Next.js build
npm run lint                   # Run linter

# Cloudflare Deployment
npm run pages:build           # Build for Cloudflare Pages
npx wrangler pages deploy .vercel/output/static --project-name=ai-smb-crm --commit-dirty=true --no-bundle

# Cloudflare Management
npx wrangler pages project list
npx wrangler pages deployment list --project-name=ai-smb-crm
npx wrangler pages deployment tail --project-name=ai-smb-crm
```

---

## Related Files

| File | Purpose |
|------|---------|
| `wrangler.toml` | Cloudflare configuration |
| `.env.local` | Local environment variables |
| `DEVELOPMENT.md` | Development guide & extension points |
| `package.json` | Project dependencies |

---

## Dashboard Links

- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **NoCodeBackend Dashboard:** https://app.nocodebackend.com
- **CRM (Production):** https://app.kre8tion.com
- **Landing Page (Production):** https://kre8tion.com
