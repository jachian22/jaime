"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TextViewer } from "@/app/_components/teleprompter/text-viewer";
import { BrowserPanel } from "@/app/_components/teleprompter/browser-panel";
import { ControlBar } from "@/app/_components/teleprompter/control-bar";
import { AudioCapture } from "@/app/_components/teleprompter/audio-capture";
import { FastWordMatcher } from "@/utils/fast-word-matcher";
import { useAIToolCalling } from "@/hooks/use-ai-tool-calling";
import { useUrlQueue } from "@/hooks/use-url-queue";

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
  const [completedSentence, setCompletedSentence] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'ready' | 'closed'>('closed');
  const matcherRef = useRef<FastWordMatcher | null>(null);
  const sentenceBufferRef = useRef<string>("");

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

  // Initialize FastWordMatcher when script loads
  useEffect(() => {
    if (scriptText && !matcherRef.current) {
      matcherRef.current = new FastWordMatcher(scriptText, currentWordIndex);
    }
  }, [scriptText, currentWordIndex]);

  const handleBackToEdit = () => {
    setIsRecording(false);
    router.push("/");
  };

  const handleGoToConfig = () => {
    setIsRecording(false);
    router.push("/config");
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

      const words = transcript.toLowerCase().split(/\s+/).filter(w => w.length > 0);

      if (isFinal) {
        // Use phrase matching with position correction for final transcripts
        // This corrects any jumps that happened from interim results
        const newIndex = matcherRef.current.processFinalTranscript(words);
        if (newIndex !== null) {
          setCurrentWordIndex(newIndex);
          console.log(`[Match] Final phrase (${words.join(' ')}) → Index ${newIndex}`);
        } else {
          console.log(`[No Match] Could not match final: "${words.join(' ')}"`);
        }
        setRecentTranscript((prev) => (prev + " " + transcript).slice(-500));

        // Sentence boundary detection for AI tool calling
        sentenceBufferRef.current += " " + transcript;

        // Check if sentence ended (. ! ?)
        if (/[.!?]\s*$/.test(transcript)) {
          const completeSentence = sentenceBufferRef.current.trim();
          console.log("[Sentence Complete]", completeSentence);
          setCompletedSentence(completeSentence);
          sentenceBufferRef.current = ""; // Reset buffer
        }
      } else {
        // For interim transcripts, only process the LAST word
        // This prevents premature greying from processing accumulated words
        const lastWord = words[words.length - 1];
        if (lastWord) {
          const newIndex = matcherRef.current.processWord(lastWord);
          if (newIndex !== null) {
            setCurrentWordIndex(newIndex);
            console.log(`[Match] Interim word "${lastWord}" → Index ${newIndex}`);
          }
        }
      }
    },
    []
  );

  // Handle URL triggers (both from AI and configured URLs)
  const handleUrlTrigger = useCallback((url: string, relevance: string, category: string) => {
    setBrowserUrl(url);
    console.log(`[URL Trigger] Opening ${category}:`, url, "-", relevance);
  }, []);

  // AI tool calling - automatically open browser when context warrants
  // Triggers on sentence completion (non-blocking)
  useAIToolCalling({
    scriptText,
    currentWordIndex,
    recentTranscript,
    completedSentence,
    onToolCall: handleUrlTrigger,
    enabled: isRecording,
  });

  // URL queue - configured URLs that trigger based on passages or phrases
  const { triggerNextInQueue, hasNextInQueue, queueIndex, totalInQueue } = useUrlQueue({
    currentWordIndex,
    recentTranscript,
    enabled: isRecording,
    onUrlTrigger: handleUrlTrigger,
  });

  // Show loading state while checking for script
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black to-zinc-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {browserUrl === null ? (
        // Fullscreen mode
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 pb-24">
          <TextViewer
            scriptText={scriptText}
            currentWordIndex={currentWordIndex}
          />
        </div>
      ) : (
        // Split-screen mode
        <div className="flex min-h-screen bg-gradient-to-b from-black to-zinc-900 pb-24">
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
        onGoToConfig={handleGoToConfig}
        currentWordIndex={currentWordIndex}
        onManualAdvance={handleManualAdvance}
        onManualRewind={handleManualRewind}
        connectionStatus={connectionStatus}
        onNextUrl={triggerNextInQueue}
        hasNextUrl={hasNextInQueue}
        queueInfo={totalInQueue > 0 ? `Queue: ${queueIndex + 1}/${totalInQueue}` : undefined}
      />
    </>
  );
}
