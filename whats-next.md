<original_task>
Enhance the voice agent functionality in the AI KRE8TION Partners CRM (Next.js 15 app on Cloudflare Pages). The voice agent system was recently committed and deployed — it supports speech-to-text (Whisper), AI chat with 50+ CRM tool functions, text-to-speech (OpenAI TTS), navigation, and UI actions. The user wants to continue improving and extending voice agent capabilities.
</original_task>

<work_completed>
### Infrastructure & Core System (Fully Working)
- **3 API routes** on edge runtime: `/api/agent/chat`, `/api/agent/transcribe`, `/api/agent/speak`
- **Model router** (`lib/agent/modelRouter.ts`): 3-tier routing — fast (gpt-4.1-nano), standard (gpt-4.1-mini), reasoning (o4-mini)
- **Session management** (`lib/agent/session.ts`): In-memory store, 30-min TTL, 20-turn history
- **NCB client** (`lib/agent/ncbClient.ts`): Server-side CRUD wrapper with auth cookie forwarding, user_id injection/stripping
- **Security** (`lib/security/`): Input validation (2000 char limit), prompt injection detection (5 patterns), rate limiter (30/min, 300/hr)

### 50+ Agent Tools (All Functional)
- **Leads (7):** list, search, count, create, update_status, score, summary
- **Bookings (9):** today's, upcoming, list, confirm, cancel, block/unblock date, availability, summary
- **Pipeline (4):** list, summary, create, move_deal
- **Contacts (6):** search, get, create contact/company, company_contacts
- **Partnerships (4):** list, summary, update_phase, update_health
- **Analytics (7):** dashboard stats, daily summary, activities, voice insights, ROI insights, tasks
- **Navigation (1):** 12 targets with EN/ES synonyms
- **UI Actions (5):** set_filter, search, open_new, open_edit, open_view

### Client-Side Integration
- **VoiceOperator FAB** (`components/VoiceOperator/index.tsx`): Full state machine (idle→listening→processing→speaking), waveform animation, auto-close countdown, iOS audio unlock
- **VoiceAgentActionsContext** (`contexts/VoiceAgentActionsContext.tsx`): Pub/sub event bus for client actions with SSR-safe noop fallback
- **Page handlers** on all CRM pages: leads, contacts, companies, pipeline, bookings, partnerships, voice-sessions, roi-calculations

### System Prompt & Few-Shot Examples
- 49-line system prompt with navigation rules, bilingual support, response formatting
- ~25 few-shot examples covering navigation (EN/ES), filtering, search, new record, edit/view

### Testing (Completed & Cleaned Up)
- 184 tests across 16 files verified all implementations — tests committed to git history then removed per user request
</work_completed>

<work_remaining>
The initial task (commit, test, deploy the voice agent) is complete. Below are the known gaps and enhancement opportunities for the next session focused on "enhancing further voice agent functionality":

### High Priority — Session & State Persistence
- **Session store is in-memory only** — loses conversation history on edge worker restart/redeploy
  - File: `lib/agent/session.ts` (lines 14, 16-37)
  - Solution: Migrate to Cloudflare KV for distributed persistence
- **Voice sessions not saved to database** — the `voice_sessions` NCB table exists but agent doesn't write transcripts/responses to it
  - Would need a new tool or post-response hook in `app/api/agent/chat/route.ts` (around line 369)

### High Priority — Language & Voice
- **Agent always responds in English** regardless of detected input language
  - System prompt (`app/api/agent/chat/route.ts` line 13-50) doesn't instruct language matching
  - TTS voice is hardcoded to "echo" (`app/api/agent/speak/route.ts`)
  - Fix: Detect language from transcription, pass to chat, instruct agent to respond in same language, potentially use different TTS voice

### Medium Priority — Performance & UX
- **No streaming responses** — user waits for full chat completion + TTS before hearing anything
  - Could stream text response first, then TTS
- **No progress indicators** during multi-step tool executions (max 5 rounds)
- **Search is client-side** — agent tools read entire tables then filter in JS
  - Files: `lib/agent/tools/leads.ts`, `bookings.ts`, `contacts.ts`, etc.
  - All use `ncbRead(table, cookies)` then `.filter()` in-memory
  - Could pass query params to NCB for server-side filtering

### Medium Priority — Rate Limiter
- **Not distributed** — only works per-edge-location, not globally
  - File: `lib/security/rateLimiter.ts` (in-memory Map)
  - Solution: Cloudflare KV or D1

### Lower Priority — Agent Intelligence
- **Prompt injection only logged, not blocked** — `app/api/agent/chat/route.ts` line 280-282
- **No error recovery few-shots** — only happy path examples in NAV_FEWSHOTS
- **No audit trail** for voice-initiated data changes (creates, updates, deletes)
- **No confirmation flow** for destructive actions (delete, cancel) — agent executes immediately
</work_remaining>

<context>
### Project Setup
- **Repo:** `/Users/kcdacre8tor/ai_smb_crm_frontend` (GitHub: elev8tion/aismbFE)
- **Stack:** Next.js 15.5.2, Cloudflare Pages, NoCodeBackend (instance: `36905_ai_smb_crm`)
- **Deploy command:** `npm run pages:build && npx wrangler pages deploy .vercel/output/static --project-name=ai-smb-crm --commit-dirty=true --no-bundle`
- **No auto-deploy** — must manually build and deploy after every change

### Key Architecture Decisions
- All API routes use `export const runtime = 'edge'` for Cloudflare Workers compatibility
- `VoiceAgentActionsContext` uses pub/sub (not Redux) — emit from VoiceOperator, subscribe in pages
- Navigation actions run first with 350ms delay before UI actions (so destination page mounts)
- `useVoiceAgentActions()` returns noop when outside provider (SSR-safe — this was a build fix)

### Environment Variables Required
```
NCB_INSTANCE=36905_ai_smb_crm
NCB_AUTH_API_URL=https://app.nocodebackend.com/api/user-auth
NCB_DATA_API_URL=https://app.nocodebackend.com/api/data
OPENAI_API_KEY=<key>
```

### Gotchas Discovered
- `setInterval` crashes Cloudflare Workers — rate limiter constructor guards with `typeof setInterval !== 'undefined'`
- NCB returns decimals as strings — always wrap in `Number()` before math
- NEVER forward Next.js `path` query param to NCB — causes SQL 500 errors
- OpenAI SDK blocks in browser-like environments (jsdom) — only works on edge/server runtime
- No test framework currently installed (was added, tests run, then removed per user preference)

### Recent Git History
```
d6884b9 chore: remove test suite and dev dependencies from project
9da174c feat: add comprehensive test suite with Vitest (184 tests across 16 files)
2131105 fix: make useVoiceAgentActions safe during SSR/prerendering
4e31ad4 feat: add voice agent backend with tool-based CRM actions and client-side UI dispatch
d5ec31b fix: remove global setInterval causing Cloudflare Workers crash
```

### File Map for Voice Agent
```
app/api/agent/chat/route.ts          — Main chat endpoint (system prompt, tool loop)
app/api/agent/transcribe/route.ts    — Whisper transcription
app/api/agent/speak/route.ts         — TTS generation
lib/agent/functions.ts               — ALL_CRM_FUNCTIONS (OpenAI tool definitions)
lib/agent/tools/index.ts             — Tool registry & executeTool dispatcher
lib/agent/tools/{leads,bookings,pipeline,contacts,partnerships,analytics,navigation,ui}.ts
lib/agent/modelRouter.ts             — 3-tier model selection
lib/agent/session.ts                 — In-memory session store
lib/agent/ncbClient.ts               — Server-side NCB API wrapper
lib/openai/config.ts                 — OpenAI client factory & model constants
lib/security/requestValidator.ts     — Input validation & injection detection
lib/security/rateLimiter.ts          — Rate limiting
components/VoiceOperator/index.tsx   — FAB UI component
contexts/VoiceAgentActionsContext.tsx — Client action event bus
```
</context>
