"use client";

import { useEffect, useState } from "react";
import type { VoiceCommand } from "@/hooks/use-voice-commands";

interface VoiceCommandIndicatorProps {
  command: VoiceCommand | null;
}

export function VoiceCommandIndicator({ command }: VoiceCommandIndicatorProps) {
  const [visible, setVisible] = useState(false);
  const [displayCommand, setDisplayCommand] = useState<VoiceCommand | null>(null);

  useEffect(() => {
    if (command) {
      setDisplayCommand(command);
      setVisible(true);

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [command]);

  if (!visible || !displayCommand) {
    return null;
  }

  return (
    <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 animate-fade-in">
      <div className="rounded-full border border-purple-500/30 bg-purple-900/90 px-6 py-3 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="flex h-8 w-8 items-center justify-center">
            {displayCommand.type === 'search' && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-purple-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
            {displayCommand.type === 'close' && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-purple-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            {displayCommand.type === 'unknown' && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-yellow-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
          </div>

          {/* Command text */}
          <div className="flex flex-col">
            <div className="text-sm font-semibold text-purple-200">
              {displayCommand.type === 'search' && `Searching: "${displayCommand.query}"`}
              {displayCommand.type === 'close' && 'Closing browser panel'}
              {displayCommand.type === 'unknown' && 'Command not recognized'}
            </div>
            <div className="text-xs text-purple-400">
              &ldquo;{displayCommand.rawText}&rdquo;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
