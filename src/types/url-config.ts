/**
 * Types for URL configuration system
 */

export interface PassageBasedUrl {
  id: string;
  type: 'passage';
  startWordIndex: number;
  endWordIndex: number;
  selectedText: string; // The actual text that was selected
  url: string;
  title: string; // User-defined title for this URL
  relevance: string;
  queuePosition: number; // Position in combined manual queue
}

export interface StandaloneUrl {
  id: string;
  type: 'standalone';
  triggerPhrase: string; // Phrase that triggers this URL (not necessarily in script)
  url: string;
  title: string; // User-defined title for this URL
  relevance: string;
  queuePosition: number; // Position in combined manual queue
}

export type UrlConfig = PassageBasedUrl | StandaloneUrl;

export interface WebpageDisplaySettings {
  holdTime: number; // Seconds to hold at top before scrolling (0 = no hold)
  scrollSpeed: number; // Pixels per second (0 = no auto-scroll)
  splitPercentage: number; // 0-100, percentage of screen for webpage
}

export interface UrlConfigState {
  passageUrls: PassageBasedUrl[];
  standaloneUrls: StandaloneUrl[];
  displaySettings: WebpageDisplaySettings;
  aiToolCallingEnabled?: boolean; // Whether AI agentic search is enabled
}
