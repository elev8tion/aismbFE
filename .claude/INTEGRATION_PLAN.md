# Integration Plan: Landing Page ↔ CRM

> Phased plan to close all data gaps between `ai-smb-partners` (kre8tion.com) and `ai_smb_crm_frontend` (app.kre8tion.com).
> Both repos should have an identical copy of this file.
> Reference: `INTEGRATION_MAP.md` for the full system diagram and binding point matrix.

---

## Phase 1: Fix Broken Bindings (Data Exists But Isn't Connected)

**Goal**: Every piece of data the landing page already collects should appear in the CRM.

### 1.1 Sync Voice Sessions from KV to NCB
**Gap**: G1 — Voice transcripts live in Cloudflare KV (`VOICE_SESSIONS`) but never reach the `voice_sessions` NCB table. CRM's /voice-sessions page has no real data.

**Landing Page Changes** (`ai-smb-partners`):
- File: `app/api/voice-agent/chat/route.ts`
- After saving to KV, also write to NCB `voice_sessions` table via OpenAPI
- Map KV conversation data → NCB schema:
  ```
  external_session_id → sessionId
  messages → JSON.stringify(conversationHistory)
  language → language
  total_questions → count of user messages
  sentiment → derive from last few messages (or 'neutral' default)
  start_time → first message timestamp (or track in session)
  ```
- Trigger: On every assistant response (upsert by `external_session_id`)
- OR: Create a new endpoint `POST /api/voice-agent/sync-session` called at conversation end

**CRM Changes** (`ai_smb_crm_frontend`): None — page already reads from `voice_sessions`.

**Estimated effort**: Medium (new sync logic + session end detection)

---

### 1.2 Enhance Voice Agent Lead Extraction
**Gap**: G2 — Voice agent only extracts email, industry, employee count. Misses name, phone, company.

**Landing Page Changes**:
- File: `lib/voiceAgent/leadManager.ts` → `extractLeadInfo()`
- Add regex/keyword patterns for:
  - **Name**: "my name is {X}", "I'm {X}", "this is {X}"
  - **Phone**: Phone number patterns (10-digit, with/without dashes)
  - **Company name**: "I own {X}", "my company is {X}", "we're {X}", "{X} LLC/Inc/Co"
- These are spoken naturally during booking conversations — currently lost

**CRM Changes**: None — /leads page already displays these fields.

**Estimated effort**: Small (regex patterns in one function)

---

### 1.3 Write Lead Score as Numeric Field
**Gap**: G8 — Lead score is calculated but only stored in `notes` as text. The `lead_score` column exists but isn't populated.

**Landing Page Changes**:
- File: `lib/voiceAgent/leadManager.ts` → `syncLeadToCRM()`
- Add `lead_score: number` parameter to sync function
- File: `app/api/voice-agent/chat/route.ts`
- Pass `leadScore.score` to `syncLeadToCRM()` call

**CRM Changes**: None — /leads page already shows `lead_score` as a progress bar.

**Estimated effort**: Small (add one field to existing sync)

---

### 1.4 Add Foreign Key Links (Lead ↔ ROI, Lead ↔ Booking)
**Gaps**: G9, G10 — Leads created from bookings/ROI don't link back. CRM has `roi_calculation_id` and `voice_session_id` badges on leads but they're never populated.

**Landing Page Changes**:
- File: `lib/voiceAgent/leadManager.ts` → `syncROICalcToCRM()`
  - After creating `roi_calculations` record, update the `leads` record with `roi_calculation_id`
- File: `app/api/booking/create/route.ts`
  - After creating booking, update the `leads` record with the booking ID (needs new column or use `notes`)
- File: `lib/voiceAgent/leadManager.ts` → `syncLeadToCRM()`
  - Accept optional `voice_session_id` param, write to leads table

**CRM Changes**: None — /leads page already renders these as clickable badges.

**NCB Schema Change**: May need to add `booking_id` column to `leads` table.

**Estimated effort**: Medium (multiple sync functions + possible schema change)

---

### 1.5 Send ROI Calculator Engagement Metrics
**Gap**: G7 — CRM schema has `time_on_calculator`, `adjustments_count`, `report_sent_at` but landing page doesn't send them.

**Landing Page Changes**:
- File: `components/ROICalculator/EmailCapture.tsx` or parent component
  - Track time spent on calculator (start timer on mount)
  - Count slider/input adjustments
  - Send both in the `POST /api/leads/roi` payload
- File: `app/api/leads/roi/route.ts`
  - Pass `time_on_calculator`, `adjustments_count` to `syncROICalcToCRM()`
  - Set `report_sent_at` after successful email send

**CRM Changes**: None — /roi-calculations page already displays these fields.

**Estimated effort**: Small-Medium (frontend timer + counter + API field additions)

---

## Phase 2: Email Engagement Tracking

**Goal**: When a user opens, clicks, or bounces an email, that information appears in the CRM.

### 2.1 Sync EmailIt Webhook Events to NCB
**Gaps**: G3, G4, G5, G6 — Email events are logged to console and discarded.

**Landing Page Changes**:
- File: `app/api/webhooks/emailit/route.ts`
- On `email.opened`:
  - Look up lead by recipient email in `leads` table
  - Update: `last_email_opened_at = now()`
  - Create `activities` record: `{ type: 'email', subject: 'Email opened: {subject}', lead_id }`
- On `email.clicked`:
  - Update lead: `email_click_count += 1`
  - Create `activities` record: `{ type: 'email', subject: 'Email link clicked', lead_id }`
- On `email.bounced`:
  - Update lead: `email_status = 'bounced'`
  - Create `activities` record: `{ type: 'email', subject: 'Email bounced', lead_id }`
- On `email.inbound` (reply):
  - Create `activities` record: `{ type: 'email', subject: 'Reply received from {email}', description: snippet }`

**NCB Schema Changes**:
- Add to `leads` table: `last_email_opened_at` (datetime, nullable), `email_click_count` (integer, default 0), `email_status` (string, nullable)

**CRM Changes** (`ai_smb_crm_frontend`):
- File: Leads page — show email engagement indicators (opened icon, click count)
- File: Dashboard — show email activity in activity feed (already reads from `activities`)

**Estimated effort**: Medium (webhook handler rewrite + schema changes + CRM UI)

---

### 2.2 Log Activity Records When Emails Are Sent
**Gap**: G11 — No record in `activities` when confirmation/dossier/ROI emails are sent.

**Landing Page Changes**:
- File: `lib/email/sendEmail.ts`
- After each successful `sendViaEmailIt()`, create an `activities` record:
  ```
  { type: 'email', subject: 'ROI report sent to {email}', description: '{tier} tier, {roi}% ROI' }
  { type: 'email', subject: 'Booking confirmation sent to {email}', description: '{date} at {time}' }
  { type: 'email', subject: 'Lead dossier sent to admin', description: 'Re: {guest_name}' }
  ```
- Requires passing NCB env to `sendEmail` functions (they currently only get EmailIt key)

**CRM Changes**: None — Dashboard activity feed already reads from `activities`.

**Estimated effort**: Medium (needs env plumbing through email functions)

---

## Phase 3: CRM Display Improvements

**Goal**: Give the admin a complete picture on every lead/entity without leaving the page.

### 3.1 Lead Detail Page with Activity Timeline
**What**: Create `/leads/[id]` page showing full lead history.

**CRM Changes** (`ai_smb_crm_frontend`):
- New file: `app/leads/[id]/page.tsx`
- Sections:
  - **Header**: Name, email, company, score bar, status badge, source
  - **Activity Timeline**: All `activities` where `lead_id = {id}`, sorted by date
  - **Linked Records**: ROI calculation card (if `roi_calculation_id`), booking card (if linked), voice session card (if `voice_session_id`)
  - **Email History**: Emails sent, opened, clicked (from activities + lead fields)
  - **Edit/Actions**: Change status, add note, convert to opportunity

**Landing Page Changes**: None (data already exists).

**Estimated effort**: Medium-Large (new page + data fetching + UI)

---

### 3.2 Booking Calendar View
**What**: Add calendar grid view as an alternative to the bookings table.

**CRM Changes**:
- File: `app/bookings/page.tsx` — add toggle between table and calendar views
- New component: `components/bookings/CalendarView.tsx`
- Show bookings as colored blocks on a week/month grid
- Color by status: green (confirmed), yellow (pending), red (cancelled)

**Landing Page Changes**: None.

**Estimated effort**: Medium (calendar UI component)

---

### 3.3 Dashboard Enhancements
**What**: Add missing standard dashboard features.

**CRM Changes**:
- **Date range selector**: Filter all stats by week/month/quarter/custom
- **Leads over time chart**: Line chart showing new leads per day/week
- **Conversion funnel**: Lead → Contacted → Qualified → Opportunity → Closed Won
- **Email engagement summary**: Open rate, click rate, bounce rate (from `activities`)
- **ROI calculator stats**: Total calculations, avg ROI, email capture rate

**Landing Page Changes**: None.

**Estimated effort**: Large (multiple chart components + date filtering)

---

### 3.4 Delete Operations
**What**: Add delete buttons across all entity pages.

**CRM Changes**:
- Add delete button (with confirmation modal) to: Leads, Companies, Contacts, Opportunities
- Use `DELETE /api/data/delete/{table}/{id}`
- Soft delete preferred (add `deleted_at` column) vs hard delete

**Landing Page Changes**: None.

**Estimated effort**: Small (reusable delete modal + API calls)

---

## Phase 4: Advanced Features

### 4.1 Task Management Page
- New route: `/tasks`
- Read from `activities` where `type = 'task'`
- CRUD: Create tasks, assign due dates, mark complete
- Link tasks to leads/companies/partnerships

### 4.2 CSV Export
- Add export button to Leads, Bookings, ROI Calculations pages
- Generate CSV client-side from loaded data

### 4.3 Notes on All Entities
- Add collapsible notes section to lead/company/partnership modals
- Read/write to `notes` field (or separate `entity_notes` table)

### 4.4 User Management
- New route: `/settings/users`
- List users from `ncba_user` table
- Role assignment UI (admin/manager/viewer)

---

## Priority Order

```
Phase 1 (Fix Broken Bindings)           ← DO FIRST
  1.2 Voice agent lead extraction           (Small)
  1.3 Write lead score as number            (Small)
  1.5 ROI engagement metrics                (Small-Medium)
  1.4 Foreign key links                     (Medium)
  1.1 Voice session KV → NCB sync          (Medium)

Phase 2 (Email Tracking)                ← DO SECOND
  2.2 Log activity on email send            (Medium)
  2.1 Sync EmailIt webhook events           (Medium)

Phase 3 (CRM Display)                   ← DO THIRD
  3.4 Delete operations                     (Small)
  3.1 Lead detail page                      (Medium-Large)
  3.3 Dashboard enhancements                (Large)
  3.2 Booking calendar view                 (Medium)

Phase 4 (Advanced)                       ← DO LATER
  4.2 CSV export                            (Small)
  4.3 Notes on entities                     (Small)
  4.1 Task management page                  (Medium)
  4.4 User management                       (Medium)
```

---

## Cross-Repo Checklist

When implementing any binding point, both repos must stay in sync:

- [ ] Landing page writes the data to the correct NCB table with correct field names
- [ ] CRM reads from the same table and displays the fields
- [ ] Field types match (string | null, not undefined; numbers not strings)
- [ ] `created_at` is NOT sent (NCB default handles it)
- [ ] OpenAPI uses `Instance=36905_ai_smb_crm` (capital I)
- [ ] Data Proxy uses `instance=36905_ai_smb_crm` (lowercase i)
- [ ] Both repos reference this document for the canonical field mappings
- [ ] Update `INTEGRATION_MAP.md` when adding new binding points
