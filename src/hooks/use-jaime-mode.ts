"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { TranscriptLine, OpenedUrl, JaimeSession } from "@/types/jaime";
import type { SensitivityLevel, PrivacyMode } from "@/constants/jaime-config";
import { JAIME_CONFIG } from "@/constants/jaime-config";
import { useJaimeAI } from "./use-jaime-ai";

export interface UseJaimeModeReturn {
  // Session
  isRecording: boolean;
  sessionId: string | null;

  // Transcript
  transcriptLines: TranscriptLine[];
  addTranscriptLine: (text: string, isFinal: boolean) => void;

  // Browser
  currentUrl: string | null;
  openUrl: (url: string, source: 'ai' | 'voice-command', relevance?: string) => void;
  closeUrl: () => void;

  // Controls
  startSession: () => void;
  toggleRecording: () => void;
  endSession: () => void;
  privacyMode: PrivacyMode;
  setPrivacyMode: (mode: PrivacyMode) => void;
  sensitivity: SensitivityLevel;
  setSensitivity: (level: SensitivityLevel) => void;

  // URL history
  urlHistory: OpenedUrl[];
}

export function useJaimeMode(): UseJaimeModeReturn {
  const [session, setSession] = useState<JaimeSession | null>(null);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [urlHistory, setUrlHistory] = useState<OpenedUrl[]>([]);
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>('ai-assistant');
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>('balanced');
  const [isRecording, setIsRecording] = useState(false);

  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewLineRef = useRef<string>('');

  // Start a new session
  const startSession = useCallback(() => {
    const newSession: JaimeSession = {
      id: crypto.randomUUID(),
      startTime: new Date(),
      endTime: null,
      privacyMode,
      sensitivity,
      transcriptLines: [],
      urlHistory: [],
      topicGroups: null,
    };

    setSession(newSession);
    setTranscriptLines([]);
    setUrlHistory([]);
    setCurrentUrl(null);
    setIsRecording(true);

    console.log('[Jaime Mode] Session started:', newSession.id);
  }, [privacyMode, sensitivity]);

  // Toggle recording (pause/resume)
  const toggleRecording = useCallback(() => {
    if (!session) return;

    setIsRecording((prev) => {
      const newState = !prev;
      console.log(`[Jaime Mode] Recording ${newState ? 'resumed' : 'paused'}`);
      return newState;
    });
  }, [session]);

  // Auto-save effect - runs whenever session or transcript/urlHistory changes
  useEffect(() => {
    if (!session || !isRecording) {
      return;
    }

    // Clear any existing interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    // Start auto-save timer with current state
    autoSaveIntervalRef.current = setInterval(() => {
      localStorage.setItem(
        `${JAIME_CONFIG.STORAGE.KEY_PREFIX}${session.id}`,
        JSON.stringify({
          ...session,
          transcriptLines,
          urlHistory,
          endTime: null, // Still active
        })
      );
      console.log('[Jaime Mode] Auto-saved session:', session.id);
    }, JAIME_CONFIG.STORAGE.AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [session, transcriptLines, urlHistory, isRecording]);

  // End the current session
  const endSession = useCallback(() => {
    if (!session) return;

    // Stop auto-save
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }

    // Final save with endTime
    const finalSession: JaimeSession = {
      ...session,
      transcriptLines,
      urlHistory,
      endTime: new Date(),
    };

    localStorage.setItem(
      `${JAIME_CONFIG.STORAGE.KEY_PREFIX}${session.id}`,
      JSON.stringify(finalSession)
    );

    setIsRecording(false);
    console.log('[Jaime Mode] Session ended:', session.id);

    // Navigate to review page (will be handled by page component)
  }, [session, transcriptLines, urlHistory]);

  // Add a transcript line
  const addTranscriptLine = useCallback((text: string, isFinal: boolean) => {
    if (!session) return;

    if (!isFinal) {
      // Update preview line (not added to history yet)
      previewLineRef.current = text;
      return;
    }

    // Add final transcript line
    const newLine: TranscriptLine = {
      id: crypto.randomUUID(),
      text,
      timestamp: new Date(),
      isFinal: true,
    };

    setTranscriptLines((prev) => [...prev, newLine]);
    previewLineRef.current = ''; // Clear preview

    console.log('[Jaime Mode] Transcript line added:', text);
  }, [session]);

  // Open a URL in the browser panel
  const openUrl = useCallback((url: string, source: 'ai' | 'voice-command', relevance?: string) => {
    if (!session) return;

    setCurrentUrl(url);

    const openedUrl: OpenedUrl = {
      url,
      openedAt: new Date(),
      source,
      relevance,
    };

    setUrlHistory((prev) => [...prev, openedUrl]);

    console.log('[Jaime Mode] URL opened:', url, 'source:', source);
  }, [session]);

  // Close the browser panel
  const closeUrl = useCallback(() => {
    setCurrentUrl(null);
    console.log('[Jaime Mode] URL closed');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  // AI Assistant - analyze conversation and suggest URLs
  const handleUrlSuggestion = useCallback((url: string, relevance: string) => {
    openUrl(url, 'ai', relevance);
  }, [openUrl]);

  useJaimeAI({
    transcriptLines,
    sensitivity,
    onUrlSuggestion: handleUrlSuggestion,
    enabled: privacyMode === 'ai-assistant' && isRecording,
  });

  return {
    isRecording,
    sessionId: session?.id ?? null,
    transcriptLines,
    addTranscriptLine,
    currentUrl,
    openUrl,
    closeUrl,
    startSession,
    toggleRecording,
    endSession,
    privacyMode,
    setPrivacyMode,
    sensitivity,
    setSensitivity,
    urlHistory,
  };
}
