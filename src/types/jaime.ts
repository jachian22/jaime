import type { SensitivityLevel, PrivacyMode } from "@/constants/jaime-config";

export interface TranscriptLine {
  id: string;
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

export interface OpenedUrl {
  url: string;
  openedAt: Date;
  source: 'ai' | 'voice-command';
  relevance?: string;
}

export interface TopicGroup {
  id: string;
  title: string;
  startLineIndex: number;
  endLineIndex: number;
  urls: string[];
  keywords: string[];
}

export interface JaimeSession {
  id: string;
  startTime: Date;
  endTime: Date | null;
  privacyMode: PrivacyMode;
  sensitivity: SensitivityLevel;
  transcriptLines: TranscriptLine[];
  urlHistory: OpenedUrl[];
  topicGroups: TopicGroup[] | null;
}

export interface VoiceCommand {
  type: 'search' | 'close' | 'unknown';
  query?: string;
  timestamp: Date;
  rawText: string;
}
