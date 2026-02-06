export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface VoiceSession {
  id: string;
  external_session_id: string;
  contact_id?: number;
  start_time: string;
  end_time?: string;
  duration: number;
  language: 'en' | 'es';
  user_agent?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  referrer_page?: string;
  messages?: string; // JSON string of ConversationMessage[]
  total_questions: number;
  actions_taken?: string; // JSON string
  topics?: string; // JSON string
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed';
  intents?: string; // JSON string
  pain_points?: string; // JSON string
  objections?: string; // JSON string
  outcome?: 'continued_browsing' | 'roi_calculator' | 'booking_scheduled' | 'left_site';
  created_at?: string;
}
