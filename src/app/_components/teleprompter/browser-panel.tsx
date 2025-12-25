"use client";

import { useState, useEffect, useRef } from "react";
import Lottie from "lottie-react";
import type { WebpageDisplaySettings } from "@/types/url-config";
import runningCharacter from "@/../public/animations/jaime.json";

interface BrowserPanelProps {
  url: string;
  onClose: () => void;
  displaySettings: WebpageDisplaySettings;
}

export function BrowserPanel({ url, onClose }: BrowserPanelProps) {
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCurtain, setShowCurtain] = useState(false);
  const [hasShownCurtainReveal, setHasShownCurtainReveal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const curtainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset states when URL changes
    setLoadError(false);
    setIsLoading(true);

    // Trigger curtain reveal on first URL load (even if iframe is blocked)
    if (!hasShownCurtainReveal) {
      console.log("[Browser Panel] 🎬 Triggering curtain reveal for first URL:", url);
      // Small delay to ensure iframe is rendered first
      setTimeout(() => {
        console.log("[Browser Panel] 🏃 Setting curtain visible NOW");
        setShowCurtain(true);
        setHasShownCurtainReveal(true);
      }, 100);
    } else {
      console.log("[Browser Panel] ⏭️ Skipping curtain - already shown once");
    }

    // Set timeout to detect loading failures (5 seconds)
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        console.log("[Browser Panel] Timeout loading URL, likely blocked:", url);
        setLoadError(true);
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [url, isLoading, hasShownCurtainReveal]);

  const handleIframeLoad = () => {
    console.log("[Browser Panel] Iframe loaded successfully:", url);
    setIsLoading(false);
    setLoadError(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Try to detect if content is actually accessible
    try {
      const iframe = iframeRef.current;
      if (iframe?.contentDocument || iframe?.contentWindow?.document) {
        console.log("[Browser Panel] Content is accessible");
      }
    } catch (e) {
      // Cross-origin - this is normal and expected
      console.log("[Browser Panel] Cross-origin iframe (normal behavior)");
    }
  };

  // Handle curtain animation end
  useEffect(() => {
    const curtain = curtainRef.current;
    if (!curtain || !showCurtain) return;

    console.log("[Browser Panel] 🎬 Animation should be starting now on curtain element");

    const handleAnimationStart = (_e: AnimationEvent) => {
      console.log("[Browser Panel] ✨ Animation STARTED:", _e.animationName);
    };

    const handleAnimationEnd = (_e: AnimationEvent) => {
      console.log("[Browser Panel] 🏁 Animation ended:", _e.animationName);
      if (_e.animationName === 'curtain-reveal' || _e.animationName === 'curtain-fade-out') {
        console.log("[Browser Panel] 🎉 Curtain reveal complete - removing from DOM");
        setShowCurtain(false);
      }
    };

    curtain.addEventListener('animationstart', handleAnimationStart);
    curtain.addEventListener('animationend', handleAnimationEnd);
    return () => {
      curtain.removeEventListener('animationstart', handleAnimationStart);
      curtain.removeEventListener('animationend', handleAnimationEnd);
    };
  }, [showCurtain]);

  const handleIframeError = () => {
    console.log("[Browser Panel] Failed to load URL in iframe:", url);
    setLoadError(true);
    setIsLoading(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#1a0140] to-[#0a0a15]">
      {/* Header with close button */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-white/5 p-3">
        <div className="flex-1 truncate text-sm text-white/60">{url}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={openInNewTab}
            className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-purple-700"
            title="Open in new tab"
          >
            Open in Tab ↗
          </button>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Close browser panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && !loadError && (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-purple-500"></div>
          <p className="text-sm text-white/60">Loading page...</p>
        </div>
      )}

      {/* Error message for blocked iframes */}
      {loadError && (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Unable to Display Page</h3>
            <p className="text-sm text-white/60 max-w-md">
              This website blocks iframe embedding for security reasons (X-Frame-Options or CSP headers). Click &quot;Open in Tab&quot; above to view it.
            </p>
            <p className="text-xs text-white/40">
              Sites that commonly block iframes: Google, GitHub, Facebook, Twitter, banking sites, many news sites
            </p>
          </div>
          <button
            onClick={openInNewTab}
            className="mt-4 rounded-full bg-purple-600 px-6 py-2 font-semibold text-white transition hover:bg-purple-700"
          >
            Open in New Tab ↗
          </button>
        </div>
      )}

      {/* Teleprompter frame with curtain reveal */}
      <div
        className={`teleprompter-frame relative h-full w-full flex-1 overflow-hidden ${showCurtain ? 'teleprompter-frame--curtain' : ''}`}
        style={{ display: loadError ? 'none' : 'block' }}
        ref={(el) => {
          if (el && showCurtain) {
            console.log("[Browser Panel] 📦 Frame classes:", el.className);
            console.log("[Browser Panel] 📦 Has curtain class?", el.classList.contains('teleprompter-frame--curtain'));
          }
        }}
      >
        {/* iframe */}
        <iframe
          ref={iframeRef}
          src={url}
          className="teleprompter-iframe absolute inset-0 h-full w-full border-0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          title="Browser view"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />

        {/* Curtain overlay */}
        {showCurtain && (
          <div
            ref={(el) => {
              curtainRef.current = el;
              if (el) console.log("[Browser Panel] 🎭 Curtain element rendered in DOM");
            }}
            className="teleprompter-curtain absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black"
            style={{
              zIndex: 10,
            }}
          />
        )}

        {/* Running character - full-width wrapper to sync with curtain */}
        {showCurtain && (
          <div
            className="character-runner absolute inset-0"
            style={{ zIndex: 20 }}
          >
            <div
              className="absolute right-0 bottom-8 h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48"
              ref={(el) => {
                if (el) console.log("[Browser Panel] 🏃‍♂️ Running character container rendered", {
                  width: el.offsetWidth,
                  height: el.offsetHeight,
                  position: el.getBoundingClientRect()
                });
              }}
            >
              <Lottie
                animationData={runningCharacter}
                loop={true}
                autoplay={true}
                style={{
                  width: '100%',
                  height: '100%',
                  transform: 'scaleX(-1)'  // Mirror horizontally to run left
                }}
                onComplete={() => console.log("[Browser Panel] 🎬 Lottie animation completed loop")}
                onLoopComplete={() => console.log("[Browser Panel] 🔄 Lottie loop complete")}
                onConfigReady={() => console.log("[Browser Panel] ⚙️ Lottie config ready")}
              />
            </div>
          </div>
        )}
      </div>

      {/* CSS for curtain animation */}
      <style jsx>{`
        @keyframes curtain-reveal {
          0% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-3%);
            /* Slow opening - barely moves in first 0.5s */
          }
          100% {
            transform: translateX(-100%);
            /* Main reveal in remaining 2s */
          }
        }

        @keyframes character-run {
          0% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-3%);
            /* Character walks on slowly */
          }
          100% {
            transform: translateX(-100%);
            /* Then runs with curtain */
          }
        }

        .teleprompter-frame--curtain .teleprompter-curtain {
          animation: curtain-reveal 2.5s cubic-bezier(0.77, 0, 0.18, 1) 0.5s forwards;
        }

        .teleprompter-frame--curtain .character-runner {
          animation: character-run 2.5s cubic-bezier(0.77, 0, 0.18, 1) 0.5s forwards;
        }

        /* Respect reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .teleprompter-frame--curtain .teleprompter-curtain {
            animation: curtain-fade-out 0.4s ease-out 0.2s forwards;
          }

          .teleprompter-frame--curtain .character-runner {
            animation: character-fade-out 0.4s ease-out 0.2s forwards;
          }

          @keyframes curtain-fade-out {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }

          @keyframes character-fade-out {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }
        }
      `}</style>
    </div>
  );
}
