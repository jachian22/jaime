"use client";

import { useEffect, useRef } from "react";

interface UseAIToolCallingProps {
  scriptText: string;
  currentWordIndex: number;
  recentTranscript: string;
  completedSentence?: string; // New: trigger on sentence completion
  onToolCall: (url: string, relevance: string, category: string) => void;
  enabled?: boolean;
}

export function useAIToolCalling({
  scriptText,
  currentWordIndex,
  recentTranscript,
  completedSentence,
  onToolCall,
  enabled = true,
}: UseAIToolCallingProps) {
  const processingRef = useRef(false);
  const lastSentenceRef = useRef("");

  useEffect(() => {
    // Skip if disabled, no script, or no sentence completion
    if (!enabled || !scriptText || !completedSentence) {
      return;
    }

    // Skip if this is the same sentence we just processed
    if (completedSentence === lastSentenceRef.current) {
      return;
    }

    // Don't start new analysis if already processing
    if (processingRef.current) {
      return;
    }

    lastSentenceRef.current = completedSentence;
    processingRef.current = true;

    console.log("[AI] Analyzing sentence:", completedSentence);

    // Call AI to analyze context
    fetch("/api/ai/tool-calling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scriptText,
        currentPosition: currentWordIndex,
        recentTranscript,
      }),
    })
      .then(async (response) => {
        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("[AI Stream] Stream completed");
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          console.log("[AI Stream Raw]", buffer.slice(-200)); // Show last 200 chars

          // Process data stream events
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            console.log("[AI Stream Line]", line); // Debug: see each line

            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                console.log("[AI Stream Data]", parsed); // Debug: see what we're receiving

                // Check for tool calls in the stream (AI SDK 5 format: tool-input-available)
                if (parsed.type === "tool-input-available") {
                  if (parsed.toolName === "openWebpage") {
                    const { url, relevance, category } = parsed.input;
                    console.log("[AI Tool Call]", { url, relevance, category });
                    onToolCall(url, relevance, category);
                  }
                }
              } catch (e) {
                // Ignore JSON parse errors for non-JSON lines
                console.debug("Ignoring line:", line);
              }
            }
          }
        }
      })
      .catch((error) => {
        console.error("Error calling AI tool calling API:", error);
      })
      .finally(() => {
        processingRef.current = false;
      });
  }, [completedSentence, scriptText, recentTranscript, onToolCall, enabled]);
}
