"use client";

import { useEffect, useState, useRef } from "react";
import type { UrlConfigState } from "@/types/url-config";

const CONFIG_STORAGE_KEY = "teleprompter_url_config";

interface UseUrlQueueProps {
  currentWordIndex: number;
  recentTranscript: string;
  enabled?: boolean;
  onUrlTrigger: (url: string, relevance: string, category: string) => void;
}

export function useUrlQueue({
  currentWordIndex,
  recentTranscript,
  enabled = true,
  onUrlTrigger,
}: UseUrlQueueProps) {
  const [config, setConfig] = useState<UrlConfigState | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
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
        onUrlTrigger(passageUrl.url, passageUrl.relevance, passageUrl.category);
        triggeredIdsRef.current.add(passageUrl.id);
      }
    }
  }, [currentWordIndex, config, enabled, onUrlTrigger]);

  // Check for standalone phrase triggers
  useEffect(() => {
    if (!enabled || !config || !recentTranscript) return;

    const lowerTranscript = recentTranscript.toLowerCase();

    for (const standaloneUrl of config.standaloneUrls) {
      const triggerPhrase = standaloneUrl.triggerPhrase.toLowerCase();
      if (
        lowerTranscript.includes(triggerPhrase) &&
        !triggeredIdsRef.current.has(standaloneUrl.id)
      ) {
        console.log("[URL Queue] Standalone phrase triggered:", standaloneUrl);
        onUrlTrigger(standaloneUrl.url, standaloneUrl.relevance, standaloneUrl.category);
        triggeredIdsRef.current.add(standaloneUrl.id);
      }
    }
  }, [recentTranscript, config, enabled, onUrlTrigger]);

  // Manual trigger for next queued URL
  const triggerNextInQueue = () => {
    if (!config || queueIndex >= config.queue.length) {
      console.log("[URL Queue] No more URLs in queue");
      return null;
    }

    const urlId = config.queue[queueIndex];
    if (!urlId) return null;

    // Find the URL config by ID
    const allUrls = [...config.passageUrls, ...config.standaloneUrls];
    const urlConfig = allUrls.find(u => u.id === urlId);

    if (urlConfig) {
      console.log("[URL Queue] Manually triggered:", urlConfig);
      onUrlTrigger(urlConfig.url, urlConfig.relevance, urlConfig.category);
      setQueueIndex(prev => prev + 1);
      return urlConfig;
    }

    return null;
  };

  const hasNextInQueue = config !== null && queueIndex < config.queue.length;

  return {
    triggerNextInQueue,
    hasNextInQueue,
    queueIndex,
    totalInQueue: config?.queue.length ?? 0,
  };
}
