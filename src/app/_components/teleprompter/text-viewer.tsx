"use client";

import { useEffect, useMemo, useRef } from "react";
import { tokenizeIntoSentences, classifyToken } from "@/utils/text-processing";

interface TextViewerProps {
  scriptText: string;
  currentWordIndex: number;
}

export function TextViewer({ scriptText, currentWordIndex }: TextViewerProps) {
  const sentences = useMemo(() => tokenizeIntoSentences(scriptText), [scriptText]);
  const currentWordRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // Smooth scroll with easing to position current word at 25% from top
  useEffect(() => {
    if (!currentWordRef.current || !containerRef.current) return;

    const element = currentWordRef.current;
    const container = containerRef.current;

    // Get element position relative to container
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const containerHeight = container.clientHeight;

    // Target: position element at 25% down from top of container
    const targetOffsetFromTop = containerHeight * 0.25;

    // Calculate target scroll position for container
    const currentScrollY = container.scrollTop;
    const elementTopRelativeToContainer = elementRect.top - containerRect.top;
    const targetScrollY = currentScrollY + elementTopRelativeToContainer - targetOffsetFromTop;

    // Smooth scroll with easing
    const startScroll = currentScrollY;
    const distance = targetScrollY - startScroll;

    // Skip if distance is very small (already in position)
    if (Math.abs(distance) < 5) return;

    const duration = 300; // 300ms for smooth animation
    const startTime = performance.now();

    // Easing function: ease-out cubic for quick start, smooth end
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      container.scrollTop = startScroll + distance * easedProgress;

      if (progress < 1) {
        isScrollingRef.current = true;
        requestAnimationFrame(animateScroll);
      } else {
        isScrollingRef.current = false;
      }
    };

    // Start animation
    if (!isScrollingRef.current) {
      requestAnimationFrame(animateScroll);
    }
  }, [currentWordIndex]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto p-8"
      style={{ scrollBehavior: 'auto' }} // Disable CSS smooth scroll, we handle it manually
    >
      {/* Top padding to push initial content down to 25% */}
      <div style={{ height: '25vh' }} />

      <div className="max-w-4xl mx-auto space-y-6 text-3xl leading-relaxed text-white">
        {sentences.map((sentence, sentenceIndex) => {
          // Tokenize sentence into words for individual word tracking
          const words = sentence.text.split(/(\s+)/);
          let wordIndexInSentence = sentence.wordStartIndex;

          return (
            <div key={sentenceIndex} className="text-left">
              {words.map((word, wordIndex) => {
                // Skip whitespace tokens for index tracking
                const isWhitespace = /^\s+$/.test(word);
                const currentIndex = wordIndexInSentence;

                // Increment word index only for non-whitespace
                if (!isWhitespace) {
                  wordIndexInSentence++;
                }

                const isCurrent = !isWhitespace && currentIndex === currentWordIndex;

                return (
                  <span
                    key={`${sentenceIndex}-${wordIndex}`}
                    ref={isCurrent ? currentWordRef : null}
                    className={isWhitespace ? "" : classifyToken(currentIndex, currentWordIndex)}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          );
        })}

        {/* Bottom padding for smooth scrolling to end */}
        <div style={{ height: '75vh' }} />
      </div>
    </div>
  );
}
