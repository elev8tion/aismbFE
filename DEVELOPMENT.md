# AI SMB CRM - Development Guide

> **Domain:** `app.kre8tion.com`
> **Database:** NoCodeBackend instance `36905_ai_smb_crm`
> **Stack:** Next.js 15 + TypeScript + Tailwind CSS 4 + Cloudflare Pages

This document outlines extension points and patterns for developing new features in the CRM.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Extension Points](#2-extension-points)
3. [Adding New Pages](#3-adding-new-pages)
4. [Adding New Components](#4-adding-new-components)
5. [Database Operations](#5-database-operations)
6. [API Integration Patterns](#6-api-integration-patterns)
7. [Design System Usage](#7-design-system-usage)
8. [Authentication Patterns](#8-authentication-patterns)
9. [Roles & Permissions](#9-roles--permissions)
10. [Internationalization](#10-internationalization)
11. [Deployment](#11-deployment)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  app.kre8tion.com (Cloudflare Pages)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Pages      │  │  Components  │  │   Contexts   │          │
│  │  /dashboard  │  │  /layout     │  │  AuthContext │          │
│  │  /leads      │  │  /ui         │  │  LangContext │          │
│  │  /pipeline   │  │  /forms      │  │              │          │
│  │  /companies  │  │  /dashboard  │  │              │          │
│  │  ...         │  │  ...         │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Routes                             │   │
│  │  /api/auth/[...path]  →  NCB Auth API                    │   │
│  │  /api/data/[...path]  →  NCB Data API                    │   │
│  │  /api/webhooks/*      →  External integrations           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NOCODEBACKEND                                 │
│  Instance: 36905_ai_smb_crm                                     │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                         │
│  - companies, contacts, leads, opportunities                     │
│  - partnerships, voice_sessions, roi_calculations               │
│  - proposed_systems, delivered_systems, payments, activities    │
│  - ncba_user, ncba_session (auth tables)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Extension Points

### 🔌 EXTENSION POINT: New CRM Module

**Location:** `app/[module-name]/page.tsx`

**When to use:** Adding a new section to the CRM (e.g., Reports, Integrations, Email Templates)

**Steps:**
1. Create folder: `app/[module-name]/`
2. Create page: `app/[module-name]/page.tsx`
3. Add to sidebar: `components/layout/Sidebar.tsx`
4. Add translations: `lib/i18n/translations.ts`

**Template:**
```typescript
// app/reports/page.tsx
'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';

export default function ReportsPage() {
  const { t } = useTranslations();

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        {/* Your content here */}
      </div>
    </DashboardLayout>
  );
}
```

---

### 🔌 EXTENSION POINT: New Database Table

**Location:** NoCodeBackend Dashboard or API

**When to use:** Need to store new data entities

**Steps:**
1. Design schema (see Section 5)
2. Create table via NCB dashboard or `create_database` MCP tool
3. Create TypeScript types in `types/`
4. Create data hooks in `lib/hooks/`
5. Build UI components

**Example - Adding Email Templates:**
```typescript
// types/email-template.ts
export interface EmailTemplate {
  id: number;
  user_id: string;
  name: string;
  subject: string;
  body: string;
  category: 'nurture' | 'follow-up' | 'proposal' | 'onboarding';
  created_at: string;
  updated_at: string;
}
```

---

### 🔌 EXTENSION POINT: New UI Component

**Location:** `components/ui/[ComponentName].tsx`

**When to use:** Reusable UI element needed across pages

**Steps:**
1. Create component in `components/ui/`
2. Use design system classes from `globals.css`
3. Export from `components/ui/index.ts` (create if needed)

**Template:**
```typescript
// components/ui/Badge.tsx
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'tag',
    success: 'tag tag-success',
    warning: 'tag tag-warning',
    error: 'tag tag-error',
  };

  return <span className={variants[variant]}>{children}</span>;
}
```

---

### 🔌 EXTENSION POINT: New API Integration

**Location:** `app/api/[integration-name]/route.ts`

**When to use:** Integrating external services (Stripe, SendGrid, Cal.com, etc.)

**Steps:**
1. Create API route in `app/api/`
2. Add environment variables to `.env.local`
3. Create client-side hooks in `lib/hooks/`

**Template:**
```typescript
// app/api/integrations/calendar/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Call external API
  const res = await fetch('https://api.cal.com/v1/bookings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
```

---

### 🔌 EXTENSION POINT: New Webhook Handler

**Location:** `app/api/webhooks/[service]/route.ts`

**When to use:** Receiving events from external services

**Steps:**
1. Create webhook route
2. Verify webhook signature (if applicable)
3. Process event and update database
4. Return 200 response

**Template:**
```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  // Verify signature
  // Process event
  // Update database via /api/data/create/payments

  return NextResponse.json({ received: true });
}
```

---

### 🔌 EXTENSION POINT: New Dashboard Widget

**Location:** `components/dashboard/[WidgetName].tsx`

**When to use:** Adding new widgets to the dashboard

**Steps:**
1. Create widget component
2. Import in `app/dashboard/page.tsx`
3. Add to dashboard grid

**Template:**
```typescript
// components/dashboard/VoiceSessionsWidget.tsx
'use client';

import { useEffect, useState } from 'react';

export function VoiceSessionsWidget() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Fetch recent voice sessions
    fetch('/api/data/read/voice_sessions?limit=5')
      .then(res => res.json())
      .then(data => setSessions(data.data || []));
  }, []);

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-white mb-4">
        Recent Voice Sessions
      </h2>
      {/* Render sessions */}
    </div>
  );
}
```

---

### 🔌 EXTENSION POINT: New Form

**Location:** `components/forms/[FormName].tsx`

**When to use:** Data entry forms (Create Lead, Edit Company, etc.)

**Steps:**
1. Create form component with validation
2. Use `input-glass` and `select-glass` classes
3. Handle submission via API routes

**Template:**
```typescript
// components/forms/CreateLeadForm.tsx
'use client';

import { useState } from 'react';

interface CreateLeadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateLeadForm({ onSuccess, onCancel }: CreateLeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company_name: '',
    source: 'other',
    industry: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch('/api/data/create/leads', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create lead:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-white/60 mb-2">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="input-glass w-full"
          required
        />
      </div>
      {/* More fields... */}
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating...' : 'Create Lead'}
        </button>
      </div>
    </form>
  );
}
```

---

### 🔌 EXTENSION POINT: New Data Hook

**Location:** `lib/hooks/use[DataName].ts`

**When to use:** Reusable data fetching logic

**Template:**
```typescript
// lib/hooks/useLeads.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

interface Lead {
  id: number;
  email: string;
  first_name: string;
  // ... other fields
}

interface UseLeadsOptions {
  status?: string;
  limit?: number;
}

export function useLeads(options: UseLeadsOptions = {}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (options.status) params.set('status', options.status);
      if (options.limit) params.set('limit', options.limit.toString());

      const res = await fetch(`/api/data/read/leads?${params}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setLeads(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [options.status, options.limit]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads };
}
```

---

### 🔌 EXTENSION POINT: New Context Provider

**Location:** `contexts/[ContextName]Context.tsx`

**When to use:** Sharing state across components (e.g., Notifications, Modal state)

**Template:**
```typescript
// contexts/NotificationContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (type: Notification['type'], message: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
```

---

## 3. Adding New Pages

### File-based Routing

```
app/
├── page.tsx                    # / (redirects to /dashboard)
├── dashboard/page.tsx          # /dashboard
├── leads/
│   ├── page.tsx                # /leads
│   └── [id]/page.tsx           # /leads/123 (detail view)
├── pipeline/page.tsx           # /pipeline
├── (auth)/                     # Route group (no URL segment)
│   ├── login/page.tsx          # /login
│   └── register/page.tsx       # /register
```

### Adding a Detail Page

```typescript
// app/leads/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useEffect, useState } from 'react';

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id;
  const [lead, setLead] = useState(null);

  useEffect(() => {
    fetch(`/api/data/read/leads/${leadId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setLead(data.data));
  }, [leadId]);

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Lead detail content */}
      </div>
    </DashboardLayout>
  );
}
```

### Adding to Sidebar

```typescript
// components/layout/Sidebar.tsx

// 1. Add to navItems array
const navItems = [
  // ... existing items
  { key: 'reports', href: '/reports', icon: ReportsIcon },
];

// 2. Create icon component
function ReportsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6..." />
    </svg>
  );
}

// 3. Add translation key to lib/i18n/translations.ts
nav: {
  // ... existing
  reports: 'Reports', // en
  reports: 'Informes', // es
}
```

---

## 4. Adding New Components

### Component Organization

```
components/
├── layout/              # Layout components (Sidebar, Header, Footer)
├── ui/                  # Generic UI components (Button, Card, Badge, Modal)
├── forms/               # Form components (CreateLeadForm, EditCompanyForm)
├── dashboard/           # Dashboard-specific widgets
├── leads/               # Lead-specific components
├── pipeline/            # Pipeline-specific components (KanbanBoard, DealCard)
└── shared/              # Shared utilities (LoadingSpinner, EmptyState)
```

### Component Checklist

- [ ] TypeScript interfaces for props
- [ ] Use design system classes (`btn-primary`, `card`, `input-glass`)
- [ ] Handle loading and error states
- [ ] Support dark theme (all components are dark by default)
- [ ] Mobile responsive where applicable

---

## 5. Database Operations

### CRUD Operations via API

```typescript
// CREATE
await fetch('/api/data/create/leads', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', source: 'voice-agent' }),
});

// READ (all)
await fetch('/api/data/read/leads', { credentials: 'include' });

// READ (single)
await fetch('/api/data/read/leads/123', { credentials: 'include' });

// READ (with filters)
await fetch('/api/data/read/leads?status=qualified&industry=HVAC', { credentials: 'include' });

// UPDATE
await fetch('/api/data/update/leads/123', {
  method: 'PUT',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'contacted' }),
});

// DELETE
await fetch('/api/data/delete/leads/123', {
  method: 'DELETE',
  credentials: 'include',
});
```

### Available Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `companies` | Company/account records | name, industry, employee_count, ai_maturity_score |
| `contacts` | Contact people | company_id, email, role, decision_maker |
| `leads` | Lead capture | email, source, status, lead_score |
| `opportunities` | Sales deals | company_id, tier, stage, setup_fee |
| `partnerships` | Active engagements | opportunity_id, status, current_phase |
| `voice_sessions` | Voice agent transcripts | external_session_id, messages, sentiment |
| `roi_calculations` | ROI calc data | industry, hourly_rate, calculations |
| `proposed_systems` | Systems in proposals | opportunity_id, category, complexity |
| `delivered_systems` | Deployed systems | partnership_id, status, hours_saved_per_week |
| `payments` | Payment records | partnership_id, type, amount, status |
| `activities` | Activity log | type, subject, company_id, contact_id |

### Adding a New Table

Use the NoCodeBackend MCP tool or dashboard:

```typescript
// Example: Adding email_templates table
mcp__nocodebackend__create_database({
  name: "36905_ai_smb_crm",  // Existing database
  tables: [{
    name: "email_templates",
    columns: [
      { name: "name", type: "VARCHAR", length: 255, notNull: true },
      { name: "subject", type: "VARCHAR", length: 500, notNull: true },
      { name: "body", type: "TEXT", notNull: true },
      { name: "category", type: "DROPDOWN", options: ["nurture", "follow-up", "proposal", "onboarding"] },
      { name: "is_active", type: "BOOLEAN", defaultValue: "true" },
    ]
  }]
});
```

---

## 6. API Integration Patterns

### Pattern: External Service Integration

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Client/Page    │ ──▶  │  API Route       │ ──▶  │  External API   │
│  (React)        │      │  (Next.js)       │      │  (Stripe, etc.) │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

**Example integrations to add:**

| Integration | Purpose | API Route |
|-------------|---------|-----------|
| Stripe | Payment processing | `/api/integrations/stripe/*` |
| Resend/SendGrid | Email sending | `/api/integrations/email/*` |
| Cal.com | Calendar booking | `/api/integrations/calendar/*` |
| Twilio | SMS notifications | `/api/integrations/sms/*` |

### Pattern: Webhook Receiver

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  External       │ ──▶  │  Webhook Route   │ ──▶  │  NCB Database   │
│  Service        │      │  (verify + save) │      │  (via /api/data)│
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

---

## 7. Design System Usage

### CSS Classes Reference

```css
/* Buttons */
.btn-primary        /* Solid blue button */
.btn-secondary      /* Outlined button */
.btn-ghost          /* Transparent hover button */

/* Inputs */
.input-glass        /* Glassmorphic input */
.select-glass       /* Glassmorphic select */

/* Cards */
.card               /* Basic card */
.card-interactive   /* Card with hover lift */
.stat-card          /* Statistics card */

/* Tags/Badges */
.tag                /* Default blue tag */
.tag-success        /* Green tag */
.tag-warning        /* Orange tag */
.tag-error          /* Red tag */

/* Glass Effects */
.glass              /* Basic glass effect */
.liquid-glass       /* Enhanced liquid glass */

/* Layout */
.sidebar            /* Sidebar container */
.sidebar-item       /* Sidebar nav item */
.sidebar-item.active /* Active nav item */

/* Tables */
.table-glass        /* Glass-styled table */

/* Pipeline Stages */
.stage-new          /* Blue */
.stage-contacted    /* Purple */
.stage-discovery    /* Orange */
.stage-proposal     /* Yellow */
.stage-negotiation  /* Green */
.stage-won          /* Emerald */
.stage-lost         /* Red */
```

### Color Variables

```css
/* Use these CSS variables */
--brand-primary: #0EA5E9;
--brand-secondary: #0284C7;
--text-primary: #FFFFFF;
--text-secondary: rgba(255, 255, 255, 0.7);
--text-tertiary: rgba(255, 255, 255, 0.6);
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-border: rgba(255, 255, 255, 0.1);
```

### Tailwind Theme Extensions

```typescript
// Available in tailwind.config.ts
colors.primary.electricBlue  // #0EA5E9
colors.primary.cyan          // #06B6D4
colors.functional.success    // #10B981
colors.functional.error      // #EF4444
```

---

## 8. Authentication Patterns

### Protected Pages

All pages using `DashboardLayout` are automatically protected:

```typescript
// DashboardLayout handles auth check
export function DashboardLayout({ children }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading]);

  // ...
}
```

### Using Auth Context

```typescript
'use client';

import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, signOut } = useAuth();

  return (
    <div>
      <p>Logged in as: {user?.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### API Route Authentication

API routes in `/api/data/*` automatically verify session via cookies.

---

## 9. Roles & Permissions

> **Full Documentation:** See `ROLES_AND_PERMISSIONS.md` for complete details.

### Role Hierarchy

```
Admin (You)
├── Full access to all data
├── Manage users and roles
└── System configuration

Team Member (Future)
├── Access to assigned companies only
└── Cannot manage users or settings

Customer (Portal)
├── Read-only access to their partnership
└── Cannot see other customers or internal data
```

### Database Tables

| Table | Purpose |
|-------|---------|
| `user_profiles` | User role assignment (admin/team_member/customer) |
| `customer_access` | Links customers to specific partnerships |
| `team_assignments` | Links team members to specific companies |

### 🔌 EXTENSION POINT: Adding Permission Checks

**Location:** `lib/hooks/usePermissions.ts`

**When to use:** Restricting access to features by role

**Template:**
```typescript
// lib/hooks/usePermissions.ts
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export function usePermissions() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ role: string } | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/data/read/user_profiles?user_id=${user.id}`, {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => setProfile(data.data?.[0] || null));
    }
  }, [user?.id]);

  return {
    isAdmin: profile?.role === 'admin',
    isTeamMember: profile?.role === 'team_member',
    isCustomer: profile?.role === 'customer',
    canManageUsers: profile?.role === 'admin',
    canViewAllData: profile?.role === 'admin',
  };
}
```

### 🔌 EXTENSION POINT: Admin-Only Component

**Location:** `components/guards/AdminOnly.tsx`

**When to use:** Wrapping admin-only UI sections

**Template:**
```typescript
// components/guards/AdminOnly.tsx
'use client';

import { usePermissions } from '@/lib/hooks/usePermissions';

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = usePermissions();

  if (!isAdmin) return null;
  return <>{children}</>;
}

// Usage:
<AdminOnly>
  <button>Delete All Records</button>
</AdminOnly>
```

### 🔌 EXTENSION POINT: Customer Portal Routes

**Location:** `app/(portal)/`

**When to use:** Building customer-facing views

**Structure:**
```
app/
├── (admin)/              # Admin routes (existing CRM)
│   ├── dashboard/
│   ├── leads/
│   └── ...
└── (portal)/             # Customer portal (Phase 2)
    ├── layout.tsx        # Different nav for customers
    ├── page.tsx          # Customer dashboard
    └── partnership/
        └── [id]/page.tsx # Their partnership view
```

### Implementation Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1. Foundation | ✅ Done | Database tables created |
| 2. Admin Enforcement | 🔲 Next | Add permission checks, user management UI |
| 3. Customer Portal | 🔲 Future | Build `/portal` routes for clients |
| 4. Team Members | 🔲 When hiring | Assignment-based access control |

---

## 10. Internationalization

### Adding New Translations

```typescript
// lib/i18n/translations.ts

export const translations = {
  en: {
    // Add new keys here
    reports: {
      title: 'Reports',
      generate: 'Generate Report',
      export: 'Export to PDF',
    },
  },
  es: {
    reports: {
      title: 'Informes',
      generate: 'Generar Informe',
      export: 'Exportar a PDF',
    },
  },
};
```

### Using Translations

```typescript
'use client';

import { useTranslations } from '@/contexts/LanguageContext';

function ReportsPage() {
  const { t } = useTranslations();

  return (
    <h1>{t.reports.title}</h1>
  );
}
```

---

## 10. Deployment

### Cloudflare Pages Deployment

```bash
# Build for Cloudflare
npm run pages:build

# Preview locally
npx wrangler pages dev .vercel/output/static

# Deploy
npx wrangler pages deploy .vercel/output/static
```

### Environment Variables

Set in Cloudflare Pages dashboard:

```
NCB_INSTANCE=36905_ai_smb_crm
NCB_AUTH_API_URL=https://app.nocodebackend.com/api/user-auth
NCB_DATA_API_URL=https://app.nocodebackend.com/api/data
```

### Domain Setup

1. Add custom domain `app.kre8tion.com` in Cloudflare Pages
2. Add DNS CNAME record pointing to Cloudflare Pages
3. Enable SSL/TLS

---

## Quick Reference: Feature Development Checklist

When adding a new feature:

- [ ] **Database:** Create table if needed (NCB)
- [ ] **Types:** Add TypeScript interfaces (`types/`)
- [ ] **API:** Create routes if needed (`app/api/`)
- [ ] **Hooks:** Create data hooks (`lib/hooks/`)
- [ ] **Components:** Build UI components (`components/`)
- [ ] **Page:** Create page (`app/[feature]/page.tsx`)
- [ ] **Sidebar:** Add navigation (`components/layout/Sidebar.tsx`)
- [ ] **Translations:** Add i18n strings (`lib/i18n/translations.ts`)
- [ ] **Tests:** Add tests if applicable
- [ ] **Docs:** Update this document if architecture changes

---

## Future Feature Ideas

| Feature | Extension Points | Complexity |
|---------|------------------|------------|
| Email Campaigns | New table, API integration (Resend), new module | Medium |
| Reports & Analytics | New module, dashboard widgets, chart library | Medium |
| Calendar Integration | API integration (Cal.com), webhooks | Medium |
| Automated Workflows | New table, background jobs, trigger system | High |
| Document Generation | API route, PDF library, templates | Medium |
| Mobile App | React Native, shared API | High |
| Notifications | Context provider, websockets, UI component | Medium |
| Audit Log | New table, activity tracking hook | Low |
| Role-Based Permissions | Auth enhancement, UI guards | Medium |
| Import/Export | API routes, file processing | Low |

---

*Document Version: 1.0*
*Last Updated: February 2026*
