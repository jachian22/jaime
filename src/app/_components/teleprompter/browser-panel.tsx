"use client";

interface BrowserPanelProps {
  url: string;
  onClose: () => void;
}

export function BrowserPanel({ url, onClose }: BrowserPanelProps) {
  return (
    <div className="flex h-full min-h-screen flex-col bg-gradient-to-b from-[#1a0140] to-[#0a0a15]">
      {/* Header with close button */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-3">
        <div className="flex-1 truncate text-sm text-white/60">{url}</div>
        <button
          onClick={onClose}
          className="ml-3 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
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

      {/* iframe */}
      <iframe
        src={url}
        className="h-full w-full flex-1 border-0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        title="Browser view"
      />
    </div>
  );
}
