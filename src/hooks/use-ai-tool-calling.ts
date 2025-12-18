"use client";

import { useEffect, useRef } from "react";

interface UseAIToolCallingProps {
  scriptText: string;
  currentWordIndex: number;
  recentTranscript: string;
  onToolCall: (url: string, context: string) => void;
  enabled?: boolean;
}

export function useAIToolCalling({
  scriptText,
  currentWordIndex,
  recentTranscript,
  onToolCall,
  enabled = true,
}: UseAIToolCallingProps) {
  const lastCheckRef = useRef(0);
  const processingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !scriptText || recentTranscript.length < 50) {
      return;
    }

    // Only check every 20 words to avoid excessive API calls
    if (currentWordIndex - lastCheckRef.current < 20) {
      return;
    }

    // Don't check if we're already processing a request
    if (processingRef.current) {
      return;
    }

    lastCheckRef.current = currentWordIndex;
    processingRef.current = true;

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

          if (done) break;

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
                const parsed = JSON.parse(data);

                // Check for tool calls
                if (parsed.type === "tool-call") {
                  const toolCall = parsed.toolCall;

                  if (toolCall.toolName === "openWebpage") {
                    const { url, relevance } = toolCall.args;
                    console.log("[AI Tool Call]", { url, relevance });
                    onToolCall(url, relevance);
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
  }, [currentWordIndex, scriptText, recentTranscript, onToolCall, enabled]);
}
