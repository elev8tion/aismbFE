# Agent Systems Documentation

## Overview

This document provides a comprehensive overview of the voice agent and agentic functionality in the AI SMB CRM (app.kre8tion.com). The system implements a sophisticated voice-operated AI assistant that can manage CRM operations through natural language commands in both English and Spanish.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [API Routes](#api-routes)
3. [Core Components](#core-components)
4. [Agent Tools & Functions](#agent-tools--functions)
5. [Data Flow](#data-flow)
6. [Environment Variables](#environment-variables)
7. [Database Schema](#database-schema)
8. [Key Files Reference](#key-files-reference)
9. [Security & Rate Limiting](#security--rate-limiting)
10. [Deployment Considerations](#deployment-considerations)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  ┌──────────────────┐         ┌──────────────────────────────┐ │
│  │ VoiceOperator    │         │ VoiceAgentActionsContext     │ │
│  │ (FAB Component)  │◄────────┤ (Client-side event bus)      │ │
│  └──────────────────┘         └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │                           ▲
                    │ Voice Recording           │ Client Actions
                    ▼                           │ (navigate, UI updates)
┌─────────────────────────────────────────────────────────────────┐
│                        API Routes (Edge)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ /transcribe  │  │   /chat      │  │      /speak          │  │
│  │ (Whisper-1)  │→→│ (GPT models) │→→│ (gpt-4o-mini-tts)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    │                           ▲
                    │ Tool Calls                │ Tool Results
                    ▼                           │
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Tool Registry                           │
│  ┌────────────┐ ┌────────────┐ ┌───────────┐ ┌──────────────┐ │
│  │   Leads    │ │  Pipeline  │ │  Contacts │ │  Bookings    │ │
│  ├────────────┤ ├────────────┤ ├───────────┤ ├──────────────┤ │
│  │ Partnerships│ │ Analytics │ │   Bulk    │ │  Messaging   │ │
│  ├────────────┤ ├────────────┤ ├───────────┤ ├──────────────┤ │
│  │ Navigation │ │   UI       │ │   ROI     │ │              │ │
│  └────────────┘ └────────────┘ └───────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │                           ▲
                    │ NCB API Calls             │ Data
                    ▼                           │
┌─────────────────────────────────────────────────────────────────┐
│                    NCB Client Layer                              │
│  ┌──────────────────┐         ┌──────────────────────────────┐ │
│  │ Data Proxy API   │         │    OpenAPI (server-to-server)│ │
│  │ (authenticated)  │         │    (tables without user_id)  │ │
│  └──────────────────┘         └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│             NoCodeBackend Database (NCB)                         │
│  Instance: 36905_ai_smb_crm                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                Cloudflare KV (Edge Storage)                      │
│  ┌──────────────────┐         ┌──────────────────────────────┐ │
│  │ AGENT_SESSIONS   │         │    RATE_LIMIT_KV             │ │
│  │ (conversations)  │         │    (rate limiting)           │ │
│  └──────────────────┘         └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Processing Flow

```
1. User speaks → VoiceOperator captures audio
                    ↓
2. Audio → /api/agent/transcribe (Whisper-1)
                    ↓
3. Text → /api/agent/chat
   ├─ Session retrieval (KV)
   ├─ Model selection (fast/standard/reasoning)
   ├─ Language-specific system prompt (EN/ES)
   ├─ Few-shot examples injection
   ├─ Tool execution loop (max 5 rounds)
   │  ├─ OpenAI function calling
   │  ├─ Tool registry dispatch
   │  ├─ NCB API calls
   │  └─ Client actions collection
   ├─ Response caching (pure conversational)
   └─ Client actions (navigate, UI updates)
                    ↓
4. Response text → /api/agent/speak (TTS)
                    ↓
5. Audio playback → User hears response
                    ↓
6. Auto-close countdown (30s) or continue
```

---

## API Routes

### 1. `/api/agent/transcribe` (POST)
**Purpose**: Convert voice audio to text using OpenAI Whisper

**Runtime**: Cloudflare Pages Edge

**Request**:
```typescript
FormData {
  audio: File  // audio/webm, audio/mp4, audio/mpeg, audio/wav, audio/ogg
  language?: 'en' | 'es'
}
```

**Response**:
```typescript
{
  text: string
  success: true
  duration: number  // ms
}
```

**Features**:
- IP-based rate limiting (pre-auth)
- User-based rate limiting (post-auth)
- Audio validation (max 5MB, 60s duration)
- Multi-format support (webm, mp4, mp3, ogg, wav)
- Language hint support

**File**: `app/api/agent/transcribe/route.ts`

---

### 2. `/api/agent/chat` (POST)
**Purpose**: Process user questions and execute CRM operations

**Runtime**: Cloudflare Pages Edge

**Request**:
```typescript
{
  question: string
  sessionId: string
  pagePath?: string  // Current route for context
  language?: 'en' | 'es'
}
```

**Response**:
```typescript
{
  response: string
  success: true
  duration: number
  model: string  // gpt-4.1-nano | gpt-4.1-mini | o4-mini
  clientActions: Array<{
    type: 'navigate' | 'ui_action'
    route?: string
    target?: string
    scope?: string
    action?: string
    payload?: Record<string, unknown>
  }>
  cached?: boolean
}
```

**Features**:
- Multi-tier rate limiting (IP + user)
- Session management (KV-backed with in-memory fallback)
- Dynamic model selection (fast/standard/reasoning)
- Bilingual support (English/Spanish)
- Prompt injection detection
- Tool execution loop (max 5 rounds)
- Response caching (conversational only)
- Client action orchestration

**File**: `app/api/agent/chat/route.ts`

---

### 3. `/api/agent/speak` (POST)
**Purpose**: Convert text to speech using OpenAI TTS

**Runtime**: Cloudflare Pages Edge

**Request**:
```typescript
{
  text: string
  language?: 'en' | 'es'
}
```

**Response**: Binary MP3 audio stream

**Headers**:
```
Content-Type: audio/mpeg
Content-Length: <bytes>
X-Duration: <ms>
```

**Features**:
- Language-specific voices (echo for EN, nova for ES)
- Streaming response
- Rate limiting

**File**: `app/api/agent/speak/route.ts`

---

## Core Components

### VoiceOperator Component

**Location**: `components/VoiceOperator/index.tsx`

**Purpose**: Floating action button (FAB) that manages the entire voice interaction lifecycle

**States**:
```typescript
type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'
```

**Features**:
- Browser compatibility checking
- iOS audio unlock handling
- Recording management with cleanup
- Auto-close countdown (30s after response)
- Error handling with user feedback
- Session ID management
- Client action execution (navigation, UI updates)
- Bilingual UI

**Key Hooks**:
- `useVoiceRecording()`: Audio capture and transcription
- `useVoiceAgentActions()`: Client-side event bus for UI updates
- `useTranslations()`: i18n support

**Visual Elements**:
- Animated logo (liquid morph effect)
- State-dependent colors (green=listening, orange=processing, blue=speaking)
- Waveform animation during recording
- Transcript display
- Error messages
- Auto-close prompt with countdown

---

### useVoiceRecording Hook

**Location**: `components/VoiceOperator/useVoiceRecording.ts`

**Purpose**: Custom hook for audio recording with proper cleanup

**Options**:
```typescript
{
  onTranscription?: (text: string) => void
  onError?: (error: Error) => void
  maxDurationMs?: number  // default: 60000
  language?: 'en' | 'es'
}
```

**Returns**:
```typescript
{
  isRecording: boolean
  isProcessing: boolean
  error: Error | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  cancelRecording: () => void
}
```

**Features**:
- Browser compatibility checking
- MediaRecorder API wrapper with safety
- Auto-stop timer
- AbortController for cancellation
- Audio validation
- Memory cleanup (URL revocation)

---

### VoiceAgentActionsContext

**Location**: `contexts/VoiceAgentActionsContext.tsx`

**Purpose**: Client-side event bus for coordinating agent-driven UI changes

**Interface**:
```typescript
interface ClientAction {
  type: string
  // Navigation
  route?: string
  target?: string
  // UI actions
  scope?: string  // 'leads', 'contacts', etc.
  action?: string  // 'set_filter', 'search', 'open_new', etc.
  payload?: Record<string, unknown>
}
```

**Usage**:
```typescript
const { emit, subscribe } = useVoiceAgentActions()

// Emit action (from VoiceOperator)
emit({ type: 'navigate', route: '/leads', target: 'leads' })

// Subscribe (from page component)
useEffect(() => {
  const unsub = subscribe((action) => {
    if (action.type === 'ui_action' && action.scope === 'leads') {
      // Handle UI update
    }
  })
  return unsub
}, [])
```

---

## Agent Tools & Functions

### Tool Registry

**Location**: `lib/agent/tools/index.ts`

**Pattern**: Central registry that routes function calls to domain-specific handlers

```typescript
const registry: Record<string, ToolHandler> = {
  // Leads
  list_leads, search_leads, count_leads, create_lead,
  update_lead_status, score_lead, get_lead_summary,

  // Bookings
  get_todays_bookings, get_upcoming_bookings, list_bookings,
  confirm_booking, cancel_booking, block_date, unblock_date,
  get_availability, get_booking_summary,

  // Pipeline
  list_opportunities, get_pipeline_summary,
  create_opportunity, move_deal,

  // Contacts
  search_contacts, get_contact, create_contact,
  search_companies, create_company, get_company_contacts,

  // Partnerships
  list_partnerships, get_partnership_summary,
  update_partnership_phase, update_satisfaction_score,
  create_partnership, log_partner_interaction,

  // Analytics
  get_dashboard_stats, get_daily_summary, get_recent_activities,
  get_voice_session_insights, get_roi_calculation_insights,
  log_activity, schedule_followup, get_conversion_rate,
  get_revenue_forecast, get_stale_leads, get_top_opportunities,

  // Bulk Operations
  bulk_update_lead_status, bulk_assign_leads,

  // Messaging Drafts
  draft_email, draft_sms,

  // ROI
  run_roi_calculation,

  // Navigation (client-side)
  navigate,

  // UI Actions (client-side)
  ui_set_filter, ui_search, ui_open_new,
  ui_open_edit, ui_open_view,
}
```

### Tool Categories

#### 1. **Leads Tools** (`lib/agent/tools/leads.ts`)
- `list_leads`: List with status filter
- `search_leads`: Search by name/email/company
- `count_leads`: Group by status
- `create_lead`: Create new lead
- `update_lead_status`: Change status
- `score_lead`: AI lead scoring
- `get_lead_summary`: Overview stats

#### 2. **Bookings Tools** (`lib/agent/tools/bookings.ts`)
- `get_todays_bookings`: Today's schedule
- `get_upcoming_bookings`: Future N days
- `list_bookings`: Filter by status
- `confirm_booking`: Approve pending
- `cancel_booking`: Cancel with reason
- `block_date`: Prevent bookings
- `unblock_date`: Remove block
- `get_availability`: Check slots
- `get_booking_summary`: Stats by status

#### 3. **Pipeline Tools** (`lib/agent/tools/pipeline.ts`)
- `list_opportunities`: Filter by stage
- `get_pipeline_summary`: Value & counts
- `create_opportunity`: New deal
- `move_deal`: Change stage

#### 4. **Contacts Tools** (`lib/agent/tools/contacts.ts`)
- `search_contacts`: Find by name/email
- `get_contact`: Full details
- `create_contact`: New contact
- `search_companies`: Find companies
- `create_company`: New company
- `get_company_contacts`: All contacts for company

#### 5. **Partnerships Tools** (`lib/agent/tools/partnerships.ts`)
- `list_partnerships`: Filter by phase/status
- `get_partnership_summary`: Phase breakdown
- `update_partnership_phase`: Move phase
- `update_satisfaction_score`: Update score
- `create_partnership`: New partnership
- `log_partner_interaction`: Log touchpoint

#### 6. **Analytics Tools** (`lib/agent/tools/analytics.ts`)
- `get_dashboard_stats`: Overview metrics
- `get_daily_summary`: Today's activity
- `get_recent_activities`: Activity log
- `get_voice_session_insights`: Session analytics
- `get_roi_calculation_insights`: ROI usage
- `log_activity`: Create activity record
- `schedule_followup`: Schedule task
- `get_conversion_rate`: Lead → Won %
- `get_revenue_forecast`: Weighted pipeline
- `get_stale_leads`: Inactive leads
- `get_top_opportunities`: Rank by value

#### 7. **Bulk Operations Tools** (`lib/agent/tools/bulk.ts`)
- `bulk_update_lead_status`: Update multiple
- `bulk_assign_leads`: Assign to team member

#### 8. **Messaging Tools** (`lib/agent/tools/messaging.ts`)
- `draft_email`: Generate email draft
- `draft_sms`: Generate SMS draft

#### 9. **ROI Tools** (`lib/agent/tools/roi.ts`)
- `run_roi_calculation`: Calculate and save ROI

#### 10. **Navigation Tools** (`lib/agent/tools/navigation.ts`)
**Client-side only** - Returns client_action directive

Targets:
```typescript
'dashboard' | 'leads' | 'contacts' | 'companies' |
'pipeline' | 'bookings' | 'bookings_availability' |
'partnerships' | 'drafts' | 'voice_sessions' |
'roi_calculations' | 'reports_weekly' | 'settings'
```

#### 11. **UI Action Tools** (`lib/agent/tools/ui.ts`)
**Client-side only** - Returns UI manipulation directives

- `ui_set_filter`: Apply page filter
- `ui_search`: Populate search box
- `ui_open_new`: Open create modal
- `ui_open_edit`: Open edit modal by ID or query
- `ui_open_view`: Open view/details modal

---

### Function Definitions

**Location**: `lib/agent/functions.ts`

All tools are defined as OpenAI function calling schemas:

```typescript
export const ALL_CRM_FUNCTIONS: ChatCompletionTool[] = [
  ...leadFunctions,
  ...bookingFunctions,
  ...pipelineFunctions,
  ...contactFunctions,
  ...partnershipFunctions,
  ...analyticsFunctions,
  ...bulkFunctions,
  ...messagingFunctions,
  ...roiFunctions,
  // Navigation & UI functions
]
```

Each function includes:
- `name`: Unique identifier
- `description`: Natural language purpose
- `parameters`: JSON schema with types and enums
- `required`: Required parameter names

---

## Data Flow

### 1. Voice Interaction Flow

```
┌───────────────────────────────────────────────────────────────┐
│ 1. User clicks FAB → VoiceOperator opens → startRecording()  │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ 2. MediaRecorder captures audio → max 60s → stopRecording()  │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ 3. POST /api/agent/transcribe                                 │
│    ├─ Validate audio (5MB max, format check)                 │
│    ├─ OpenAI Whisper-1 transcription                         │
│    └─ Return text                                             │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ 4. POST /api/agent/chat                                       │
│    ├─ Rate limit check (IP + user)                           │
│    ├─ Session retrieval (KV or in-memory)                    │
│    ├─ Model selection (fast/standard/reasoning)              │
│    ├─ System prompt (EN or ES)                               │
│    ├─ Few-shot examples injection                            │
│    ├─ Add user message to conversation                       │
│    ├─ Check response cache                                   │
│    └─ Tool execution loop (max 5 rounds):                    │
│       ├─ OpenAI chat completion with tools                   │
│       ├─ Parse tool calls                                    │
│       ├─ Execute via tool registry                           │
│       │  ├─ Client tools (navigate, UI) → return directive   │
│       │  └─ Data tools → NCB API call                        │
│       ├─ Collect client_action results                       │
│       ├─ Add tool results to messages                        │
│       └─ Continue until no more tool calls                   │
│    ├─ Save conversation to session                           │
│    ├─ Cache response (if no tools used)                      │
│    └─ Return response + clientActions                        │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ 5. Client executes clientActions                              │
│    ├─ Navigate action → router.push(route)                   │
│    └─ UI actions → emit via VoiceAgentActionsContext         │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ 6. POST /api/agent/speak                                      │
│    ├─ Validate text (1000 chars max)                         │
│    ├─ Select voice (echo for EN, nova for ES)                │
│    ├─ OpenAI TTS (gpt-4o-mini-tts)                          │
│    └─ Stream MP3 response                                    │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ 7. iOS Audio Player playback                                 │
│    ├─ Create blob URL                                        │
│    ├─ Play via Audio() with iOS unlock handling             │
│    ├─ On complete → revoke URL                              │
│    └─ Start auto-close countdown (30s)                      │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ 8. User options                                               │
│    ├─ Ask another → clear countdown, start recording        │
│    ├─ Stay open → clear countdown                           │
│    └─ Timeout → close modal, clear session                  │
└───────────────────────────────────────────────────────────────┘
```

### 2. Tool Execution Flow

```
┌───────────────────────────────────────────────────────────────┐
│ Tool Call from OpenAI                                         │
│ { function: { name: 'list_leads', arguments: '{"status":"..."}' } }
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ executeTool() dispatcher (lib/agent/tools/index.ts)          │
│    ├─ Parse arguments                                         │
│    ├─ Lookup handler in registry                             │
│    ├─ Determine tool type:                                   │
│    │  ├─ CLIENT_TOOLS → no NCB access needed                │
│    │  ├─ CREATE_TOOLS → requires userId injection           │
│    │  └─ READ/UPDATE → requires cookies for auth            │
│    └─ Call handler with correct signature                   │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ Tool Handler (e.g., lib/agent/tools/leads.ts)                │
│    ├─ Validate params                                         │
│    ├─ Call NCB client layer                                  │
│    │  └─ ncbRead/ncbCreate/ncbUpdate/ncbDelete               │
│    └─ Format response                                        │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ NCB Client (lib/agent/ncbClient.ts)                          │
│    ├─ Determine API type:                                    │
│    │  ├─ Tables with user_id → Data Proxy (cookie auth)     │
│    │  └─ Tables without user_id → OpenAPI (Bearer token)    │
│    ├─ Build URL with instance param                         │
│    │  ├─ Data Proxy: ?instance=...  (lowercase i)           │
│    │  └─ OpenAPI: ?Instance=...  (capital I)                │
│    ├─ Set headers:                                           │
│    │  ├─ Data Proxy: Cookie, X-Database-instance            │
│    │  └─ OpenAPI: Authorization Bearer                      │
│    ├─ Auto-inject user_id for create operations             │
│    ├─ Strip user_id from update operations                  │
│    └─ Fetch and parse response                              │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ NCB Database (36905_ai_smb_crm)                              │
│    ├─ RLS enforcement (if Data Proxy)                        │
│    ├─ Execute query                                          │
│    └─ Return results                                         │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ Tool result returned to OpenAI                                │
│ { role: 'tool', tool_call_id: '...', content: '{...}' }      │
└───────────────────────────────────────────────────────────────┘
```

### 3. Session Management Flow

```
┌───────────────────────────────────────────────────────────────┐
│ getSession(sessionId, userId, kv?)                           │
│    ├─ Check KV namespace (AGENT_SESSIONS)                    │
│    ├─ If exists → validate user_id match                     │
│    ├─ If expired/corrupt/missing → create new                │
│    ├─ Fallback to in-memory Map if KV unavailable           │
│    └─ Return session with conversation history              │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ Session Structure                                             │
│ {                                                             │
│   session_id: string                                         │
│   user_id: string                                            │
│   conversation: ChatCompletionMessageParam[]                 │
│   created_at: number (epoch ms)                              │
│ }                                                             │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ addMessage(sessionId, message, kv?)                          │
│    ├─ Fetch session                                          │
│    ├─ Append message to conversation                         │
│    ├─ Trim if > MAX_TURNS (20 exchanges)                    │
│    ├─ Save back to KV with TTL (30 min)                     │
│    └─ Or update in-memory Map                               │
└───────────────────────────────────────────────────────────────┘
```

### 4. Response Caching Flow

```
┌───────────────────────────────────────────────────────────────┐
│ getCachedResponse(userId, question, pagePath, kv?)           │
│    ├─ Hash key: SHA-256(userId:question:pagePath)            │
│    ├─ Check KV namespace (AGENT_SESSIONS)                    │
│    │  └─ Key: rc:<hash>                                      │
│    ├─ Or check in-memory Map (fallback)                     │
│    ├─ Validate TTL (5 min)                                  │
│    └─ Return cached response or null                        │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ setCachedResponse(userId, question, pagePath, response, ...)│
│    ├─ Hash key: SHA-256(userId:question:pagePath)            │
│    ├─ Create entry: { response, model, cachedAt }           │
│    ├─ Save to KV with TTL (5 min)                           │
│    └─ Or save to in-memory Map (max 50 entries)             │
└───────────────────────────────────────────────────────────────┘

Note: Only responses with ZERO tool calls are cached (pure conversational)
```

---

## Environment Variables

### Required Environment Variables

#### 1. NoCodeBackend (NCB)
```bash
NCB_INSTANCE=36905_ai_smb_crm
NCB_DATA_API_URL=https://app.nocodebackend.com/api/data
NCB_AUTH_API_URL=https://app.nocodebackend.com/api/user-auth
NCB_OPENAPI_URL=https://openapi.nocodebackend.com
NCB_SECRET_KEY=<from NCB Dashboard → Settings>
```

#### 2. OpenAI
```bash
OPENAI_API_KEY=sk-...
```

#### 3. Cloudflare KV Bindings
**Configured in `wrangler.toml`, NOT in `.env`**

```toml
[[kv_namespaces]]
binding = "AGENT_SESSIONS"
id = "a2289519b47b4c3ea8e656d65c8c3432"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "3da863a3e1854b8f84c0066a37b6c847"
```

**Access in code**:
```typescript
const { env } = getRequestContext()
const kv = env.AGENT_SESSIONS as KVNamespace
const rateLimitKv = env.RATE_LIMIT_KV as KVNamespace
```

---

## Database Schema

### voice_sessions Table

**Purpose**: Store voice agent interaction sessions from the public-facing landing page

```sql
CREATE TABLE voice_sessions (
  id INTEGER PRIMARY KEY,
  external_session_id TEXT,        -- UUID from landing page
  contact_id INTEGER,               -- Link to contacts table (optional)
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration INTEGER,                 -- seconds
  language TEXT,                    -- 'en' | 'es'
  user_agent TEXT,
  device TEXT,                      -- 'desktop' | 'mobile' | 'tablet'
  referrer_page TEXT,
  messages TEXT,                    -- JSON array of ConversationMessage[]
  total_questions INTEGER,
  actions_taken TEXT,               -- JSON array
  topics TEXT,                      -- JSON array
  sentiment TEXT,                   -- 'positive' | 'neutral' | 'negative' | 'mixed'
  intents TEXT,                     -- JSON array
  pain_points TEXT,                 -- JSON array
  objections TEXT,                  -- JSON array
  outcome TEXT,                     -- 'continued_browsing' | 'roi_calculator' | 'booking_scheduled' | 'left_site'
  created_at TIMESTAMP DEFAULT current_timestamp()
)
```

**TypeScript Interface**:
```typescript
export interface VoiceSession {
  id: string
  external_session_id: string
  contact_id?: number
  start_time: string
  end_time?: string
  duration: number
  language: 'en' | 'es'
  user_agent?: string
  device?: 'desktop' | 'mobile' | 'tablet'
  referrer_page?: string
  messages?: string  // JSON of ConversationMessage[]
  total_questions: number
  actions_taken?: string  // JSON
  topics?: string  // JSON
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed'
  intents?: string  // JSON
  pain_points?: string  // JSON
  objections?: string  // JSON
  outcome?: 'continued_browsing' | 'roi_calculator' | 'booking_scheduled' | 'left_site'
  created_at?: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}
```

**Note**: This table tracks sessions from the **landing page** voice agent (kre8tion.com), not the authenticated CRM voice agent. CRM agent sessions are stored in Cloudflare KV (`AGENT_SESSIONS`) and expire after 30 minutes.

---

## Key Files Reference

### API Routes
```
app/api/agent/
├── chat/route.ts           # Main agent chat endpoint
├── speak/route.ts          # Text-to-speech
└── transcribe/route.ts     # Speech-to-text
```

### Agent Core
```
lib/agent/
├── functions.ts            # OpenAI function definitions (all tools)
├── modelRouter.ts          # Dynamic model selection
├── ncbClient.ts            # NCB API wrapper with dual-API support
├── responseCache.ts        # KV-backed response cache
├── session.ts              # KV-backed session management
└── tools/
    ├── index.ts            # Tool registry & dispatcher
    ├── leads.ts
    ├── bookings.ts
    ├── pipeline.ts
    ├── contacts.ts
    ├── partnerships.ts
    ├── analytics.ts
    ├── bulk.ts
    ├── messaging.ts
    ├── roi.ts
    ├── navigation.ts       # Client-side navigation
    └── ui.ts               # Client-side UI actions
```

### UI Components
```
components/VoiceOperator/
├── index.tsx                     # Main FAB component
├── useVoiceRecording.ts          # Recording hook
└── utils/
    ├── audioProcessor.ts         # Audio blob validation
    ├── browserCompatibility.ts   # Feature detection
    ├── iosAudioUnlock.ts         # iOS audio workaround
    └── mediaRecorder.ts          # SafeMediaRecorder wrapper
```

### Contexts
```
contexts/
└── VoiceAgentActionsContext.tsx  # Client-side event bus
```

### Security
```
lib/security/
├── rateLimiter.kv.ts       # KV-backed rate limiting
└── requestValidator.ts      # Input validation & sanitization
```

### Configuration
```
lib/openai/
└── config.ts               # OpenAI client & models config
```

### Types
```
types/
└── voice.ts                # VoiceSession & ConversationMessage interfaces
```

---

## Security & Rate Limiting

### 1. Rate Limiting

**Implementation**: `lib/security/rateLimiter.kv.ts`

**Limits**:
- **Per-minute**: 30 requests
- **Per-hour**: 300 requests

**Enforcement**:
```
1. IP-based (pre-auth) → prevents brute force
2. User-based (post-auth) → prevents budget exhaustion
```

**KV Structure**:
```typescript
// Keys
rl:min:ip:1.2.3.4
rl:hr:ip:1.2.3.4
rl:min:user:123
rl:hr:user:123

// Value
{
  count: number
  resetAt: number  // epoch ms
}
```

**Response on limit exceeded**:
```json
{
  "error": "Rate limit exceeded (30/60s). Try again in 42s.",
  "status": 429,
  "headers": {
    "Retry-After": "42"
  }
}
```

---

### 2. Input Validation

**Implementation**: `lib/security/requestValidator.ts`

**Limits**:
```typescript
MAX_QUESTION_LENGTH: 2000   // chat questions
MAX_TEXT_LENGTH: 1000       // TTS text
MAX_AUDIO_SIZE: 5MB         // audio files
MAX_AUDIO_DURATION: 60s     // recording duration
```

**Validations**:
1. **Type checking** (string, File, etc.)
2. **Length/size limits**
3. **Format validation** (audio MIME types)
4. **Sanitization** (remove control chars, collapse whitespace)
5. **Prompt injection detection** (log warnings)

**Prompt Injection Patterns**:
```typescript
- "ignore previous instructions"
- "forget your instructions"
- "you are now..."
- "system:"
- "assistant:"
- XSS patterns (<script>, javascript:, onerror=, etc.)
```

---

### 3. Authentication

**Pattern**: Cookie-based session via NCB

**Flow**:
```typescript
1. Extract cookies from request
   → better-auth.session_token
   → better-auth.session_data

2. Call NCB /get-session
   → Validate session
   → Return user: { id, email, name }

3. If invalid → 401 Unauthorized
```

**Implementation**: `lib/agent/ncbClient.ts::getSessionUser()`

---

### 4. NCB API Security

**Two APIs with different auth**:

#### Data Proxy (authenticated users)
```typescript
URL: https://app.nocodebackend.com/api/data
Auth: Session cookies
Param: ?instance=... (lowercase)
RLS: Automatic user_id filtering
```

#### OpenAPI (server-to-server)
```typescript
URL: https://openapi.nocodebackend.com
Auth: Bearer ${NCB_SECRET_KEY}
Param: ?Instance=... (capital I)
RLS: None — full table access
Use: Tables without user_id column
     (bookings, availability_settings, blocked_dates)
```

**Auto-injection**: Create operations automatically inject `user_id` (except for tables without the column)

**Stripping**: Update operations strip `user_id` to prevent spoofing

---

## Deployment Considerations

### 1. Cloudflare Pages Edge Runtime

**Key Points**:
- All agent routes use `export const runtime = 'edge'`
- Environment variables accessed via `getRequestContext().env`
- KV namespaces bound in `wrangler.toml`
- No Node.js APIs available (pure edge)

**Example**:
```typescript
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  const { env } = getRequestContext()
  const apiKey = env.OPENAI_API_KEY
  const kv = env.AGENT_SESSIONS as KVNamespace
  // ...
}
```

---

### 2. Manual Build & Deploy

**No auto-deploy from GitHub!**

```bash
# Build
npm run pages:build

# Deploy
npx wrangler pages deploy .vercel/output/static \
  --project-name=ai-smb-crm \
  --commit-dirty=true \
  --no-bundle
```

**Always deploy after code changes to propagate to app.kre8tion.com**

---

### 3. Environment Variables Setup

**Local Development** (`.env.local`):
```bash
cp .env.example .env.local
# Fill in real values
```

**Cloudflare Pages Dashboard**:
```
Settings → Environment Variables → Production
→ Add all NCB_*, OPENAI_*, etc. as encrypted secrets
```

**Verification**:
```bash
# Check bindings
npx wrangler pages deployment list

# Test locally with bindings
npx wrangler pages dev .vercel/output/static
```

---

### 4. Model Configuration

**Location**: `lib/openai/config.ts`

**Current Models**:
```typescript
MODELS = {
  fast: 'gpt-4.1-nano',           // Greetings, simple lookups
  standard: 'gpt-4.1-mini',        // Multi-step queries
  reasoning: 'o4-mini',            // Analysis, "why" questions
  transcription: 'whisper-1',      // STT
  tts: 'gpt-4o-mini-tts',         // TTS
  voice: 'echo',                   // EN voice
  voiceEs: 'nova',                 // ES voice
}
```

**Selection Logic**: `lib/agent/modelRouter.ts`
```typescript
- Greetings (<30 chars) → fast
- Reasoning keywords (analyze, why, explain) → reasoning
- Multi-question or long (>200 chars) → standard
- Default → fast
```

---

### 5. Session TTL & Cache TTL

**Session**:
```typescript
TTL: 30 minutes
Max turns: 20 exchanges (40 messages)
Cleanup: Automatic via KV expiration
```

**Response Cache**:
```typescript
TTL: 5 minutes
Max memory entries: 50 (if KV unavailable)
Criteria: Zero tool calls (pure conversational)
```

---

### 6. iOS Audio Handling

**Challenge**: iOS requires user interaction to unlock audio playback

**Solution**: `components/VoiceOperator/utils/iosAudioUnlock.ts`

```typescript
1. Create dummy Audio() instance
2. On user tap → play silent audio
3. This "unlocks" audio for the session
4. Subsequent programmatic playback works
```

**Critical**: Must unlock during user gesture, NOT in async callback

---

### 7. Browser Compatibility

**Checked Features**:
```typescript
1. MediaRecorder API
2. getUserMedia API
3. navigator.mediaDevices
4. Audio playback
```

**Handled Gracefully**:
```typescript
- Feature detection on mount
- Disable FAB if unsupported
- Show error message to user
```

**Implementation**: `components/VoiceOperator/utils/browserCompatibility.ts`

---

## Tool Execution Patterns

### Pattern 1: Read Operations
```typescript
async function list_leads(
  params: { status?: string; limit?: number },
  cookies: string,
  env: NCBEnv
) {
  const filters: Record<string, string> = {}
  if (params.status) filters.status = params.status
  if (params.limit) filters.limit = String(params.limit)

  const response = await ncbRead<Lead>(env, 'leads', cookies, filters)
  return {
    leads: response.data,
    total: response.total || response.data.length,
  }
}
```

### Pattern 2: Create Operations
```typescript
async function create_lead(
  params: { email: string; first_name?: string; ... },
  userId: string,
  cookies: string,
  env: NCBEnv
) {
  const data = {
    email: params.email,
    first_name: params.first_name || null,
    status: 'new',
    // user_id auto-injected by ncbCreate
  }

  const response = await ncbCreate<{ data: Lead }>(
    env, 'leads', data, userId, cookies
  )
  return { success: true, lead: response.data }
}
```

### Pattern 3: Update Operations
```typescript
async function update_lead_status(
  params: { lead_id: string; status: string },
  cookies: string,
  env: NCBEnv
) {
  const data = { status: params.status }
  // user_id automatically stripped by ncbUpdate

  await ncbUpdate(env, 'leads', params.lead_id, data, cookies)
  return { success: true, lead_id: params.lead_id, status: params.status }
}
```

### Pattern 4: Client-Side Actions
```typescript
async function navigate(
  params: { target: string },
  _cookies: string
) {
  const route = TARGET_TO_ROUTE[params.target]
  return {
    ok: true,
    target: params.target,
    route,
    client_action: { type: 'navigate', route, target: params.target },
  }
}
```

---

## Troubleshooting Guide

### Issue: Audio playback fails on iOS
**Solution**: Ensure `iosAudioUnlock()` called during user tap, not in async callback

### Issue: Rate limit hit unexpectedly
**Check**: Multiple tabs open? Same user? Reset window: minute (60s) or hour (3600s)

### Issue: Tool calls fail with "Unknown tool"
**Check**: Tool registered in `lib/agent/tools/index.ts` registry?

### Issue: NCB 500 error "Invalid SQL"
**Check**: Are you forwarding Next.js `path` query param to NCB? (Don't!)

### Issue: Session not persisting across requests
**Check**: Is `AGENT_SESSIONS` KV namespace bound in wrangler.toml?

### Issue: Decimals returned as strings from NCB
**Solution**: Always wrap in `Number()` before math operations

### Issue: Voice operator FAB doesn't appear
**Check**: Browser compatibility (MediaRecorder, getUserMedia support?)

### Issue: Model returns "temperature not supported"
**Check**: Are you using o-series model? Use `buildChatParams()` helper

---

## System Prompts

### English System Prompt (Condensed)

```
You are the AI Voice Operator for a CRM system. You help users manage their
business by executing CRM operations through voice commands. You MUST respond
ONLY in English.

Guidelines:
- Be concise. Responses will be spoken aloud — keep them under 2-3 sentences.
- CRITICAL: NEVER call a create/write tool unless the user EXPLICITLY asks to
  create, add, or log something. Merely mentioning a topic is NOT a create request.
- When executing write operations, always confirm the action and summarize what
  was done.
- For read operations, summarize the key numbers and highlight anything noteworthy.
- Use natural, conversational language. Avoid technical jargon.
- Never expose raw IDs to the user. Refer to records by name.

Navigation:
- When the user asks to open, go to, show, or take me to a section, call the
  navigate tool with a target from the allowed list.
- Only call the navigate tool when the intent to change pages is explicit.

On-page UI actions:
- When the user asks to filter, search, open a new form, or open/edit a record,
  call the corresponding ui_* tool with the appropriate scope.
```

### Spanish System Prompt (Condensed)

```
Eres el Operador de Voz IA para un sistema CRM. Ayudas a los usuarios a gestionar
su negocio mediante comandos de voz. DEBES responder SOLO en español.

[Same guidelines as English, translated]
```

### Few-Shot Examples

**Purpose**: Teach the model navigation vs conversational patterns

**Examples provided**:
- Navigation: "Open pipeline" → navigate tool
- Navigation: "Open leads" → navigate tool
- UI actions: "Filter leads to qualified" → ui_set_filter
- UI actions: "New deal" → ui_open_new
- Tool usage: "What's my conversion rate?" → get_conversion_rate
- Tool usage: "Find leads I haven't touched in 2 weeks" → get_stale_leads
- Ambiguity handling: "Open reports" → ask clarifying question

---

## Performance Metrics

### Expected Latencies

```
Transcription:  1-3s  (Whisper-1)
Chat (no tools): 0.5-1.5s (gpt-4.1-nano, cached)
Chat (with tools): 2-5s (tool execution + model calls)
TTS: 1-2s (gpt-4o-mini-tts)

Total interaction (no tools): ~3-6s
Total interaction (with tools): ~5-10s
```

### Token Usage (Approx)

```
System prompt: ~800 tokens
Few-shot examples: ~1200 tokens (EN or ES)
Average user question: ~20 tokens
Average response: ~100 tokens
Tool definitions: ~5000 tokens (all 60+ functions)

Typical request: ~7000-8000 input tokens
Typical response: ~100-500 output tokens
```

### Cost Optimization Strategies

1. **Model routing**: Fast model (nano) for 70%+ of requests
2. **Response caching**: Conversational responses cached for 5min
3. **Session trimming**: Max 20 exchanges to prevent bloat
4. **Parallel tool calls**: OpenAI supports parallel execution
5. **Function pruning**: Only include relevant tools per route (future)

---

## Future Enhancements

### Potential Improvements

1. **Context-aware tool filtering**: Only pass relevant tools based on current page
2. **Streaming responses**: Stream TTS audio as it's generated
3. **Multi-turn confirmation**: "Are you sure?" for destructive operations
4. **Voice command shortcuts**: "Show me today" → get_daily_summary
5. **Persistent user preferences**: Remember language, voice settings
6. **Analytics dashboard**: Track popular commands, error rates, latency
7. **A/B testing**: Compare model performance (nano vs mini vs reasoning)
8. **Custom wake word**: "Hey CRM" instead of FAB click
9. **Web Speech API**: Browser-native STT as fallback (free, but less accurate)
10. **Batch operations**: "Create 5 leads from my notes"

---

## Related Documentation

- **CLAUDE.md**: Project overview, architecture, deployment
- **DEVELOPMENT.md**: Extension points, patterns, templates
- **DEPLOYMENT.md**: Cloudflare Pages setup, domain config
- **ROLES_AND_PERMISSIONS.md**: RBAC design, permission matrix
- **NCB Reference**: `/Users/kcdacre8tor/ai-smb-partners/.claude/ncb-reference/`

---

## Contact & Support

**Issues**: Raise in GitHub repo or contact `connect@elev8tion.one`

**Live Site**: https://app.kre8tion.com

**Landing Page**: https://kre8tion.com (separate repo with public voice agent)

---

*Last Updated: 2026-02-12*
*AI SMB CRM (ELEV8TION KRE8TION)*
