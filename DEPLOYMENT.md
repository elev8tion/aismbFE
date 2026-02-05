# AI SMB CRM - Cloudflare Deployment Guide

## Project Information

| Setting | Value |
|---------|-------|
| **Project Name** | `ai-smb-crm` |
| **Production URL** | https://app.kreation.com |
| **Database** | NoCodeBackend `36905_ai_smb_crm` |
| **Related Project** | Landing Page at https://kreation.com |

---

## Architecture Overview

```
kreation.com (Landing Page)          app.kreation.com (CRM)
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
3. Add `app.kreation.com`
4. Cloudflare will auto-configure DNS if kreation.com is managed there

### 3. Set Environment Variables

In Cloudflare Dashboard → ai-smb-crm → Settings → Environment variables:

```
NCB_INSTANCE=36905_ai_smb_crm
NCB_AUTH_API_URL=https://app.nocodebackend.com/api/user-auth
NCB_DATA_API_URL=https://app.nocodebackend.com/api/data
```

---

## Deployment Methods

### Method 1: GitHub Auto-Deploy (Recommended)

Once connected to GitHub:

```bash
git add .
git commit -m "your message"
git push origin main
```

### Method 2: Manual CLI Deploy

```bash
# Build for Cloudflare
npm run pages:build

# Deploy
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
Landing Page (kreation.com)
    │
    ├── Voice Agent Session → POST /api/webhooks/voice-agent
    │                               ↓
    ├── ROI Calculator    → POST /api/webhooks/roi-calculator
    │                               ↓
    └── Calendar Booking  → POST /api/webhooks/calendar
                                    ↓
                            CRM Database (NCB)
                                    ↓
                            CRM Dashboard (app.kreation.com)
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
- **CRM (Production):** https://app.kreation.com
- **Landing Page (Production):** https://kreation.com
