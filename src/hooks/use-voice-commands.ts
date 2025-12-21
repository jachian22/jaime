"use client";

import { useState, useEffect, useRef } from "react";
import type { TranscriptLine } from "@/types/jaime";
import { JAIME_CONFIG } from "@/constants/jaime-config";

export interface VoiceCommand {
  type: 'search' | 'close' | 'unknown';
  query?: string;
  timestamp: Date;
  rawText: string;
}

interface UseVoiceCommandsProps {
  transcriptLines: TranscriptLine[];
  enabled: boolean;
  onCommand: (command: VoiceCommand) => void;
}

export interface UseVoiceCommandsReturn {
  lastCommand: VoiceCommand | null;
  isListening: boolean;
}

// Pattern matching for voice commands
const COMMAND_PATTERNS = {
  search: /(?:jamie|jaime),?\s+(?:look\s+up|search|find|show\s+me)\s+(.+)/i,
  close: /(?:jamie|jaime),?\s+(?:close|hide|remove)\s+(?:this|that|it)/i,
} as const;

export function useVoiceCommands({
  transcriptLines,
  enabled,
  onCommand,
}: UseVoiceCommandsProps): UseVoiceCommandsReturn {
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [isListening] = useState(true);
  const lastProcessedIndexRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || transcriptLines.length === 0) {
      return;
    }

    // Process only new transcript lines
    const newLines = transcriptLines.slice(lastProcessedIndexRef.current);

    if (newLines.length === 0) {
      return;
    }

    // Update processed index
    lastProcessedIndexRef.current = transcriptLines.length;

    // Check each new line for commands
    for (const line of newLines) {
      // Only process final transcripts
      if (!line.isFinal) {
        continue;
      }

      const text = line.text.trim().toLowerCase();

      // Check if line contains activation word
      const hasActivationWord = JAIME_CONFIG.VOICE_COMMANDS.ACTIVATION_WORDS.some(
        (word) => text.includes(word)
      );

      if (!hasActivationWord) {
        continue;
      }

      console.log("[Voice Commands] Detected activation word in:", text);

      // Try to match command patterns
      let matchedCommand: VoiceCommand | null = null;

      // Check for "close" command
      const closeMatch = COMMAND_PATTERNS.close.exec(text);
      if (closeMatch) {
        matchedCommand = {
          type: 'close',
          timestamp: line.timestamp,
          rawText: line.text,
        };
        console.log("[Voice Commands] Matched CLOSE command");
      }

      // Check for "search" command
      if (!matchedCommand) {
        const searchMatch = COMMAND_PATTERNS.search.exec(text);
        if (searchMatch) {
          const query = searchMatch[1]?.trim();
          if (query) {
            matchedCommand = {
              type: 'search',
              query,
              timestamp: line.timestamp,
              rawText: line.text,
            };
            console.log("[Voice Commands] Matched SEARCH command:", query);
          }
        }
      }

      // If we found a command, debounce and execute
      if (matchedCommand) {
        // Clear existing debounce timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Debounce command execution
        const command = matchedCommand;
        debounceTimerRef.current = setTimeout(() => {
          setLastCommand(command);
          onCommand(command);
        }, JAIME_CONFIG.VOICE_COMMANDS.DEBOUNCE_MS);

        // Only process one command per batch
        break;
      }
    }

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [transcriptLines, enabled, onCommand]);

  return {
    lastCommand,
    isListening,
  };
}
