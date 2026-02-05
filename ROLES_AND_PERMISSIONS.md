# AI SMB CRM - Roles, Permissions & Access Control

> **Status:** Foundation implemented, enforcement in phases
> **Database:** NoCodeBackend `36905_ai_smb_crm`
> **Last Updated:** February 2026

This document outlines the complete roles and permissions system for the AI SMB CRM, including implementation status, code patterns, and phase-by-phase rollout plan.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Role Definitions](#2-role-definitions)
3. [Permission Matrix](#3-permission-matrix)
4. [Database Schema](#4-database-schema)
5. [Implementation Phases](#5-implementation-phases)
6. [Code Patterns](#6-code-patterns)
7. [Customer Portal Access](#7-customer-portal-access)
8. [API Security](#8-api-security)
9. [Testing Checklist](#9-testing-checklist)
10. [Future Enhancements](#10-future-enhancements)

---

## 1. Overview

### Access Control Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ACCESS HIERARCHY                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ADMIN (You)                                                        │
│   ├── Full access to all data                                        │
│   ├── Can create/manage team members                                 │
│   ├── Can grant customer access                                      │
│   └── System configuration                                           │
│                                                                      │
│   TEAM MEMBER (Future employees)                                     │
│   ├── Access to assigned companies only                              │
│   ├── Can manage leads, opportunities, partnerships (assigned)       │
│   ├── Cannot see unassigned accounts                                 │
│   └── Cannot manage users or system settings                         │
│                                                                      │
│   CUSTOMER (Client portal users)                                     │
│   ├── Read-only access to their partnership(s)                       │
│   ├── Can view: progress, systems, documents, meetings               │
│   ├── Can add comments (if enabled)                                  │
│   └── Cannot see other customers or internal data                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Current State

| Component | Status | Notes |
|-----------|--------|-------|
| Database tables | ✅ Created | `user_profiles`, `customer_access`, `team_assignments` |
| Role assignment | 🔲 To implement | Admin UI to assign roles |
| Permission checks | 🔲 To implement | Middleware/hooks |
| Customer portal | 🔲 Phase 2 | Separate routes |
| Team member support | 🔲 Phase 3 | When you hire |

---

## 2. Role Definitions

### Admin

**Who:** Business owner/operator (currently just you)

**Capabilities:**
- Full CRUD on all entities
- View all companies, contacts, leads, opportunities, partnerships
- Manage user accounts and roles
- Grant/revoke customer access
- Assign team members to accounts
- Access system settings and configuration
- View all analytics and reports
- Export all data

**Restrictions:**
- None (superuser)

---

### Team Member

**Who:** Future employees, contractors, sales reps

**Capabilities:**
- CRUD on assigned companies and related data
- View/edit leads assigned to them
- Manage opportunities for assigned companies
- Log activities and notes
- View own performance metrics

**Restrictions:**
- Cannot see unassigned companies
- Cannot manage users
- Cannot access system settings
- Cannot grant customer access
- Cannot see company-wide analytics

**Assignment Model:**
```
team_assignments:
  user_id: "team_member_123"
  company_id: 5
  role: "owner" | "collaborator" | "viewer"
```

| Assignment Role | Can Edit | Can Delete | See Financials |
|-----------------|----------|------------|----------------|
| owner | ✅ | ✅ | ✅ |
| collaborator | ✅ | ❌ | ❌ |
| viewer | ❌ | ❌ | ❌ |

---

### Customer

**Who:** Client contacts from active partnerships

**Capabilities:**
- View their partnership dashboard
- See systems being built/delivered
- Access shared documents
- View meeting schedule
- Add comments (if access_level = 'comment' or 'edit')
- Download their reports

**Restrictions:**
- Read-only by default
- Cannot see other customers
- Cannot see internal notes/activities
- Cannot see financial details (unless explicitly shared)
- Cannot access admin sections

**Access Model:**
```
customer_access:
  user_id: "customer_456"
  partnership_id: 12
  access_level: "view" | "comment" | "edit"
  expires_at: "2024-12-31" (optional)
```

---

## 3. Permission Matrix

### Entity Permissions by Role

| Entity | Admin | Team (Assigned) | Team (Unassigned) | Customer |
|--------|-------|-----------------|-------------------|----------|
| **Companies** |
| List all | ✅ | ❌ | ❌ | ❌ |
| List assigned | ✅ | ✅ | ❌ | ❌ |
| View details | ✅ | ✅ | ❌ | ❌ |
| Create | ✅ | ✅ | ❌ | ❌ |
| Edit | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| **Contacts** |
| List all | ✅ | ❌ | ❌ | ❌ |
| List for company | ✅ | ✅ | ❌ | ❌ |
| Create | ✅ | ✅ | ❌ | ❌ |
| Edit | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| **Leads** |
| List all | ✅ | ❌ | ❌ | ❌ |
| List assigned | ✅ | ✅ | ❌ | ❌ |
| Create | ✅ | ✅ | ❌ | ❌ |
| Edit | ✅ | ✅ | ❌ | ❌ |
| Convert | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| **Opportunities** |
| List all | ✅ | ❌ | ❌ | ❌ |
| List for company | ✅ | ✅ | ❌ | ❌ |
| Create | ✅ | ✅ | ❌ | ❌ |
| Edit | ✅ | ✅ | ❌ | ❌ |
| Change stage | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| **Partnerships** |
| List all | ✅ | ❌ | ❌ | ❌ |
| List assigned | ✅ | ✅ | ❌ | Own only |
| View details | ✅ | ✅ | ❌ | Own only |
| Edit | ✅ | ✅ | ❌ | ❌ |
| Update progress | ✅ | ✅ | ❌ | ❌ |
| **Systems** |
| View all | ✅ | ❌ | ❌ | ❌ |
| View for partnership | ✅ | ✅ | ❌ | Own only |
| Create | ✅ | ✅ | ❌ | ❌ |
| Update status | ✅ | ✅ | ❌ | ❌ |
| **Payments** |
| View all | ✅ | ❌ | ❌ | ❌ |
| View for partnership | ✅ | ✅ | ❌ | ❌* |
| Record payment | ✅ | ❌ | ❌ | ❌ |
| **Activities** |
| View all | ✅ | ❌ | ❌ | ❌ |
| View for entity | ✅ | ✅ | ❌ | ❌** |
| Create | ✅ | ✅ | ❌ | Comment*** |
| **Voice Sessions** |
| View all | ✅ | ❌ | ❌ | ❌ |
| View for lead | ✅ | ✅ | ❌ | ❌ |
| **Settings** |
| View | ✅ | ❌ | ❌ | ❌ |
| Edit | ✅ | ❌ | ❌ | ❌ |
| **Users** |
| List all | ✅ | ❌ | ❌ | ❌ |
| Create | ✅ | ❌ | ❌ | ❌ |
| Assign roles | ✅ | ❌ | ❌ | ❌ |
| Grant access | ✅ | ❌ | ❌ | ❌ |

*Customers can see payment status (paid/pending) but not amounts, unless explicitly enabled
**Customers see only milestone/progress activities, not internal notes
***Customers can comment only if access_level is 'comment' or 'edit'

---

## 4. Database Schema

### Tables Created

```sql
-- User profiles with role assignment
CREATE TABLE user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,  -- Links to ncba_user.id
  role ENUM('admin', 'team_member', 'customer') NOT NULL DEFAULT 'customer',
  display_name VARCHAR(255),
  phone VARCHAR(50),
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  notification_preferences TEXT,  -- JSON: { email: true, sms: false }
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customer access to specific partnerships
CREATE TABLE customer_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,          -- Customer's user ID
  partnership_id INT NOT NULL,            -- Which partnership they can access
  access_level ENUM('view', 'comment', 'edit') NOT NULL DEFAULT 'view',
  granted_by VARCHAR(255) NOT NULL,       -- Admin who granted access
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,                    -- Optional expiration
  is_active BOOLEAN DEFAULT TRUE
);

-- Team member assignments to companies
CREATE TABLE team_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,          -- Team member's user ID
  company_id INT NOT NULL,                -- Which company they're assigned to
  role ENUM('owner', 'collaborator', 'viewer') NOT NULL DEFAULT 'collaborator',
  assigned_by VARCHAR(255) NOT NULL,      -- Admin who assigned them
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

### Entity Relationship

```
ncba_user (auth)
    │
    └── user_profiles (1:1)
            │
            ├── [role = admin] → Full access
            │
            ├── [role = team_member] → team_assignments → companies
            │                                                │
            │                                                └── contacts
            │                                                └── opportunities
            │                                                └── partnerships
            │
            └── [role = customer] → customer_access → partnerships
                                                          │
                                                          └── delivered_systems
                                                          └── activities (filtered)
```

---

## 5. Implementation Phases

### Phase 1: Foundation (Current)
**Status:** ✅ Complete

- [x] Create `user_profiles` table
- [x] Create `customer_access` table
- [x] Create `team_assignments` table
- [x] Document permission matrix
- [ ] Create admin's user_profile record (first login)

**Implementation:**
```typescript
// On first admin login, create profile
// lib/hooks/useUserProfile.ts

async function ensureUserProfile(userId: string, email: string) {
  // Check if profile exists
  const res = await fetch(`/api/data/read/user_profiles?user_id=${userId}`);
  const data = await res.json();

  if (!data.data || data.data.length === 0) {
    // Create profile - first user is admin
    await fetch('/api/data/create/user_profiles', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        role: 'admin',  // First user is admin
        display_name: email.split('@')[0],
      }),
    });
  }

  return data.data?.[0];
}
```

---

### Phase 2: Admin Enforcement
**Status:** 🔲 Next

**Tasks:**
- [ ] Create `usePermissions` hook
- [ ] Add role check middleware to API routes
- [ ] Create admin-only route guard
- [ ] Build user management UI (Settings → Users)
- [ ] Add "Invite Customer" flow

**Timeline:** When you have 3+ active partnerships

**Key Files to Create:**
```
lib/hooks/usePermissions.ts      # Permission checking hook
lib/utils/permissions.ts         # Permission logic
components/guards/AdminOnly.tsx  # Admin route guard
app/settings/users/page.tsx      # User management page
```

---

### Phase 3: Customer Portal
**Status:** 🔲 Future

**Tasks:**
- [ ] Create `/portal` route group
- [ ] Build customer dashboard
- [ ] Partnership progress view
- [ ] Systems status view
- [ ] Document access
- [ ] Meeting schedule
- [ ] Comment system (optional)

**Timeline:** When you have active customers wanting self-service

**Route Structure:**
```
app/
├── (admin)/              # Admin routes (current CRM)
│   ├── dashboard/
│   ├── leads/
│   └── ...
└── (portal)/             # Customer portal routes
    ├── layout.tsx        # Portal layout (different nav)
    ├── page.tsx          # Portal dashboard
    ├── partnership/
    │   └── [id]/page.tsx # Partnership detail
    └── documents/page.tsx
```

---

### Phase 4: Team Members
**Status:** 🔲 When hiring

**Tasks:**
- [ ] Team invitation flow
- [ ] Company assignment UI
- [ ] Filtered data queries
- [ ] Activity attribution
- [ ] Performance dashboards

**Timeline:** When you hire first employee

---

## 6. Code Patterns

### Pattern: Permission Hook

```typescript
// lib/hooks/usePermissions.ts
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface UserProfile {
  role: 'admin' | 'team_member' | 'customer';
  user_id: string;
}

interface Permissions {
  isAdmin: boolean;
  isTeamMember: boolean;
  isCustomer: boolean;
  canManageUsers: boolean;
  canViewAllData: boolean;
  canEditSettings: boolean;
  canGrantAccess: boolean;
}

export function usePermissions() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/data/read/user_profiles?user_id=${user.id}`, {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          setProfile(data.data?.[0] || null);
          setLoading(false);
        });
    }
  }, [user?.id]);

  const permissions: Permissions = {
    isAdmin: profile?.role === 'admin',
    isTeamMember: profile?.role === 'team_member',
    isCustomer: profile?.role === 'customer',
    canManageUsers: profile?.role === 'admin',
    canViewAllData: profile?.role === 'admin',
    canEditSettings: profile?.role === 'admin',
    canGrantAccess: profile?.role === 'admin',
  };

  return { profile, permissions, loading };
}
```

### Pattern: Admin Guard Component

```typescript
// components/guards/AdminOnly.tsx
'use client';

import { usePermissions } from '@/lib/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminOnly({ children, fallback }: AdminOnlyProps) {
  const { permissions, loading } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !permissions.isAdmin) {
      router.push('/unauthorized');
    }
  }, [loading, permissions.isAdmin, router]);

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!permissions.isAdmin) {
    return fallback || null;
  }

  return <>{children}</>;
}
```

### Pattern: Filtered Data Query

```typescript
// lib/hooks/useCompanies.ts
'use client';

import { usePermissions } from './usePermissions';
import { useAuth } from '@/contexts/AuthContext';

export function useCompanies() {
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    async function fetchCompanies() {
      let url = '/api/data/read/companies';

      // If team member, filter by assignment
      if (permissions.isTeamMember && user?.id) {
        // First get assigned company IDs
        const assignmentsRes = await fetch(
          `/api/data/read/team_assignments?user_id=${user.id}&is_active=true`,
          { credentials: 'include' }
        );
        const assignments = await assignmentsRes.json();
        const companyIds = assignments.data?.map((a: any) => a.company_id) || [];

        if (companyIds.length === 0) {
          setCompanies([]);
          return;
        }

        // Then fetch only those companies
        url += `?id__in=${companyIds.join(',')}`;
      }

      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      setCompanies(data.data || []);
    }

    if (permissions.isAdmin || permissions.isTeamMember) {
      fetchCompanies();
    }
  }, [permissions, user?.id]);

  return { companies };
}
```

### Pattern: Customer Portal Data

```typescript
// lib/hooks/useCustomerPartnerships.ts
'use client';

import { useAuth } from '@/contexts/AuthContext';

export function useCustomerPartnerships() {
  const { user } = useAuth();
  const [partnerships, setPartnerships] = useState([]);

  useEffect(() => {
    async function fetchPartnerships() {
      if (!user?.id) return;

      // Get customer's access grants
      const accessRes = await fetch(
        `/api/data/read/customer_access?user_id=${user.id}&is_active=true`,
        { credentials: 'include' }
      );
      const access = await accessRes.json();
      const partnershipIds = access.data?.map((a: any) => a.partnership_id) || [];

      if (partnershipIds.length === 0) {
        setPartnerships([]);
        return;
      }

      // Fetch those partnerships
      const res = await fetch(
        `/api/data/read/partnerships?id__in=${partnershipIds.join(',')}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      setPartnerships(data.data || []);
    }

    fetchPartnerships();
  }, [user?.id]);

  return { partnerships };
}
```

---

## 7. Customer Portal Access

### Granting Access Flow

```
Admin Action                          Result
─────────────────────────────────────────────────────────────
1. Navigate to Partnership detail
2. Click "Invite Customer"
3. Enter customer email
4. Select access level
   └─▶ customer_access record created
5. System sends invitation email
   └─▶ Customer clicks link
6. Customer creates account
   └─▶ user_profiles record created (role: customer)
7. Customer logs in
   └─▶ Sees only their partnership(s)
```

### Invitation Email Template

```
Subject: Your AI SMB Partners Portal Access

Hi [Customer Name],

You've been invited to access your partnership dashboard at AI SMB Partners.

Click below to create your account:
[Create Account Button] → https://app.kre8tion.com/portal/invite?token=xxx

What you'll be able to see:
• Your partnership progress and current phase
• Systems being built and their status
• Shared documents and resources
• Upcoming meetings and milestones

Questions? Reply to this email.

Best,
[Your Name]
AI SMB Partners
```

### Portal Dashboard Content

```
┌────────────────────────────────────────────────────────────┐
│  Welcome, [Customer Name]                                   │
│  [Company Name] Partnership                                 │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  PARTNERSHIP PROGRESS                                       │
│  ┌─────────┬─────────┬─────────┬─────────┐                │
│  │ Discover│Co-Create│ Deploy  │Independent│                │
│  │   ✓     │   ●     │         │          │                │
│  └─────────┴─────────┴─────────┴─────────┘                │
│  Phase: Co-Create (Week 4 of 12)                           │
│                                                             │
│  SYSTEMS                                                    │
│  ┌──────────────────────────────────────┐                  │
│  │ 1. Lead Qualification Bot    [LIVE]  │                  │
│  │ 2. Scheduling Assistant  [Building]  │                  │
│  │ 3. Invoice Automation    [Planned]   │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
│  UPCOMING                                                   │
│  • Weekly sync: Thursday 2pm                                │
│  • System 2 demo: Feb 15                                    │
│                                                             │
│  DOCUMENTS                                                  │
│  • Partnership Agreement                                    │
│  • System 1 Documentation                                   │
│  • Training Materials                                       │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 8. API Security

### Middleware Pattern

```typescript
// middleware.ts (Next.js middleware)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Admin-only routes
  const adminRoutes = ['/settings', '/users', '/api/admin'];

  // Customer portal routes
  const portalRoutes = ['/portal'];

  // Check route type and redirect if unauthorized
  // (Actual auth check happens in API routes)

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### API Route Protection

```typescript
// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionAndProfile } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, profile } = await getSessionAndProfile(req);

  if (!user || profile?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  // Proceed with admin operation
}
```

---

## 9. Testing Checklist

### Phase 2 Testing (Admin Enforcement)

- [ ] Admin can see all companies
- [ ] Admin can create/edit/delete any entity
- [ ] Admin can access settings
- [ ] Admin can view user management
- [ ] Non-admin redirected from admin routes
- [ ] API returns 403 for unauthorized requests

### Phase 3 Testing (Customer Portal)

- [ ] Customer can only see granted partnerships
- [ ] Customer cannot see other customers' data
- [ ] Customer cannot access admin routes
- [ ] Customer sees filtered activities (no internal notes)
- [ ] Access expiration works correctly
- [ ] Revoking access immediately blocks access

### Phase 4 Testing (Team Members)

- [ ] Team member sees only assigned companies
- [ ] Team member can edit assigned accounts
- [ ] Team member cannot delete
- [ ] Team member cannot see unassigned data
- [ ] Owner assignment allows full edit
- [ ] Viewer assignment is read-only

---

## 10. Future Enhancements

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| Audit logging | Track who accessed/changed what | Medium |
| Fine-grained permissions | Per-field access control | Low |
| API keys | For integrations (non-user access) | Medium |
| IP restrictions | Limit access by IP range | Low |
| 2FA enforcement | Require 2FA for admin role | Medium |
| Session management | View/revoke active sessions | Low |
| GDPR data export | Customer can export their data | Medium |
| Access request workflow | Customers can request access | Low |

---

## Quick Reference

### Grant Customer Access (SQL)

```sql
INSERT INTO customer_access (user_id, partnership_id, access_level, granted_by)
VALUES ('customer_user_id', 123, 'view', 'admin_user_id');
```

### Assign Team Member (SQL)

```sql
INSERT INTO team_assignments (user_id, company_id, role, assigned_by)
VALUES ('team_member_id', 456, 'collaborator', 'admin_user_id');
```

### Check User Role (SQL)

```sql
SELECT u.email, p.role
FROM ncba_user u
JOIN user_profiles p ON u.id = p.user_id
WHERE u.email = 'someone@example.com';
```

### Revoke Access (SQL)

```sql
UPDATE customer_access SET is_active = FALSE
WHERE user_id = 'customer_id' AND partnership_id = 123;
```

---

*Document Version: 1.0*
*Created: February 2026*
