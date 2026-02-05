# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI SMB CRM frontend — a Next.js 15 app deployed to Cloudflare Pages at `app.kre8tion.com`. Uses NoCodeBackend (NCB) as the database/auth backend (instance: `36905_ai_smb_crm`). The companion landing page lives at `kre8tion.com` in a separate repo.

## Commands

```bash
npm run dev              # Dev server on port 3001 (3000 is used by landing page)
npm run build            # Next.js production build
npm run lint             # ESLint
npm run pages:build      # Cloudflare Pages build (uses @cloudflare/next-on-pages)
```

Deploy to Cloudflare:
```bash
npm run pages:build && npx wrangler pages deploy .vercel/output/static --project-name=ai-smb-crm --commit-dirty=true --no-bundle
```

No test framework is configured.

## Architecture

### API Proxy Pattern

The app does NOT call NCB directly from the browser. All data flows through Next.js API route proxies:

- `app/api/auth/[...path]/route.ts` — proxies to NCB auth API. Handles cookie transformation for localhost dev (strips `__Secure-`/`__Host-` prefixes). Sign-out clears `better-auth.session_token` and `better-auth.session_data` cookies.
- `app/api/data/[...path]/route.ts` — proxies to NCB data API. Validates session before forwarding. Auto-injects `user_id` on create operations. Strips `user_id` from PUT bodies to prevent spoofing.
- Both run on edge runtime (`export const runtime = 'edge'`).

CRUD pattern from client code:
```
GET    /api/data/read/leads          — list
GET    /api/data/read/leads/123      — single
POST   /api/data/create/leads        — create (user_id auto-injected)
PUT    /api/data/update/leads/123    — update
DELETE /api/data/delete/leads/123    — delete
```

All client fetches must include `credentials: 'include'` for cookie auth.

### Authentication

Cookie-based via NCB's better-auth. `AuthContext` (`contexts/AuthContext.tsx`) provides `useAuth()` with `user`, `loading`, `signIn`, `signUp`, `signOut`, `refreshSession`. The `DashboardLayout` component wraps all protected pages and redirects to `/login` if unauthenticated.

### Permissions / Roles

Three roles: `admin`, `team_member`, `customer`. The `usePermissions()` hook (`lib/hooks/usePermissions.ts`) fetches from the `user_profiles` table. Auto-creates a profile on first login — `connect@elev8tion.one` gets admin; others get customer. `AdminOnly` guard component in `components/guards/AdminOnly.tsx`.

### Internationalization

English and Spanish. `LanguageContext` provides `useTranslations()` returning `{ t, language, setLanguage }`. Translations live in `lib/i18n/translations.ts`. Language preference stored in localStorage as `preferred-language`.

### Provider Hierarchy

`app/layout.tsx` wraps: `AuthProvider` → `LanguageProvider` → children. Uses Inter font via `next/font/google`.

## Key Conventions

- **All page components are client components** (`'use client'`) that wrap content in `<DashboardLayout>`.
- **Auth pages** use the `(auth)` route group (no URL segment) — `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`.
- **Design system is CSS-based**, defined in `app/globals.css` with CSS custom properties. Key classes: `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.input-glass`, `.select-glass`, `.card`, `.card-interactive`, `.glass`, `.liquid-glass`, `.tag`, `.tag-success`, `.tag-warning`, `.tag-error`, `.table-glass`, `.sidebar-item`, `.stat-card`, `.stage-{new,contacted,discovery,proposal,negotiation,won,lost}`.
- **Dark theme by default** — black background (#000000), white text, glassmorphic UI with blur/transparency effects.
- **Tailwind config** extends colors via `styles/colors.ts` (use `primary.electricBlue`, `primary.cyan`, `functional.success`, etc.) and spacing via `styles/spacing.ts`. Custom breakpoints: `tablet`, `desktop`, `wide`.
- **Path alias**: `@/*` maps to project root.
- **Sidebar navigation** defined in `components/layout/Sidebar.tsx` — the `navItems` array. Adding a page requires: create `app/[name]/page.tsx`, add to `navItems` with icon, add translation keys to both `en` and `es` in `lib/i18n/translations.ts`.

## Environment Variables

```
NCB_INSTANCE=36905_ai_smb_crm
NCB_AUTH_API_URL=https://app.nocodebackend.com/api/user-auth
NCB_DATA_API_URL=https://app.nocodebackend.com/api/data
```

## NCB Database Tables

`companies`, `contacts`, `leads`, `opportunities`, `partnerships`, `voice_sessions`, `roi_calculations`, `proposed_systems`, `delivered_systems`, `payments`, `activities`, `user_profiles`, `customer_access`, `team_assignments`

## Existing Documentation

- `DEVELOPMENT.md` — extension points, patterns, and templates for adding pages/components/tables/hooks
- `DEPLOYMENT.md` — Cloudflare Pages setup, domain config, webhook endpoints
- `ROLES_AND_PERMISSIONS.md` — RBAC design, implementation phases, permission matrix
