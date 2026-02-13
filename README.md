# AI KRE8TION Partners CRM

Next.js 15 CRM application for managing AI automation partnerships, deployed to Cloudflare Pages at `app.kre8tion.com`.

## Quick Start

```bash
npm install
npm run dev  # Runs on port 3001
```

## Deployment

**IMPORTANT:** There is NO auto-deploy from GitHub. You must manually build and deploy:

```bash
npm run pages:build && npx wrangler pages deploy .vercel/output/static --project-name=ai-smb-crm --commit-dirty=true --no-bundle
```

Always deploy after pushing changes so they appear on `app.kre8tion.com`.

## Type System

This project uses `@kre8tion/shared-types` for type definitions shared with the landing page.

### Rebuilding Types
If you modify types in `packages/shared-types/src/`:
```bash
cd packages/shared-types && npm run build && cd ../..
```

The `prebuild` script automatically builds shared-types before the main CRM build.

### Available Types

#### CRM Domain Types
- **Lead** - Lead management (email, source, score, status)
- **Contact** - Contact records (name, email, phone, company, role)
- **Company** - Company accounts (name, industry, employee count, AI maturity)
- **Opportunity** - Sales opportunities (name, tier, stage, contract value)
- **Partnership** - Active partnerships (tier, status, phase, health score)
- **Activity** - CRM activities (type, title, description, related records)
- **CustomerAccess** - Customer portal access control
- **TeamAssignment** - Team member assignments to partnerships

#### Booking Types
- **LandingPageBooking** - Booking records from landing page
- **CRMBooking** - CRM-specific booking format
- **BookingStatus** - 'pending' | 'confirmed' | 'cancelled'
- **BookingType** - 'discovery' | 'consultation' | 'demo'

#### Voice Agent Types
- **VoiceSession** - Voice agent conversation sessions
- **ConversationMessage** - Individual messages in conversations
- **ParsedVoiceSession** - Session with parsed JSON fields
- **ClientAction** - UI actions triggered by voice commands

#### ROI Types
- **LandingPageROICalculation** - ROI calculations from landing page
- **CRMROIAnalysis** - CRM-specific ROI analysis
- **ROIMetrics** - Simplified ROI metrics (time saved, value, payback)
- **ServiceTier** - 'discovery' | 'foundation' | 'architect'

#### Auth Types
- **User** - User account
- **UserProfile** - User profile with role and preferences
- **UserRole** - 'admin' | 'team_member' | 'customer'
- **Permission** - Permission types for RBAC

#### Payment Types
- **PaymentRecord** - Payment transaction records
- **Invoice** - Invoice details
- **StripeCheckoutSession** - Stripe checkout session data

#### NCB API Response Types
- **NCBListResponse<T>** - List response wrapper `{ data: T[] }`
- **NCBSingleResponse<T>** - Single record response `{ data: T }`
- **NCBCreateResponse** - Create response `{ status: "success", id: number }`
- **CheckoutSessionResponse** - Stripe checkout URL response
- **ContractCreateResponse** - Contract creation response with signing token
- **PortalBookingsResponse** - Portal bookings data
- **PortalContractsStatusResponse** - Portal contracts status

### Validation in API Routes

Use Zod schemas for request validation:

```typescript
import { validate, formatZodErrors, signInRequestSchema } from '@kre8tion/shared-types';

const result = schema.safeParse(body);
if (!result.success) {
  return NextResponse.json({
    error: 'Validation failed',
    details: formatZodErrors(result.error)
  }, { status: 400 });
}

// Use validated data
const { email, password } = result.data;
```

#### Available Validation Schemas

**Contract Validation** (`@/lib/validation/contract.schemas`)
- `createContractSchema` - Contract creation
- `signContractSchema` - Client signing
- `countersignContractSchema` - Admin countersigning
- `sendContractSchema` - Sending contract for signature

**Stripe Validation** (`@/lib/validation/stripe.schemas`)
- `createCheckoutSessionSchema` - Checkout session creation
- `createInvoiceSchema` - Invoice creation
- `createSubscriptionSchema` - Subscription creation

**Admin Validation** (`@/lib/validation/admin.schemas`)
- `grantAccessSchema` - Customer access grants

**Language Validation** (`@kre8tion/shared-types`)
- `languageSchema` - 'en' | 'es' validation

## Architecture

### API Proxy Pattern
All NCB data flows through Next.js API route proxies:
- `app/api/auth/[...path]/route.ts` - Auth proxy with cookie transformation
- `app/api/data/[...path]/route.ts` - Data proxy with session validation

CRUD pattern from client:
```
GET    /api/data/read/leads          - list
GET    /api/data/read/leads/123      - single
POST   /api/data/create/leads        - create (user_id auto-injected)
PUT    /api/data/update/leads/123    - update
DELETE /api/data/delete/leads/123    - delete
```

All client fetches must include `credentials: 'include'` for cookie auth.

### Authentication
Cookie-based via NCB's built-in auth. Use `useAuth()` hook for user state.
`DashboardLayout` wraps protected pages and redirects to `/login` if unauthenticated.

### Permissions
Three roles: `admin`, `team_member`, `customer`.
`usePermissions()` hook fetches from `user_profiles` table.
`AdminOnly` guard component restricts access.

### Internationalization
English and Spanish. `useTranslations()` returns `{ t, language, setLanguage }`.
Translations in `lib/i18n/translations.ts`.

## Environment Variables

```
NCB_INSTANCE=36905_ai_smb_crm
NCB_AUTH_API_URL=https://app.nocodebackend.com/api/user-auth
NCB_DATA_API_URL=https://app.nocodebackend.com/api/data
NCB_OPENAPI_URL=https://openapi.nocodebackend.com
NCB_SECRET_KEY=<from NCB Dashboard → Settings>
OPENAI_API_KEY=<OpenAI API key>
STRIPE_SECRET_KEY=<Stripe secret key>
```

## Key Conventions

- **All page components are client components** (`'use client'`) wrapped in `<DashboardLayout>`
- **Auth pages** use `(auth)` route group - no URL segment
- **Design system** in `app/globals.css` - glassmorphic dark theme
- **Tailwind** extended colors in `styles/colors.ts`, spacing in `styles/spacing.ts`
- **Path alias**: `@/*` maps to project root

## Documentation

- `CLAUDE.md` - Codebase instructions for Claude Code
- `DEVELOPMENT.md` - Extension points and templates
- `DEPLOYMENT.md` - Cloudflare Pages setup
- `ROLES_AND_PERMISSIONS.md` - RBAC design
- `MIGRATION-COMPLETE.md` - Shared types migration notes

## License

Private - ELEV8TION LLC
