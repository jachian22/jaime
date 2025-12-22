"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { JaimeTranscript } from "@/app/_components/jaime/jaime-transcript";
import { JaimeControls } from "@/app/_components/jaime/jaime-controls";
import { VoiceCommandIndicator } from "@/app/_components/jaime/voice-command-indicator";
import { AudioCapture } from "@/app/_components/teleprompter/audio-capture";
import { BrowserPanel } from "@/app/_components/teleprompter/browser-panel";
import { useJaimeMode } from "@/hooks/use-jaime-mode";
import { useVoiceCommands, type VoiceCommand } from "@/hooks/use-voice-commands";

export default function JaimePage() {
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'ready' | 'closed'>('closed');
  const [audioError, setAudioError] = useState<string | null>(null);

  const {
    isRecording,
    sessionId,
    transcriptLines,
    addTranscriptLine,
    currentUrl,
    closeUrl,
    startSession,
    toggleRecording,
    endSession,
    privacyMode,
    setPrivacyMode,
    sensitivity,
    setSensitivity,
  } = useJaimeMode();

  // Handle transcript from AudioCapture
  const handleTranscript = useCallback(
    (transcript: string, isFinal: boolean) => {
      console.log(`[Jaime] ${isFinal ? 'FINAL' : 'interim'}:`, transcript);

      // Only add final transcripts for now (Phase 1)
      if (isFinal && transcript.trim()) {
        addTranscriptLine(transcript, isFinal);
      }
    },
    [addTranscriptLine]
  );

  // Toggle recording
  const handleToggleRecording = useCallback(() => {
    if (!sessionId) {
      // No session yet - start a new one
      setAudioError(null); // Clear any previous errors
      startSession();
    } else {
      // Session exists - toggle pause/resume
      toggleRecording();
    }
  }, [sessionId, startSession, toggleRecording]);

  // Handle audio errors
  const handleAudioError = useCallback((error: string) => {
    setAudioError(error);
    console.error('[Jaime] Audio error:', error);
  }, []);

  // Toggle privacy mode
  const handleTogglePrivacyMode = useCallback(() => {
    setPrivacyMode(privacyMode === 'ai-assistant' ? 'captions-only' : 'ai-assistant');
  }, [privacyMode, setPrivacyMode]);

  // End session and go to review
  const handleEndSession = useCallback(() => {
    endSession();

    // Navigate to review page with session ID
    if (sessionId) {
      router.push(`/jaime/review?sessionId=${sessionId}`);
    }
  }, [endSession, sessionId, router]);

  // Handle voice commands
  const handleVoiceCommand = useCallback((command: VoiceCommand) => {
    console.log('[Jaime] Voice command received:', command);

    switch (command.type) {
      case 'close':
        // Close the browser panel
        closeUrl();
        break;

      case 'search':
        // TODO: Implement search functionality in post-MVP
        // For now, just log the query
        console.log('[Jaime] Search query:', command.query);
        // Search stub - will be implemented later
        break;

      case 'unknown':
        console.log('[Jaime] Unknown command:', command.rawText);
        break;
    }
  }, [closeUrl]);

  // Voice commands hook
  const { lastCommand } = useVoiceCommands({
    transcriptLines,
    enabled: isRecording,
    onCommand: handleVoiceCommand,
  });

  // Calculate split widths
  const transcriptWidth = currentUrl !== null ? '50%' : '100%';
  const browserWidth = '50%';

  return (
    <>
      {/* Voice command indicator */}
      <VoiceCommandIndicator command={lastCommand} />

      {currentUrl === null ? (
        // Fullscreen transcript mode
        <div className="h-screen overflow-hidden bg-gradient-to-b from-black to-zinc-900 pb-32">
          {/* Header Banner */}
          <div className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-sm">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Jaime Mode</h1>
                <p className="text-sm text-white/60">
                  {privacyMode === 'ai-assistant'
                    ? 'AI-powered research assistant'
                    : 'Live captions mode'}
                </p>
              </div>
              {sessionId && (
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isRecording && (
                      <div className="h-2 w-2 animate-pulse-slow rounded-full bg-red-500"></div>
                    )}
                    <div className="text-sm font-semibold text-purple-400">
                      {isRecording ? 'Recording' : 'Paused'}
                    </div>
                  </div>
                  <div className="text-xs text-white/40">
                    {transcriptLines.length} {transcriptLines.length === 1 ? 'line' : 'lines'}
                  </div>
                </div>
              )}
            </div>
          </div>
          <JaimeTranscript transcriptLines={transcriptLines} />
        </div>
      ) : (
        // Split-screen mode
        <div className="flex h-screen flex-col bg-gradient-to-b from-black to-zinc-900 pb-32">
          {/* Header Banner */}
          <div className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-sm">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Jaime Mode</h1>
                <p className="text-sm text-white/60">
                  {privacyMode === 'ai-assistant'
                    ? 'AI-powered research assistant'
                    : 'Live captions mode'}
                </p>
              </div>
              {sessionId && (
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isRecording && (
                      <div className="h-2 w-2 animate-pulse-slow rounded-full bg-red-500"></div>
                    )}
                    <div className="text-sm font-semibold text-purple-400">
                      {isRecording ? 'Recording' : 'Paused'}
                    </div>
                  </div>
                  <div className="text-xs text-white/40">
                    {transcriptLines.length} {transcriptLines.length === 1 ? 'line' : 'lines'}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-1 overflow-hidden">
            <div style={{ width: transcriptWidth }} className="h-full overflow-hidden">
              <JaimeTranscript transcriptLines={transcriptLines} />
            </div>
            <div style={{ width: browserWidth }} className="h-full animate-slide-in">
              <BrowserPanel
                url={currentUrl}
                onClose={closeUrl}
                displaySettings={{
                  holdTime: 0,
                  scrollSpeed: 0,
                  splitPercentage: 50,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Audio error banner */}
      {audioError && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 animate-fade-in">
          <div className="max-w-md rounded-lg border border-red-500/30 bg-red-900/90 p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 flex-shrink-0 text-red-300"
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
              <div className="flex-1">
                <h3 className="mb-1 text-sm font-semibold text-red-200">Microphone Error</h3>
                <p className="text-sm text-red-300">{audioError}</p>
              </div>
              <button
                onClick={() => setAudioError(null)}
                className="flex-shrink-0 text-red-300 hover:text-red-100"
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
        </div>
      )}

      {/* Audio Capture (headless) */}
      <AudioCapture
        onTranscript={handleTranscript}
        isRecording={isRecording}
        onConnectionStatusChange={setConnectionStatus}
        onError={handleAudioError}
      />

      {/* Controls */}
      <JaimeControls
        isRecording={isRecording}
        onToggleRecording={handleToggleRecording}
        privacyMode={privacyMode}
        onTogglePrivacyMode={handleTogglePrivacyMode}
        sensitivity={sensitivity}
        onChangeSensitivity={setSensitivity}
        connectionStatus={connectionStatus}
        onEndSession={handleEndSession}
      />
    </>
  );
}
