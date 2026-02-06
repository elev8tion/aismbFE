# AI KRE8TION Partners CRM — Development TODO

> Review this document and tell me which items to build, in what order, and any preferences on how they should work.

---

## Dashboard (`/dashboard`)

UI is built with stat cards, activity feed, tasks, and pipeline overview — all hardcoded.

- [ ] Connect stat cards to real API data (lead count, pipeline value, active partners, MRR)
- [ ] Pull recent activity from `activities` table
- [ ] Pull tasks from a tasks table (or decide where tasks live)
- [ ] Pull pipeline stage counts from `opportunities` table
- [ ] Add refresh/auto-update

---

## Leads (`/leads`)

Table UI with filters and search — all mock data.

- [ ] Fetch leads from `/api/data/read/leads`
- [ ] Working search (by name, email, company)
- [ ] Working filter buttons (all, new, contacted, qualified, converted)
- [ ] "New Lead" button → create modal/form
- [ ] Edit lead functionality
- [ ] Delete lead with confirmation
- [ ] Lead detail page (`/leads/[id]`)
- [ ] Lead score calculation logic

---

## Pipeline (`/pipeline`)

Kanban board with 6 columns — all mock deals.

- [ ] Fetch opportunities from `/api/data/read/opportunities`
- [ ] Drag-and-drop to change deal stage
- [ ] "Add deal" modal per column
- [ ] Edit deal modal (click on card)
- [ ] Deal value rollup per column
- [ ] Deal detail page (`/pipeline/[id]`)

---

## Companies (`/companies`)

Card grid with 4 mock companies.

- [ ] Fetch companies from `/api/data/read/companies`
- [ ] "Add Company" modal/form
- [ ] Company detail page (`/companies/[id]`) showing contacts, opportunities, activity
- [ ] Edit company
- [ ] Delete company with confirmation
- [ ] AI maturity score input/display

---

## Contacts (`/contacts`)

Table with 5 mock contacts.

- [ ] Fetch contacts from `/api/data/read/contacts`
- [ ] "Add Contact" modal/form
- [ ] Edit contact
- [ ] Delete contact with confirmation
- [ ] Link contacts to companies
- [ ] Contact detail page (`/contacts/[id]`)
- [ ] Click-to-email / click-to-call actions

---

## Partnerships (`/partnerships`)

Card list with 3 mock partnerships.

- [ ] Fetch partnerships from `/api/data/read/partnerships`
- [ ] Partnership detail page (`/partnerships/[id]`) with:
  - Delivered systems list
  - Payment history
  - Phase progress tracking
  - Health score updates
- [ ] "Update Progress" functionality
- [ ] "Schedule Meeting" action (calendar link or integration)

---

## Settings (`/settings`)

Form UI exists but save doesn't work.

- [ ] Save profile name to `user_profiles` table
- [ ] Save notification preferences
- [ ] Language preference already works (localStorage)
- [ ] Password change functionality
- [ ] User management section (admin only) — list users, change roles

---

## Voice Sessions (`/voice-sessions`) — PAGE MISSING

No page exists. Route is in the sidebar.

- [ ] Create the page
- [ ] List voice sessions from `/api/data/read/voice_sessions`
- [ ] Show session details (transcript, sentiment, duration)
- [ ] Link sessions to leads/contacts
- [ ] Playback or transcript view

---

## ROI Calculations (`/roi-calculations`) — PAGE MISSING

No page exists. Route is in the sidebar.

- [ ] Create the page
- [ ] List ROI calculations from `/api/data/read/roi_calculations`
- [ ] Show calculation details (industry, inputs, results)
- [ ] Link to associated lead/company
- [ ] Re-run or edit calculations

---

## Other Features to Consider

- [ ] Activity logging — auto-log when records are created/updated
- [ ] Notifications/toasts for success/error feedback
- [ ] Bulk actions (select multiple leads, delete, export)
- [ ] CSV export for leads, companies, contacts
- [ ] Webhook endpoints for landing page integration (voice agent, ROI calc, calendar)
- [ ] Email templates
- [ ] Customer portal (`/portal`) for clients to see their partnership status

---

## Your Instructions

Tell me:
1. Which pages/features to build first
2. Any specific behavior or design preferences
3. What data should the dashboard show from real tables
4. Whether voice sessions and ROI calculations pages are needed now or later
