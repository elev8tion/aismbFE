/**
 * Voice Agent Types
 *
 * Unified interfaces for voice agent functionality across Landing Page and CRM.
 * Includes conversation management, sessions, tool execution, and analytics.
 */

/// <reference lib="dom" />

import type { Language, DeviceType, TimestampFields, Nullable } from './common';

// ─── Message Types ──────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  role: MessageRole;
  content: string;
  timestamp?: string;
}

// ─── Session Types ──────────────────────────────────────────────────────────

export type SessionOutcome =
  | 'continued_browsing'
  | 'roi_calculator'
  | 'booking_scheduled'
  | 'left_site';

export type SessionSentiment = 'positive' | 'neutral' | 'negative' | 'mixed';

export interface VoiceSession extends TimestampFields {
  id: string;
  external_session_id: string;
  contact_id?: number;
  start_time: string;
  end_time?: string;
  duration: number; // seconds
  language: Language;
  user_agent?: string;
  device?: DeviceType;
  referrer_page?: string;

  // Conversation data (stored as JSON strings in DB)
  messages?: string; // JSON string of ConversationMessage[]
  total_questions: number;
  actions_taken?: string; // JSON string of string[]
  topics?: string; // JSON string of string[]

  // Analytics
  sentiment?: SessionSentiment;
  intents?: string; // JSON string of string[]
  pain_points?: string; // JSON string of string[]
  objections?: string; // JSON string of string[]
  outcome?: SessionOutcome;
}

// ─── Parsed Session (with actual JSON data) ────────────────────────────────

export interface ParsedVoiceSession extends Omit<VoiceSession, 'messages' | 'actions_taken' | 'topics' | 'intents' | 'pain_points' | 'objections'> {
  messages: ConversationMessage[];
  actions_taken: string[];
  topics: string[];
  intents: string[];
  pain_points: string[];
  objections: string[];
}

// ─── Tool System ────────────────────────────────────────────────────────────

export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  required?: boolean;
}

export interface ToolSchema {
  type: 'object';
  properties: Record<string, ToolParameter>;
  required: string[];
}

export interface UnifiedTool {
  name: string;
  description: string;
  schema: ToolSchema;
}

export interface ToolExecutionContext {
  sessionId: string;
  userId?: number;
  language: Language;
  env: Record<string, string>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  clientAction?: ClientAction;
}

// ─── Client Actions (UI interactions) ──────────────────────────────────────

export type ClientActionType =
  | 'NAVIGATE_TO'
  | 'OPEN_ROI_CALCULATOR'
  | 'OPEN_BOOKING_FORM'
  | 'SHOW_PRICING'
  | 'SHOW_CASE_STUDY'
  | 'SCROLL_TO';

export interface ClientAction {
  type: ClientActionType;
  payload?: Record<string, unknown>;
  timestamp: string;
}

// ─── Agent Response ─────────────────────────────────────────────────────────

export interface AgentResponse {
  response: string;
  clientActions?: ClientAction[];
  toolsUsed?: string[];
  metadata?: {
    model?: string;
    tokensUsed?: number;
    latencyMs?: number;
  };
}

// ─── Chat Request/Response ─────────────────────────────────────────────────

export interface ChatRequest {
  sessionId: string;
  question: string;
  language: Language;
  pagePath?: string;
  conversationHistory?: ConversationMessage[];
}

export interface ChatResponse {
  response: string;
  clientActions?: ClientAction[];
  sessionId: string;
  timestamp: string;
}

// ─── Speech/TTS Types ───────────────────────────────────────────────────────

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export type TTSFormat = 'mp3' | 'opus' | 'aac' | 'flac';

export interface SpeakRequest {
  text: string;
  voice?: TTSVoice;
  language: Language;
  format?: TTSFormat;
}

// ─── Voice Recording ────────────────────────────────────────────────────────

export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // seconds
  mediaRecorder: Nullable<MediaRecorder>;
  audioChunks: Blob[];
}

export interface TranscriptionResult {
  text: string;
  language?: Language;
  confidence?: number;
  duration?: number;
}

// ─── Analytics Events ───────────────────────────────────────────────────────

export type AnalyticsEventType =
  | 'session_start'
  | 'session_end'
  | 'question_asked'
  | 'tool_executed'
  | 'client_action'
  | 'error_occurred';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  sessionId: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

// ─── Intent Classification ──────────────────────────────────────────────────

export type UserIntent =
  | 'ask_info'
  | 'calculate_roi'
  | 'book_consultation'
  | 'view_pricing'
  | 'ask_about_services'
  | 'ask_about_process'
  | 'handle_objection'
  | 'general_question';

export interface IntentClassification {
  intent: UserIntent;
  confidence: number;
  entities?: Record<string, unknown>;
}

// ─── Knowledge Base ─────────────────────────────────────────────────────────

export interface KnowledgeBaseEntry {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  language: Language;
}

// ─── Lead Scoring ───────────────────────────────────────────────────────────

export type LeadQuality = 'hot' | 'warm' | 'cold';

export interface LeadScore {
  score: number; // 0-100
  quality: LeadQuality;
  factors: {
    engagement: number;
    intent: number;
    fit: number;
  };
  recommendedAction?: string;
}

// ─── Agent Configuration ────────────────────────────────────────────────────

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  tools: UnifiedTool[];
  voice?: TTSVoice;
}

// ─── Conversation State ─────────────────────────────────────────────────────

export interface ConversationState {
  sessionId: string;
  messages: ConversationMessage[];
  context: Record<string, unknown>;
  metadata: {
    startTime: string;
    language: Language;
    questionsAsked: number;
    toolsUsed: string[];
  };
}
