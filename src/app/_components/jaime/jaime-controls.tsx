"use client";

import type { SensitivityLevel, PrivacyMode } from "@/constants/jaime-config";

interface JaimeControlsProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  privacyMode: PrivacyMode;
  onTogglePrivacyMode: () => void;
  sensitivity: SensitivityLevel;
  onChangeSensitivity: (level: SensitivityLevel) => void;
  connectionStatus: 'connecting' | 'ready' | 'closed';
  onEndSession: () => void;
}

export function JaimeControls({
  isRecording,
  onToggleRecording,
  privacyMode,
  onTogglePrivacyMode,
  sensitivity,
  onChangeSensitivity,
  connectionStatus,
  onEndSession,
}: JaimeControlsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-gradient-to-t from-black to-zinc-900 p-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        {/* Top row: Privacy toggle, Record button, Sensitivity */}
        <div className="flex items-center justify-between">
          {/* Left: Privacy Mode Toggle */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white/80">Mode:</span>
              <button
                onClick={onTogglePrivacyMode}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                  privacyMode === 'ai-assistant'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {privacyMode === 'ai-assistant' ? '🤖 AI Assistant' : '🔒 Captions Only'}
              </button>
            </div>
            <div className="text-xs text-white/50">
              {privacyMode === 'ai-assistant'
                ? 'AI will suggest relevant webpages'
                : 'Live captions only, no AI suggestions'}
            </div>
          </div>

          {/* Center: Record Button */}
          <div className="flex items-center gap-4">
            {/* Connection status (when recording) */}
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
              className={`rounded-full px-12 py-4 text-lg font-semibold transition ${
                isRecording
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isRecording ? '⏸ Pause' : '▶ Start'}
            </button>
          </div>

          {/* Right: Sensitivity Control (only show in AI mode) */}
          {privacyMode === 'ai-assistant' ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white/80">AI Sensitivity:</span>
                <div className="flex gap-2">
                  {(['conservative', 'balanced', 'aggressive'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => onChangeSensitivity(level)}
                      title={
                        level === 'conservative'
                          ? 'Only suggests URLs for explicit requests (most privacy)'
                          : level === 'balanced'
                          ? 'Suggests URLs for clear topical discussions (recommended)'
                          : 'Proactively suggests URLs for relevant topics (most helpful)'
                      }
                      className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                        sensitivity === level
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-white/50">
                {sensitivity === 'conservative' && '🔒 Only explicit requests (~150 word context)'}
                {sensitivity === 'balanced' && '⚖️ Clear topical discussions (~300 word context)'}
                {sensitivity === 'aggressive' && '⚡ Proactive suggestions (~600 word context)'}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-white/40">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold">AI features disabled</span>
              </div>
              <div className="text-xs text-white/40">
                Switch to AI Assistant mode to enable URL suggestions
              </div>
            </div>
          )}
        </div>

        {/* Bottom row: End Session button */}
        {isRecording && (
          <div className="flex justify-center">
            <button
              onClick={onEndSession}
              className="rounded-full bg-white/10 px-8 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              End Session & Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
