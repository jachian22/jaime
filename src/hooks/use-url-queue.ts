"use client";

import { useEffect, useState, useRef } from "react";
import type { UrlConfigState } from "@/types/url-config";

const CONFIG_STORAGE_KEY = "teleprompter_url_config";

// Normalize text for matching: lowercase, remove punctuation, normalize whitespace
function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ')      // Normalize multiple spaces to single space
    .trim();
}

interface UseUrlQueueProps {
  currentWordIndex: number;
  recentTranscript: string;
  enabled?: boolean;
  onUrlTrigger: (url: string, relevance: string, title: string) => void;
}

export function useUrlQueue({
  currentWordIndex,
  recentTranscript,
  enabled = true,
  onUrlTrigger,
}: UseUrlQueueProps) {
  const [config, setConfig] = useState<UrlConfigState | null>(null);
  const [queueIndex, setQueueIndex] = useState(-1); // -1 = nothing shown yet, 0+ = index of last shown URL
  const triggeredIdsRef = useRef<Set<string>>(new Set());

  // Load configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig) as UrlConfigState;
      setConfig(parsed);
    }
  }, []);

  // Check for passage-based triggers
  useEffect(() => {
    if (!enabled || !config) return;

    // Check if current word index is within any passage range
    for (const passageUrl of config.passageUrls) {
      if (
        currentWordIndex >= passageUrl.startWordIndex &&
        currentWordIndex <= passageUrl.endWordIndex &&
        !triggeredIdsRef.current.has(passageUrl.id)
      ) {
        console.log("[URL Queue] Passage triggered:", passageUrl);
        onUrlTrigger(passageUrl.url, passageUrl.relevance, passageUrl.title);
        triggeredIdsRef.current.add(passageUrl.id);
      }
    }
  }, [currentWordIndex, config, enabled, onUrlTrigger]);

  // Check for standalone phrase triggers
  useEffect(() => {
    if (!enabled || !config || !recentTranscript) return;

    const normalizedTranscript = normalizeForMatching(recentTranscript);

    for (const standaloneUrl of config.standaloneUrls) {
      const normalizedTrigger = normalizeForMatching(standaloneUrl.triggerPhrase);
      if (
        normalizedTranscript.includes(normalizedTrigger) &&
        !triggeredIdsRef.current.has(standaloneUrl.id)
      ) {
        console.log("[URL Queue] Standalone phrase triggered:", standaloneUrl);
        onUrlTrigger(standaloneUrl.url, standaloneUrl.relevance, standaloneUrl.title);
        triggeredIdsRef.current.add(standaloneUrl.id);
      }
    }
  }, [recentTranscript, config, enabled, onUrlTrigger]);

  // Manual trigger for next URL in combined queue (sorted by queuePosition)
  const triggerNextInQueue = () => {
    if (!config) {
      console.log("[URL Queue] No configuration loaded");
      return null;
    }

    // Get combined queue sorted by queuePosition
    const combinedQueue = [...config.passageUrls, ...config.standaloneUrls].sort((a, b) => a.queuePosition - b.queuePosition);

    const nextIndex = queueIndex + 1;
    if (nextIndex >= combinedQueue.length) {
      console.log("[URL Queue] No more URLs in queue");
      return null;
    }

    const urlConfig = combinedQueue[nextIndex];
    if (!urlConfig) return null;

    console.log("[URL Queue] Manually triggered next:", urlConfig);
    onUrlTrigger(urlConfig.url, urlConfig.relevance, urlConfig.title);
    setQueueIndex(nextIndex);
    return urlConfig;
  };

  // Manual trigger for previous URL in combined queue
  const triggerPrevInQueue = () => {
    if (!config) {
      console.log("[URL Queue] No configuration loaded");
      return null;
    }

    const prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      console.log("[URL Queue] Already at first URL");
      return null;
    }

    // Get combined queue sorted by queuePosition
    const combinedQueue = [...config.passageUrls, ...config.standaloneUrls].sort((a, b) => a.queuePosition - b.queuePosition);

    const urlConfig = combinedQueue[prevIndex];
    if (!urlConfig) return null;

    console.log("[URL Queue] Manually triggered prev:", urlConfig);
    onUrlTrigger(urlConfig.url, urlConfig.relevance, urlConfig.title);
    setQueueIndex(prevIndex);
    return urlConfig;
  };

  const combinedQueue = config ? [...config.passageUrls, ...config.standaloneUrls].sort((a, b) => a.queuePosition - b.queuePosition) : [];
  const hasNextInQueue = config !== null && queueIndex + 1 < combinedQueue.length;
  const hasPrevInQueue = config !== null && queueIndex >= 0;

  return {
    triggerNextInQueue,
    triggerPrevInQueue,
    hasNextInQueue,
    hasPrevInQueue,
    queueIndex,
    totalInQueue: combinedQueue.length,
  };
}
