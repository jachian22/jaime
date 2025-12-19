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
}

export interface StandaloneUrl {
  id: string;
  type: 'standalone';
  triggerPhrase: string; // Phrase that triggers this URL (not necessarily in script)
  url: string;
  title: string; // User-defined title for this URL
  relevance: string;
  order: number; // Manual ordering for drag-and-drop
}

export type UrlConfig = PassageBasedUrl | StandaloneUrl;

export interface UrlConfigState {
  passageUrls: PassageBasedUrl[];
  standaloneUrls: StandaloneUrl[];
}
