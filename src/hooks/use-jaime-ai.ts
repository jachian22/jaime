"use client";

import { useEffect, useRef, useCallback } from "react";
import type { TranscriptLine } from "@/types/jaime";
import type { SensitivityLevel } from "@/constants/jaime-config";
import { JAIME_CONFIG } from "@/constants/jaime-config";

interface UseJaimeAIProps {
  transcriptLines: TranscriptLine[];
  sensitivity: SensitivityLevel;
  onUrlSuggestion: (url: string, relevance: string) => void;
  enabled: boolean; // Only enabled in ai-assistant mode
}

export function useJaimeAI({
  transcriptLines,
  sensitivity,
  onUrlSuggestion,
  enabled,
}: UseJaimeAIProps): void {
  const processingRef = useRef(false);
  const lastAnalyzedCountRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get rolling context window based on sensitivity
  const getRecentContext = useCallback((): string => {
    // Map sensitivity level to context window key (type-safe)
    const contextKey = {
      conservative: 'CONSERVATIVE',
      balanced: 'BALANCED',
      aggressive: 'AGGRESSIVE',
    } as const;

    const maxChars = JAIME_CONFIG.CONTEXT_WINDOW[contextKey[sensitivity]];

    // Concatenate recent transcript lines
    const fullText = transcriptLines
      .map((line) => line.text)
      .join(" ");

    // Return last N characters
    return fullText.slice(-maxChars);
  }, [transcriptLines, sensitivity]);

  useEffect(() => {
    // Skip if disabled or no new lines
    if (!enabled || transcriptLines.length === 0) {
      return;
    }

    // Skip if no new lines since last analysis
    if (transcriptLines.length === lastAnalyzedCountRef.current) {
      return;
    }

    // Don't start new analysis if already processing
    if (processingRef.current) {
      return;
    }

    // Debounce: Wait for pause in conversation before analyzing
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const recentContext = getRecentContext();

      // Skip if context is too short
      if (recentContext.length < 50) {
        return;
      }

      lastAnalyzedCountRef.current = transcriptLines.length;
      processingRef.current = true;

      console.log("[Jaime AI] Analyzing context:", recentContext.slice(-100));

      // Call AI conversational assist endpoint
      fetch("/api/jaime/conversational-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recentContext,
          sensitivity,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }

          if (!response.body) {
            throw new Error("No response body");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log("[Jaime AI Stream] Completed");
              break;
            }

            buffer += decoder.decode(value, { stream: true });

            // Process data stream events
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);

                if (data === "[DONE]") {
                  continue;
                }

                try {
                  // Parse with proper typing
                  const parsed = JSON.parse(data) as unknown;

                  // Type guard for stream event
                  if (
                    typeof parsed === "object" &&
                    parsed !== null &&
                    "type" in parsed &&
                    parsed.type === "tool-input-available" &&
                    "toolName" in parsed &&
                    parsed.toolName === "openWebpage" &&
                    "input" in parsed &&
                    typeof parsed.input === "object" &&
                    parsed.input !== null &&
                    "url" in parsed.input &&
                    "relevance" in parsed.input &&
                    typeof parsed.input.url === "string" &&
                    typeof parsed.input.relevance === "string"
                  ) {
                    const { url, relevance } = parsed.input;
                    console.log("[Jaime AI] URL suggestion:", { url, relevance });
                    onUrlSuggestion(url, relevance);
                  }
                } catch {
                  // Ignore JSON parse errors for non-JSON lines
                  console.debug("[Jaime AI] Ignoring line:", line);
                }
              }
            }
          }
        })
        .catch((error) => {
          console.error("[Jaime AI] Error calling conversational assist API:", error);
        })
        .finally(() => {
          processingRef.current = false;
        });
    }, JAIME_CONFIG.VOICE_COMMANDS.DEBOUNCE_MS);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [transcriptLines, sensitivity, onUrlSuggestion, enabled, getRecentContext]);
}
