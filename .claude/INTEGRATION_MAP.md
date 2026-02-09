# Integration Map: Landing Page ↔ CRM

> Shared reference document between `ai-smb-partners` (kre8tion.com) and `ai_smb_crm_frontend` (app.kre8tion.com).
> Both repos should have an identical copy of this file.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        VISITOR EXPERIENCE (kre8tion.com)                        │
│                                                                                 │
│  ┌──────────────┐   ┌──────────────────┐   ┌──────────────┐   ┌────────────┐  │
│  │  Voice Agent  │   │  ROI Calculator  │   │ Booking Modal│   │ Assessment │  │
│  │  (FAB chat)   │   │  (5-step wizard) │   │ (strategy)   │   │ (paid $250)│  │
│  └──────┬───────┘   └────────┬─────────┘   └──────┬───────┘   └─────┬──────┘  │
│         │                    │                     │                  │         │
│         │ extractLeadInfo()  │ EmailCapture.tsx     │ BookingForm.tsx  │ Stripe  │
│         │ + lead scoring     │ POST /api/leads/roi  │ POST /api/       │ checkout│
│         │                    │                      │ booking/create   │ + POST  │
└─────────┼────────────────────┼──────────────────────┼──────────────────┼─────────┘
          │                    │                      │                  │
          ▼                    ▼                      ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          API ROUTES (Edge Runtime)                              │
│                                                                                 │
│  POST /api/voice-agent/chat    POST /api/leads/roi    POST /api/booking/create  │
│  ┌─────────────────────┐      ┌─────────────────┐    ┌──────────────────────┐  │
│  │ classifyIntent()    │      │ syncROICalcToCRM │    │ createInNCB(bookings)│  │
│  │ runBookingAgent()   │      │ sendROIReport()  │    │ syncBookingToCRM()   │  │
│  │ runInfoAgent()      │      │ sendROIDossier() │    │ sendConfirmation()   │  │
│  │ runROIAgent()       │      │   (1s delay)     │    │ sendLeadDossier()    │  │
│  │ syncLeadToCRM()     │      └────────┬────────┘    │   (1s delay)         │  │
│  └─────────┬───────────┘               │             └──────────┬───────────┘  │
│            │                           │                        │              │
└────────────┼───────────────────────────┼────────────────────────┼──────────────┘
             │                           │                        │
             ▼                           ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     NCB OpenAPI (openapi.nocodebackend.com)                     │
│                     Instance: 36905_ai_smb_crm                                  │
│                     Auth: Bearer ${NCB_SECRET_KEY}                               │
│                                                                                 │
│  ┌──────────┐  ┌─────────────────┐  ┌──────────┐  ┌───────────────────────┐   │
│  │  leads   │  │roi_calculations │  │ bookings │  │ availability_settings │   │
│  │          │  │                 │  │          │  │ blocked_dates         │   │
│  │ email    │  │ email           │  │ guest_*  │  └───────────────────────┘   │
│  │ name     │  │ industry        │  │ date     │                              │
│  │ company  │  │ employee_count  │  │ time     │  ┌───────────────────────┐   │
│  │ industry │  │ hourly_rate     │  │ type     │  │   voice_sessions      │   │
│  │ source   │  │ selected_tier   │  │ status   │  │   (KV → NCB sync)     │   │
│  │ score    │  │ calculations{}  │  │ stripe_* │  │   NOT YET CONNECTED   │   │
│  │ status   │  │ email_captured  │  │ payment_*│  └───────────────────────┘   │
│  └────┬─────┘  └───────┬─────────┘  └────┬─────┘                              │
│       │                │                  │                                     │
└───────┼────────────────┼──────────────────┼─────────────────────────────────────┘
        │                │                  │
        ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     NCB Data Proxy (app.nocodebackend.com/api/data)             │
│                     Auth: Session cookies (RLS enforced)                         │
│                                                                                 │
│  GET /read/{table}   POST /create/{table}   PUT /update/{table}/{id}           │
│                                                                                 │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       ADMIN EXPERIENCE (app.kre8tion.com)                       │
│                                                                                 │
│  ┌────────────┐  ┌────────┐  ┌──────────┐  ┌───────────────┐  ┌────────────┐ │
│  │ Dashboard  │  │ Leads  │  │ Bookings │  │ROI Calculations│  │  Pipeline  │ │
│  │            │  │        │  │          │  │               │  │  (Kanban)  │ │
│  │ stats      │  │ table  │  │ table    │  │ table         │  │            │ │
│  │ activity   │  │ CRUD   │  │ status   │  │ benchmarks    │  │ drag/drop  │ │
│  │ funnel     │  │ score  │  │ manage   │  │ payback chart │  │ Stripe     │ │
│  │ tasks      │  │ filter │  │ expand   │  │ proposal PDF  │  │ checkout   │ │
│  └────────────┘  └────────┘  └──────────┘  └───────────────┘  └────────────┘ │
│                                                                                 │
│  ┌────────────┐  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐    │
│  │ Companies  │  │ Contacts │  │ Partnerships  │  │   Voice Sessions      │    │
│  │            │  │          │  │               │  │                       │    │
│  │ AI maturity│  │ linked   │  │ billing       │  │ transcripts           │    │
│  │ card grid  │  │ to co.   │  │ contracts     │  │ sentiment             │    │
│  │            │  │          │  │ Stripe inv.   │  │ AI insights           │    │
│  └────────────┘  └──────────┘  └──────────────┘  └───────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

                              EXTERNAL SERVICES

┌──────────────────┐  ┌───────────────────┐  ┌──────────────────────────────────┐
│  EmailIt API     │  │  Stripe API       │  │  Cloudflare KV                   │
│                  │  │                   │  │                                  │
│  ROI report      │  │  Assessment       │  │  VOICE_SESSIONS namespace        │
│  Admin dossier   │  │  checkout         │  │  Conversation history            │
│  Booking confirm │  │  Setup invoices   │  │  (ephemeral — not synced to NCB) │
│  Assessment conf │  │  Subscriptions    │  │                                  │
│                  │  │  Webhooks         │  │                                  │
│  ⚠ Webhooks NOT  │  │  ✅ Webhooks      │  │                                  │
│    synced to CRM │  │    synced to CRM  │  │                                  │
└──────────────────┘  └───────────────────┘  └──────────────────────────────────┘
```

---

## Binding Point Matrix

Every point where the landing page writes data and the CRM reads it (or should read it).

### Currently Connected

| # | Trigger (Landing Page) | NCB Table | CRM Page | Status |
|---|---|---|---|---|
| B1 | Voice agent detects email → `syncLeadToCRM()` | `leads` | /leads | **Connected** |
| B2 | ROI calculator submit → `syncROICalcToCRM()` | `leads` | /leads | **Connected** |
| B3 | ROI calculator submit → `syncROICalcToCRM()` | `roi_calculations` | /roi-calculations | **Connected** |
| B4 | Booking form submit → `createInNCB('bookings')` | `bookings` | /bookings | **Connected** |
| B5 | Booking form submit → `syncBookingToCRM()` | `leads` | /leads | **Connected** |
| B6 | Assessment Stripe success → booking create | `bookings` | /bookings | **Connected** |
| B7 | Stripe invoice.paid webhook → create subscription | `payments`, `subscriptions` | /partnerships | **Connected** |
| B8 | Landing page reads availability | `availability_settings`, `blocked_dates` | /bookings/availability | **Connected** (read-only) |

### NOT Connected (Gaps)

| # | Trigger (Landing Page) | Should Write To | CRM Page | Issue |
|---|---|---|---|---|
| G1 | Voice agent conversations (full transcript) | `voice_sessions` | /voice-sessions | **KV only — never synced to NCB** |
| G2 | Voice agent extracts name/phone/company | `leads` | /leads | **Fields not extracted** — only email, industry, employee count captured |
| G3 | EmailIt webhook: email opened | `leads` or `activities` | /leads (timeline) | **Logged to console, discarded** |
| G4 | EmailIt webhook: email clicked | `leads` or `activities` | /leads (timeline) | **Logged to console, discarded** |
| G5 | EmailIt webhook: email bounced | `leads` | /leads | **Logged to console, discarded** |
| G6 | EmailIt webhook: inbound reply | `activities` | /dashboard | **Forwarded to admin, not stored** |
| G7 | ROI calculator interaction metrics | `roi_calculations` | /roi-calculations | **Partial** — `time_on_calculator`, `adjustments_count` exist in CRM schema but landing page doesn't send them |
| G8 | Voice agent lead score + factors | `leads` | /leads | **Score calculated but not written** — only added to `notes` as text |
| G9 | Booking → lead linkage | `leads.booking_id` | /leads | **No FK** — leads created from bookings don't link back |
| G10 | ROI → lead linkage | `leads.roi_calculation_id` | /leads | **No FK** — leads created from ROI don't link back |
| G11 | Activity logging for emails sent | `activities` | /dashboard | **No activity records created** when emails are sent |

### CRM → Landing Page (Reverse Bindings)

| # | CRM Action | Affects Landing Page | Status |
|---|---|---|---|
| R1 | Update `availability_settings` | Booking modal shows updated slots | **Connected** |
| R2 | Add `blocked_dates` | Booking modal blocks those dates | **Connected** |
| R3 | Change booking status to `cancelled` | Slot freed for new bookings | **Connected** |
| R4 | Update lead status | No effect on landing page | N/A (one-way) |

---

## Email Flow Diagram

```
LANDING PAGE EVENTS                    EMAILIT API                 INBOXES

ROI Calculator submit ──┐              ┌──────────┐               ┌──────────────┐
                        ├─► ROI Report─┤          ├──────────────►│ User inbox   │
                        │   (1s delay) │          │               └──────────────┘
                        └─► ROI Dossier┤ EmailIt  ├──────────────►│ Admin inbox  │
                                       │          │               └──────────────┘
Booking (strategy) ─────┐              │          │
                        ├─► Confirm  ──┤          ├──────────────►│ User inbox   │
                        │   (1s delay) │          │               └──────────────┘
                        └─► Dossier  ──┤          ├──────────────►│ Admin inbox  │
                                       │          │               └──────────────┘
Booking (assessment) ───┐              │          │
                        ├─► Confirm  ──┤          ├──────────────►│ User inbox   │
                        │   (1s delay) │          │               └──────────────┘
                        └─► Dossier  ──┤          ├──────────────►│ Admin inbox  │
                                       └────┬─────┘               └──────────────┘
                                            │
                                     WEBHOOKS (events)
                                            │
                                            ▼
                              POST /api/webhooks/emailit
                              ┌─────────────────────────┐
                              │ email.opened  → ⚠ LOG   │
                              │ email.clicked → ⚠ LOG   │
                              │ email.bounced → ⚠ LOG   │
                              │ email.inbound → forward  │
                              │                          │
                              │ ❌ NONE synced to CRM    │
                              └─────────────────────────┘
```

---

## NCB Table Relationships

```
                    ┌─────────────────┐
                    │   companies     │
                    │                 │
                    │ name            │
                    │ industry        │
                    │ ai_maturity     │
                    └───┬──────┬──────┘
                        │      │
              ┌─────────┘      └──────────┐
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │    contacts     │         │  opportunities  │
    │                 │         │                 │
    │ company_id (FK) │         │ company_id (FK) │
    │ name, email     │         │ tier, stage     │
    │ decision_maker  │         │ setup_fee       │
    └─────────────────┘         │ monthly_fee     │
                                └────────┬────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │    partnerships     │
                              │                     │
                              │ company_id (FK)     │
                              │ opportunity_id (FK) │
                              │ tier, phase, status │
                              │ stripe_customer_id  │
                              │ payment_status      │
                              └────────┬────────────┘
                                       │
                              ┌────────┘
                              ▼
                    ┌─────────────────┐
                    │delivered_systems│
                    │                 │
                    │partnership_id FK│
                    │ name, status    │
                    └─────────────────┘


  LANDING PAGE TABLES (written by kre8tion.com, read by app.kre8tion.com)

    ┌──────────┐      ┌──────────────────┐      ┌──────────────┐
    │  leads   │╌╌╌╌╌►│ roi_calculations │      │   bookings   │
    │          │ no FK │                  │      │              │
    │ email ●──┼──────►│ email            │      │ guest_email  │
    │ source   │      │ calculations{}   │      │ booking_type │
    │ score    │      │ selected_tier    │      │ status       │
    │ status   │      └──────────────────┘      │ stripe_*     │
    └──────────┘                                └──────────────┘
         ╎ no FK                                      ╎ no FK
         ╎                                            ╎
    ┌────╎────────────────────────────────────────────╎───────┐
    │    ▼           voice_sessions                   ▼       │
    │    ⚠ NOT SYNCED FROM KV                  ⚠ NO LINK     │
    │    Transcripts live in Cloudflare KV     BACK TO LEAD   │
    │    only — CRM has mock data or empty                    │
    └─────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

See `INTEGRATION_PLAN.md` in same directory for the phased implementation plan.
