"use client";

import { useEffect, useRef } from "react";
import type { TranscriptLine } from "@/types/jaime";
import { JAIME_CONFIG } from "@/constants/jaime-config";

interface JaimeTranscriptProps {
  transcriptLines: TranscriptLine[];
  maxVisibleLines?: number;
}

export function JaimeTranscript({
  transcriptLines,
  maxVisibleLines = JAIME_CONFIG.TRANSCRIPT.MAX_VISIBLE_LINES,
}: JaimeTranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollEnabled = useRef(true);

  // Auto-scroll to latest line
  useEffect(() => {
    if (autoScrollEnabled.current && containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, JAIME_CONFIG.TRANSCRIPT.AUTO_SCROLL_DELAY_MS);
    }
  }, [transcriptLines]);

  // Detect manual scrolling (disable auto-scroll if user scrolls up)
  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    autoScrollEnabled.current = isAtBottom;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    const seconds = timestamp.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Show only last N lines
  const visibleLines = transcriptLines.slice(-maxVisibleLines);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex h-full flex-col overflow-y-auto p-8"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="mx-auto w-full max-w-4xl space-y-4">
        {visibleLines.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
            <div className="mb-4 text-6xl opacity-20">🎤</div>
            <p className="mb-2 text-lg font-semibold text-white/60">
              Ready to start
            </p>
            <p className="text-sm text-white/40">
              Click the Start button below to begin recording your conversation
            </p>
            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-left">
              <p className="mb-2 text-xs font-semibold text-white/60">Voice Commands:</p>
              <ul className="space-y-1 text-xs text-white/40">
                <li>• &ldquo;Jaime, look up [topic]&rdquo; - Search for information</li>
                <li>• &ldquo;Jaime, close this&rdquo; - Close browser panel</li>
              </ul>
            </div>
          </div>
        ) : (
          visibleLines.map((line, index) => (
            <div
              key={line.id}
              className="animate-fade-in rounded-lg bg-white/5 p-4 transition-opacity"
              style={{
                animationDelay: `${index * 50}ms`,
                animationDuration: `${JAIME_CONFIG.TRANSCRIPT.LINE_FADE_DURATION_MS}ms`,
              }}
            >
              <div className="mb-2 text-xs text-white/50">
                [{formatTimestamp(line.timestamp)}]
              </div>
              <div className="text-lg leading-relaxed text-white">
                {line.text}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
