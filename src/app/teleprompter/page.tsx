"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TextViewer } from "@/app/_components/teleprompter/text-viewer";
import { BrowserPanel } from "@/app/_components/teleprompter/browser-panel";
import { ControlBar } from "@/app/_components/teleprompter/control-bar";
import { AudioCapture } from "@/app/_components/teleprompter/audio-capture";
import { WordMatcher } from "@/utils/word-matcher";
import { useAIToolCalling } from "@/hooks/use-ai-tool-calling";

const STORAGE_KEYS = {
  SCRIPT_TEXT: "teleprompter_script",
  CURRENT_INDEX: "teleprompter_index",
};

export default function TeleprompterPage() {
  const router = useRouter();
  const [scriptText, setScriptText] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [browserUrl, setBrowserUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentTranscript, setRecentTranscript] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'ready' | 'closed'>('closed');
  const matcherRef = useRef<WordMatcher | null>(null);

  // Load script and current index on mount
  useEffect(() => {
    const savedScript = localStorage.getItem(STORAGE_KEYS.SCRIPT_TEXT);
    const savedIndex = sessionStorage.getItem(STORAGE_KEYS.CURRENT_INDEX);

    if (!savedScript) {
      // No script found, redirect to home
      router.push("/");
      return;
    }

    setScriptText(savedScript);
    if (savedIndex) {
      setCurrentWordIndex(parseInt(savedIndex, 10));
    }
    setIsLoading(false);
  }, [router]);

  // Save current index to sessionStorage
  useEffect(() => {
    if (!isLoading) {
      sessionStorage.setItem(
        STORAGE_KEYS.CURRENT_INDEX,
        currentWordIndex.toString()
      );
    }
  }, [currentWordIndex, isLoading]);

  // Initialize WordMatcher when script loads
  useEffect(() => {
    if (scriptText && !matcherRef.current) {
      matcherRef.current = new WordMatcher(scriptText, currentWordIndex);
    }
  }, [scriptText, currentWordIndex]);

  const handleBackToEdit = () => {
    setIsRecording(false);
    router.push("/");
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleReset = () => {
    setCurrentWordIndex(0);
    setIsRecording(false);
    setBrowserUrl(null);
  };

  const handleManualAdvance = () => {
    setCurrentWordIndex((prev) => prev + 1);
  };

  const handleManualRewind = () => {
    setCurrentWordIndex((prev) => Math.max(0, prev - 1));
  };

  const handleCloseBrowser = () => {
    setBrowserUrl(null);
  };

  const handleTranscript = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (!matcherRef.current) return;

      console.log(
        `[Transcript] ${isFinal ? "FINAL" : "interim"}:`,
        transcript
      );

      // OPTIMIZATION: Skip word matching on interim results
      // This eliminates 3-5 expensive matching operations per second
      if (!isFinal) {
        return; // Just log it, don't process
      }

      // Only run expensive matching on final results
      const result = matcherRef.current.processTranscript(transcript, true);

      if (result.matched) {
        console.log(
          `[Match] Confidence: ${(result.confidence * 100).toFixed(0)}% | New index: ${result.newIndex}`
        );
        setCurrentWordIndex(result.newIndex);
      } else {
        console.log("[No Match] Could not find matching words in script");
      }

      setRecentTranscript((prev) => (prev + " " + transcript).slice(-500));
    },
    []
  );

  // AI tool calling - automatically open browser when context warrants
  // DISABLED FOR NOW - focusing on Deepgram integration first
  // useAIToolCalling({
  //   scriptText,
  //   currentWordIndex,
  //   recentTranscript,
  //   onToolCall: (url, context) => {
  //     setBrowserUrl(url);
  //     console.log("[AI] Opening browser:", context);
  //   },
  //   enabled: isRecording,
  // });

  // Show loading state while checking for script
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {browserUrl === null ? (
        // Fullscreen mode
        <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] pb-24">
          <TextViewer
            scriptText={scriptText}
            currentWordIndex={currentWordIndex}
          />
        </div>
      ) : (
        // Split-screen mode
        <div className="flex min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] pb-24">
          <div className="w-1/2 border-r border-white/10">
            <TextViewer
              scriptText={scriptText}
              currentWordIndex={currentWordIndex}
            />
          </div>
          <div className="w-1/2">
            <BrowserPanel url={browserUrl} onClose={handleCloseBrowser} />
          </div>
        </div>
      )}

      <AudioCapture
        onTranscript={handleTranscript}
        isRecording={isRecording}
        onConnectionStatusChange={setConnectionStatus}
      />

      <ControlBar
        isRecording={isRecording}
        onToggleRecording={handleToggleRecording}
        onReset={handleReset}
        onBackToEdit={handleBackToEdit}
        currentWordIndex={currentWordIndex}
        onManualAdvance={handleManualAdvance}
        onManualRewind={handleManualRewind}
        connectionStatus={connectionStatus}
      />
    </>
  );
}
