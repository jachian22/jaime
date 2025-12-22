"use client";

import { useState, useCallback } from "react";
import type { TopicGroup, TranscriptLine, OpenedUrl } from "@/types/jaime";

export interface UseTopicGroupingReturn {
  topicGroups: TopicGroup[];
  isProcessing: boolean;
  error: string | null;
  generateGroups: (transcriptLines: TranscriptLine[], urlHistory: OpenedUrl[]) => Promise<void>;
}

export function useTopicGrouping(): UseTopicGroupingReturn {
  const [topicGroups, setTopicGroups] = useState<TopicGroup[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateGroups = useCallback(async (
    transcriptLines: TranscriptLine[],
    urlHistory: OpenedUrl[]
  ) => {
    if (transcriptLines.length === 0) {
      setTopicGroups([]);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // For MVP: Simple client-side grouping
      // Post-MVP: Could call AI endpoint for smarter grouping

      // Simple heuristic: Group every ~10 lines as a topic
      const groups: TopicGroup[] = [];
      const linesPerGroup = 10;

      for (let i = 0; i < transcriptLines.length; i += linesPerGroup) {
        const startLineIndex = i;
        const endLineIndex = Math.min(i + linesPerGroup - 1, transcriptLines.length - 1);

        // Extract text for this group
        const groupLines = transcriptLines.slice(startLineIndex, endLineIndex + 1);
        const groupText = groupLines.map(line => line.text).join(' ');

        // Simple title generation: First few words
        const words = groupText.split(' ').slice(0, 5);
        const title = words.join(' ') + (words.length >= 5 ? '...' : '');

        // Find URLs that were opened during this topic timeframe
        const startTime = new Date(groupLines[0]!.timestamp).getTime();
        const endTime = new Date(groupLines[groupLines.length - 1]!.timestamp).getTime();

        const topicUrls = urlHistory
          .filter((urlData) => {
            const urlTime = new Date(urlData.openedAt).getTime();
            return urlTime >= startTime && urlTime <= endTime;
          })
          .map((urlData) => urlData.url);

        // Extract simple keywords (words > 5 chars, not too common)
        const commonWords = new Set(['this', 'that', 'with', 'have', 'from', 'they', 'been', 'were', 'which', 'their']);
        const keywords = groupText
          .toLowerCase()
          .split(/\s+/)
          .filter((word) => word.length > 5 && !commonWords.has(word))
          .slice(0, 5);

        groups.push({
          id: crypto.randomUUID(),
          title,
          startLineIndex,
          endLineIndex,
          urls: topicUrls,
          keywords: [...new Set(keywords)], // Remove duplicates
        });
      }

      setTopicGroups(groups);
    } catch (err) {
      console.error('[Topic Grouping] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate topics');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    topicGroups,
    isProcessing,
    error,
    generateGroups,
  };
}
