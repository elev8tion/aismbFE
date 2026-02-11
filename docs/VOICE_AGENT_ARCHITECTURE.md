# Voice Agent Architecture

## System Overview

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                        USER INTERACTION FLOW                           │
 │                                                                         │
 │   Tap FAB → Record → Transcribe → Chat (LLM) → Speak → Play Audio     │
 │                                                                         │
 │   Each step is a separate API call with auth validation                 │
 └─────────────────────────────────────────────────────────────────────────┘
```

---

## Full Connection Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ BROWSER (Client)                                                             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ DashboardLayout (components/layout/DashboardLayout.tsx)                 │ │
│  │ ├─ Auth guard → redirect /login if !user                               │ │
│  │ ├─ VoiceAgentActionsProvider (pub/sub context)                         │ │
│  │ │   └─ useVoiceAgentActions() → { subscribe, emit }                    │ │
│  │ │       ├─ Page components subscribe to receive actions                │ │
│  │ │       └─ VoiceOperator emits actions from LLM tool calls             │ │
│  │ └─ <VoiceOperator /> (mounted on every dashboard page)                 │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ VoiceOperator (components/VoiceOperator/index.tsx)                     │ │
│  │                                                                         │ │
│  │  States: idle → listening → processing → speaking → auto-close (30s)   │ │
│  │                                                                         │ │
│  │  ┌──────────┐   ┌──────────────────┐   ┌──────────────────────┐       │ │
│  │  │ FAB      │──▶│ useVoiceRecording │──▶│ SafeMediaRecorder    │       │ │
│  │  │ 100x100  │   │ (hook)           │   │ (getUserMedia)       │       │ │
│  │  │ fixed    │   │                  │   │ 1000ms timeslice     │       │ │
│  │  │ z-50     │   │ 60s max duration │   │ echo/noise suppress  │       │ │
│  │  └──────────┘   └────────┬─────────┘   └──────────────────────┘       │ │
│  │                          │ audio blob                                  │ │
│  │                          ▼                                              │ │
│  │               ┌─────────────────────┐                                  │ │
│  │               │ /api/agent/transcribe│──── STT ──────────────────┐     │ │
│  │               └─────────────────────┘                            │     │ │
│  │                                                                  │     │ │
│  │               ┌─────────────────────┐◀── text ───────────────────┘     │ │
│  │               │ processVoiceInteraction()                        │     │ │
│  │               │ sends { question, sessionId, pagePath, language }│     │ │
│  │               └──────────┬──────────┘                                  │ │
│  │                          │                                              │ │
│  │                          ▼                                              │ │
│  │               ┌─────────────────────┐                                  │ │
│  │               │ /api/agent/chat      │──── LLM + Tools ──┐            │ │
│  │               └─────────────────────┘                     │            │ │
│  │                                                           │            │ │
│  │               ┌─────────────────────┐◀── { response,     │            │ │
│  │               │ Handle response      │    clientActions } ┘            │ │
│  │               │                     │                                  │ │
│  │               │ 1. Emit actions ────┼──▶ router.push() (navigate)     │ │
│  │               │                     │──▶ emit(ui_action) (filter/etc) │ │
│  │               │ 2. Request TTS ─────┼──▶ /api/agent/speak             │ │
│  │               └──────────┬──────────┘                                  │ │
│  │                          │ audio blob                                  │ │
│  │                          ▼                                              │ │
│  │               ┌─────────────────────┐                                  │ │
│  │               │ IOSAudioPlayer      │                                  │ │
│  │               │ ├─ AudioContext      │                                  │ │
│  │               │ ├─ 2.5x gain boost  │                                  │ │
│  │               │ ├─ silent unlock     │                                  │ │
│  │               │ └─ onEnded → 30s    │                                  │ │
│  │               │    auto-close timer  │                                  │ │
│  │               └─────────────────────┘                                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Supporting Utilities:                                                       │
│  ├─ AudioURLManager        — blob URL lifecycle (prevent memory leaks)      │
│  ├─ browserCompatibility   — HTTPS check, format detection, error classes   │
│  ├─ sessionId (lib/utils)  — UUID in sessionStorage, persists per tab       │
│  └─ LanguageContext         — language passed to all 3 API endpoints         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                          │               │               │
              ┌───────────┘               │               └───────────┐
              ▼                           ▼                           ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│ POST /api/agent/    │   │ POST /api/agent/    │   │ POST /api/agent/    │
│ transcribe          │   │ chat                │   │ speak               │
│ (edge runtime)      │   │ (edge runtime)      │   │ (edge runtime)      │
├─────────────────────┤   ├─────────────────────┤   ├─────────────────────┤
│                     │   │                     │   │                     │
│ 1. Auth check       │   │ 1. Auth check       │   │ 1. Auth check       │
│ 2. Validate audio   │   │ 2. Validate question │   │ 2. Validate text    │
│    (≤5MB, type)     │   │    (≤2000 chars)    │   │    (≤1000 chars)    │
│ 3. OpenAI Whisper   │   │ 3. Injection detect │   │ 3. OpenAI TTS       │
│    (whisper-1)      │   │ 4. Model selection  │   │    (gpt-4o-mini-tts │
│                     │   │ 5. Session mgmt     │   │     voice: echo)    │
│ Returns: { text }   │   │ 6. Tool loop (≤5)   │   │                     │
│                     │   │                     │   │ Returns: audio/mpeg │
│                     │   │ Returns: {response, │   │         blob        │
│                     │   │  clientActions[]}   │   │                     │
└─────────────────────┘   └──────────┬──────────┘   └─────────────────────┘
                                     │
                                     │ Tool calls
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ TOOL EXECUTION LAYER (lib/agent/)                                            │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐        │
│  │ executeTool (tools/index.ts)                                     │        │
│  │ Dispatcher: routes tool_name → domain handler                    │        │
│  │ CREATE tools: passes (params, userId, cookies)                   │        │
│  │ Other tools:  passes (params, cookies)                           │        │
│  └──────────────────────────────────────────────────────────────────┘        │
│         │                                                                    │
│         ├──▶ tools/leads.ts ────────── 7 tools ──────────────────────┐      │
│         │    list, search, count, create, update_status, score,      │      │
│         │    get_summary                                             │      │
│         │                                                            │      │
│         ├──▶ tools/bookings.ts ─────── 9 tools ─────────────────────┤      │
│         │    todays, upcoming, list, confirm, cancel, block,         │      │
│         │    unblock, availability, summary                          │      │
│         │                                                            │      │
│         ├──▶ tools/pipeline.ts ─────── 4 tools ─────────────────────┤      │
│         │    list_opportunities, summary, create, move_deal          │      │
│         │                                                            │      │
│         ├──▶ tools/contacts.ts ─────── 6 tools ─────────────────────┤      │
│         │    search_contacts, get_contact, create_contact,           │      │
│         │    search_companies, create_company, get_company_contacts  │      │
│         │                                                            │      │
│         ├──▶ tools/partnerships.ts ─── 4 tools ─────────────────────┤      │
│         │    list, summary, update_phase, update_health_score        │      │
│         │                                                            │      │
│         ├──▶ tools/analytics.ts ────── 7 tools ─────────────────────┤      │
│         │    dashboard_stats, daily_summary, recent_activities,       │      │
│         │    voice_insights, roi_insights, create_task, list_tasks   │      │
│         │                                                            │      │
│         ├──▶ tools/navigation.ts ───── 1 tool ──────────────────────┤      │
│         │    navigate(target) → { client_action: { type: 'navigate' } }    │
│         │    12 targets: dashboard, leads, contacts, companies,      │      │
│         │    pipeline, bookings, bookings_availability, partnerships,│      │
│         │    voice_sessions, roi_calculations, reports_weekly,       │      │
│         │    settings                                                │      │
│         │                                                            │      │
│         └──▶ tools/ui.ts ──────────── 5 tools ──────────────────────┘      │
│              ui_set_filter, ui_search, ui_open_new,                          │
│              ui_open_edit, ui_open_view                                      │
│              → { client_action: { type: 'ui_action', scope, action } }      │
│                                                                              │
│  Total: 43 tools across 8 domains                                           │
│                                                                              │
│  Function schemas: lib/agent/functions.ts (ALL_CRM_FUNCTIONS)               │
│  ⚠ OpenAI only supports: type, properties, required, enum, description     │
│  ⚠ Do NOT use: oneOf, anyOf, allOf, not, $ref                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          │ ncbRead / ncbCreate / ncbUpdate / ncbDelete
                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ DATABASE LAYER (lib/agent/ncbClient.ts → NoCodeBackend)                      │
│                                                                              │
│  Instance: 36905_ai_smb_crm                                                │
│  Headers: X-Database-instance, Cookie (better-auth.session_*)               │
│  RLS: Automatic via session cookie (no manual user_id filtering)            │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Tables accessed by voice agent tools:                                  │  │
│  │                                                                        │  │
│  │  leads ──────────── name, email, company, phone, status, source       │  │
│  │  contacts ──────── name, email, phone, company_id, title              │  │
│  │  companies ─────── name, industry, website, size                      │  │
│  │  opportunities ─── name, value, stage, company_id, contact_id         │  │
│  │  partnerships ──── phase, health_score, monthly_revenue               │  │
│  │  bookings ──────── date, time, status (no user_id — shared table)     │  │
│  │  blocked_dates ─── date, reason (no user_id — shared table)           │  │
│  │  availability_settings ── (no user_id — shared table)                 │  │
│  │  activities ────── type, title, description, priority                  │  │
│  │  voice_sessions ── sentiment, duration, language, topics, outcome     │  │
│  │  roi_calculations ─ industry, employee_count, estimated_savings       │  │
│  │                                                                        │  │
│  │  ⚠ NCB returns decimals as strings — wrap in Number() before math     │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Auto-behaviors:                                                            │
│  ├─ ncbCreate → injects user_id automatically                              │
│  └─ ncbUpdate → strips user_id to prevent spoofing                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ LLM LAYER (lib/openai/config.ts + lib/agent/modelRouter.ts)                  │
│                                                                              │
│  Model Selection (selectModel):                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Input transcript                                                        │ │
│  │   │                                                                     │ │
│  │   ├─ < 30 chars + greeting pattern ──▶ gpt-4.1-nano  (fast, cheap)    │ │
│  │   │   /^(hi|hello|hey|good|what.*up|yo)/                               │ │
│  │   │                                                                     │ │
│  │   ├─ reasoning keywords ─────────────▶ gpt-4.1  (reasoning model)      │ │
│  │   │   /analyze|why|explain|recommend|strategy|forecast|predict|trend/   │ │
│  │   │                                                                     │ │
│  │   ├─ > 200 chars OR multi-question ──▶ gpt-4.1-mini  (standard)       │ │
│  │   │                                                                     │ │
│  │   └─ default ────────────────────────▶ gpt-4.1-nano  (fast)            │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Other models:                                                              │
│  ├─ STT:  whisper-1                                                         │
│  ├─ TTS:  gpt-4o-mini-tts (voice: 'echo')                                  │
│  └─ Chat: temperature varies by model, max 5 tool rounds                    │
│                                                                              │
│  buildChatParams(model):                                                    │
│  └─ uses chat-completions params: { max_tokens, temperature }              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ SESSION & SECURITY LAYER                                                     │
│                                                                              │
│  Session Management (lib/agent/session.ts):                                 │
│  ├─ Storage: in-memory Map (server-side, per-worker)                        │
│  ├─ TTL: 30 minutes                                                         │
│  ├─ Max turns: 20 (keeps last 40 non-system messages)                       │
│  ├─ Client key: sessionStorage['voice_agent_session_id'] (UUID)             │
│  └─ ⚠ Resets on worker restart (Cloudflare edge — no persistence)           │
│                                                                              │
│  Security (lib/security/requestValidator.ts):                               │
│  ├─ Input limits: question ≤ 2000 chars, text ≤ 1000 chars, audio ≤ 5MB    │
│  ├─ Sanitization: strip null bytes, control chars, normalize whitespace     │
│  ├─ Prompt injection detection patterns:                                    │
│  │   "ignore previous instructions", "forget everything",                   │
│  │   "you are now a", "new instructions:", "system: ..."                    │
│  ├─ Audio format validation: webm, mp4, mpeg, wav, ogg                      │
│  └─ Auth: every endpoint calls getSessionUser() → 401 if no session        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Client Action Flow (Pub/Sub)

```
VoiceOperator                    VoiceAgentActionsContext              Page Components
     │                                    │                                  │
     │ LLM returns clientActions[]        │                                  │
     │                                    │                                  │
     ├─ navigate action ─────────────▶ router.push(route)                    │
     │                                    │                                  │
     ├─ ui_action ──────────────────▶ emit(action) ───────────────────▶ subscribe(handler)
     │   { type: 'ui_action',            │                                   │
     │     scope: 'leads',               │                         handler receives:
     │     action: 'set_filter',         │                         { scope, action,
     │     payload: {filter:'qualified'} │                           payload }
     │   }                               │                                   │
     │                                    │                         Page applies filter,
     │                                    │                         opens modal, searches,
     │                                    │                         etc.
```

---

## Extension Guide

### Adding a New Tool

1. **Create handler** in `lib/agent/tools/<domain>.ts`:
   ```typescript
   export async function my_new_tool(params: { ... }, cookies: string) {
     const data = await ncbRead('table_name', cookies, params);
     return { result: data };
   }
   ```

2. **Register in dispatcher** `lib/agent/tools/index.ts`:
   ```typescript
   import { my_new_tool } from './<domain>';
   // Add to toolMap:
   my_new_tool: myDomainModule.my_new_tool,
   ```

3. **Define OpenAI schema** in `lib/agent/functions.ts`:
   ```typescript
   {
     type: 'function',
     function: {
       name: 'my_new_tool',
       description: 'What this tool does (keep concise for token efficiency)',
       parameters: {
         type: 'object',
         properties: { ... },
         required: ['...'],
         // ⚠ NO oneOf/anyOf/allOf — OpenAI rejects them
       },
     },
   },
   ```

4. If it's a **create** tool, add to `CREATE_TOOLS` set in `tools/index.ts`.

### Adding a New Navigation Target

1. `lib/agent/tools/navigation.ts` — add to `TARGET_TO_ROUTE` map
2. `lib/agent/functions.ts` — add to `navigate` tool's `target` enum
3. `app/api/agent/chat/route.ts` — add to SYSTEM_PROMPT navigation section
4. Optionally add few-shot example to `NAV_FEWSHOTS` array

### Adding a New UI Action

1. `lib/agent/tools/ui.ts` — add new function
2. `lib/agent/tools/index.ts` — register in toolMap
3. `lib/agent/functions.ts` — add schema
4. Page component — subscribe via `useVoiceAgentActions()` and handle action

### Adding a New Language

1. `app/api/agent/chat/route.ts` — add language instruction case
2. `app/api/agent/speak/route.ts` — language is passed to TTS (OpenAI auto-detects)
3. `app/api/agent/transcribe/route.ts` — pass language hint to Whisper
4. `lib/i18n/translations.ts` — add translation strings
5. Add few-shot examples in the new language to `NAV_FEWSHOTS`

### Replacing Session Storage (In-Memory → KV)

Current: `lib/agent/session.ts` uses `Map` — resets on worker restart.

To upgrade:
1. Use Cloudflare KV or Durable Objects
2. Replace `sessions.get()`/`sessions.set()` with KV `get()`/`put()`
3. TTL is already tracked — set KV expiration to 30 minutes
4. Access KV via `env.MY_KV_NAMESPACE` in edge runtime

### Adding Client-Side Action Handlers

Pages that want to respond to voice commands:
```typescript
import { useVoiceAgentActions } from '@/contexts/VoiceAgentActionsContext';

function MyPage() {
  const { subscribe } = useVoiceAgentActions();

  useEffect(() => {
    const unsubscribe = subscribe((action) => {
      if (action.scope !== 'my_scope') return;
      switch (action.action) {
        case 'set_filter': applyFilter(action.payload.filter); break;
        case 'search': setSearchQuery(action.payload.query); break;
        case 'open_new': openCreateModal(); break;
      }
    });
    return unsubscribe;
  }, [subscribe]);
}
```

---

## Key Constraints & Gotchas

| Area | Constraint | Why |
|------|-----------|-----|
| Function schemas | No `oneOf`/`anyOf`/`allOf` | OpenAI API rejects them — causes 500 |
| Session storage | In-memory `Map` | Resets on Cloudflare worker restart |
| Audio recording | 60 second max | `requestValidator.ts` MAX_AUDIO_DURATION |
| Question length | 2000 chars max | `requestValidator.ts` MAX_QUESTION_LENGTH |
| TTS text | 1000 chars max | `requestValidator.ts` MAX_TEXT_LENGTH |
| Audio file size | 5 MB max | `requestValidator.ts` MAX_AUDIO_SIZE |
| Tool rounds | 5 max per request | `chat/route.ts` MAX_TOOL_ROUNDS |
| Conversation | 20 turns max (40 msgs) | `session.ts` MAX_TURNS |
| Session TTL | 30 minutes | `session.ts` SESSION_TTL |
| Auto-close | 30 seconds after speaking | `VoiceOperator` AUTO_CLOSE_DELAY |
| iOS audio | Requires silent unlock first | WebKit policy — `iosAudioUnlock.ts` |
| Safari recording | 1000ms timeslice needed | Safari drops data without chunking |
| NCB decimals | Always `Number()` wrap | NCB returns strings for decimal columns |
| NCB path params | Never forward Next.js `path` | Causes SQL 500 errors |
| Auth cookies | `better-auth.session_*` | NCB internal — not the better-auth library |

---

## File Index

```
components/VoiceOperator/
├── index.tsx                    ← Main FAB component (496 lines)
├── useVoiceRecording.ts         ← Recording hook (204 lines)
└── utils/
    ├── audioProcessor.ts        ← Blob URL lifecycle (29 lines)
    ├── mediaRecorder.ts         ← Safe getUserMedia wrapper (122 lines)
    ├── iosAudioUnlock.ts        ← iOS audio unlock + gain (124 lines)
    └── browserCompatibility.ts  ← HTTPS/format checks (96 lines)

contexts/
└── VoiceAgentActionsContext.tsx  ← Pub/sub for client actions (60 lines)

app/api/agent/
├── chat/route.ts                ← LLM + tool loop (385 lines)
├── speak/route.ts               ← TTS endpoint
└── transcribe/route.ts          ← STT endpoint

lib/agent/
├── functions.ts                 ← 43 OpenAI tool schemas (616 lines)
├── modelRouter.ts               ← Model selection logic
├── session.ts                   ← In-memory session store
├── ncbClient.ts                 ← NCB database client
└── tools/
    ├── index.ts                 ← Tool dispatcher
    ├── leads.ts                 ← 7 lead tools
    ├── bookings.ts              ← 9 booking tools
    ├── pipeline.ts              ← 4 pipeline tools
    ├── contacts.ts              ← 6 contact/company tools
    ├── partnerships.ts          ← 4 partnership tools
    ├── analytics.ts             ← 7 analytics/task tools
    ├── navigation.ts            ← 1 navigation tool (12 targets)
    └── ui.ts                    ← 5 UI action tools

lib/openai/
└── config.ts                    ← OpenAI client, models, chat params

lib/security/
└── requestValidator.ts          ← Input validation + injection detection

lib/utils/
└── sessionId.ts                 ← Client session ID (sessionStorage)

types/
└── voice.ts                     ← VoiceSession, ConversationMessage types
```
