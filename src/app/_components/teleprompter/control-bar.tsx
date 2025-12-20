"use client";

interface ControlBarProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  onReset: () => void;
  onBackToEdit: () => void;
  onGoToConfig?: () => void;
  currentWordIndex: number;
  onManualAdvance: () => void;
  onManualRewind: () => void;
  connectionStatus: 'connecting' | 'ready' | 'closed';
  onNextUrl?: () => void;
  onPrevUrl?: () => void;
  hasNextUrl?: boolean;
  hasPrevUrl?: boolean;
  queueInfo?: string;
}

export function ControlBar({
  isRecording,
  onToggleRecording,
  onReset,
  onBackToEdit,
  onGoToConfig,
  currentWordIndex,
  onManualAdvance,
  onManualRewind,
  connectionStatus,
  onNextUrl,
  onPrevUrl,
  hasNextUrl,
  hasPrevUrl,
  queueInfo,
}: ControlBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-gradient-to-t from-black to-zinc-900 p-4">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToEdit}
            className="rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            ← Edit Script
          </button>
          {onGoToConfig && (
            <button
              onClick={onGoToConfig}
              className="rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Configure URLs
            </button>
          )}
        </div>

        {/* Center section - recording control */}
        <div className="flex items-center gap-4">
          {/* Manual controls for testing */}
          <button
            onClick={onManualRewind}
            className="rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
            aria-label="Rewind"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="relative flex items-center gap-3">
            {/* Connection status indicator */}
            {isRecording && (
              <div className="flex items-center gap-2">
                {connectionStatus === 'connecting' && (
                  <>
                    <div className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-yellow-500"></span>
                    </div>
                    <span className="text-sm text-yellow-400">Connecting...</span>
                  </>
                )}
                {connectionStatus === 'ready' && (
                  <>
                    <div className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                    </div>
                    <span className="text-sm text-green-400">Listening</span>
                  </>
                )}
              </div>
            )}

            <button
              onClick={onToggleRecording}
              className={`rounded-full px-10 py-3 font-semibold transition ${
                isRecording
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {isRecording ? "⏸ Pause" : "▶ Start"}
            </button>
          </div>

          <button
            onClick={onManualAdvance}
            className="rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
            aria-label="Advance"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <div className="text-sm text-white/60">
            Word: {currentWordIndex}
          </div>
          {queueInfo && (
            <div className="text-sm text-white/60">
              {queueInfo}
            </div>
          )}
          {hasPrevUrl && onPrevUrl && (
            <button
              onClick={onPrevUrl}
              className="rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              ← Prev URL
            </button>
          )}
          {hasNextUrl && onNextUrl && (
            <button
              onClick={onNextUrl}
              className="rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Next URL →
            </button>
          )}
          <button
            onClick={onReset}
            className="rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
