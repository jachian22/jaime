"use client";

import { useState } from "react";
import type { WebpageDisplaySettings } from "@/types/url-config";

interface BrowserPanelProps {
  url: string;
  onClose: () => void;
  displaySettings: WebpageDisplaySettings;
}

export function BrowserPanel({ url, onClose }: BrowserPanelProps) {
  const [loadError, setLoadError] = useState(false);

  const handleIframeError = () => {
    console.log("[Browser Panel] Failed to load URL in iframe:", url);
    setLoadError(true);
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
              This website blocks iframe embedding for security reasons. Click &quot;Open in Tab&quot; above to view it in a new browser tab.
            </p>
            <p className="text-xs text-white/40">
              Common sites that block iframes: Google, YouTube, Facebook, Twitter, many banking sites
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

      {/* iframe */}
      <iframe
        src={url}
        className="h-full w-full flex-1 border-0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        title="Browser view"
        onError={handleIframeError}
        style={{ display: loadError ? 'none' : 'block' }}
      />
    </div>
  );
}
