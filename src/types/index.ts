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
  sources?: { title: string; url: string }[];
  processing_time_ms?: number;
}

export type ColorProfile =
  | "default"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "protanomaly"
  | "deuteranomaly"
  | "achromatopsia"
  | "high-contrast"
  | "custom";

export interface UserPreferences {
  user_id: string;
  high_contrast: boolean;
  color_profile: ColorProfile;
  custom_fg: string;
  custom_bg: string;
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

export interface ExtractedContent {
  title: string;
  content: string;
  excerpt: string;
  byline: string | null;
  siteName: string | null;
  url: string;
  images: { src: string; alt: string }[];
}

export interface PDFContent {
  text: string;
  numPages: number;
  title: string | null;
  author: string | null;
  simplified: string;
}
