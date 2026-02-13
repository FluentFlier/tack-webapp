export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: MessageMetadata;
  created_at: string;
}

export interface MessageMetadata {
  command?: string;
  source_url?: string;
  processing_time_ms?: number;
}

export interface UserPreferences {
  user_id: string;
  high_contrast: boolean;
  font_size: "small" | "medium" | "large" | "x-large";
  screen_reader_verbosity: "concise" | "normal" | "verbose";
  reduced_motion: boolean;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  message: Message;
  conversation_id: string;
}

export interface SlashCommand {
  name: string;
  description: string;
  usage: string;
  execute: (args: string) => string;
}
