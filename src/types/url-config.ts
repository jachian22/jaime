/**
 * Types for URL configuration system
 */

export interface PassageBasedUrl {
  id: string;
  type: 'passage';
  startWordIndex: number;
  endWordIndex: number;
  url: string;
  category: 'documentation' | 'tutorial' | 'reference' | 'article';
  relevance: string;
  queuePosition?: number;
}

export interface StandaloneUrl {
  id: string;
  type: 'standalone';
  triggerPhrase: string; // Phrase that triggers this URL (not necessarily in script)
  url: string;
  category: 'documentation' | 'tutorial' | 'reference' | 'article';
  relevance: string;
  queuePosition?: number;
}

export type UrlConfig = PassageBasedUrl | StandaloneUrl;

export interface UrlConfigState {
  passageUrls: PassageBasedUrl[];
  standaloneUrls: StandaloneUrl[];
  queue: string[]; // Array of IDs in order they should be opened
}
