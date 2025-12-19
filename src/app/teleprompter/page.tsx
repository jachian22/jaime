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
import type { UrlConfigState, WebpageDisplaySettings } from "@/types/url-config";

const STORAGE_KEYS = {
  SCRIPT_TEXT: "teleprompter_script",
  CURRENT_INDEX: "teleprompter_index",
  URL_CONFIG: "teleprompter_url_config",
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
  const [displaySettings, setDisplaySettings] = useState<WebpageDisplaySettings>({
    holdTime: 2,
    scrollSpeed: 50,
    splitPercentage: 50
  });
  const [isFirstReveal, setIsFirstReveal] = useState(true);
  const [hasConfiguredUrls, setHasConfiguredUrls] = useState(false);
  const matcherRef = useRef<FastWordMatcher | null>(null);
  const sentenceBufferRef = useRef<string>("");

  // Load script, current index, and display settings on mount
  useEffect(() => {
    const savedScript = localStorage.getItem(STORAGE_KEYS.SCRIPT_TEXT);
    const savedIndex = sessionStorage.getItem(STORAGE_KEYS.CURRENT_INDEX);
    const savedConfig = localStorage.getItem(STORAGE_KEYS.URL_CONFIG);

    if (!savedScript) {
      // No script found, redirect to home
      router.push("/");
      return;
    }

    setScriptText(savedScript);
    if (savedIndex) {
      setCurrentWordIndex(parseInt(savedIndex, 10));
    }

    // Load display settings from config and check if URLs are configured
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig) as UrlConfigState;
        setDisplaySettings(config.displaySettings);

        // Check if any URL cards are configured
        const hasUrls = (config.passageUrls?.length ?? 0) > 0 || (config.standaloneUrls?.length ?? 0) > 0;
        setHasConfiguredUrls(hasUrls);

        console.log(`[URL Config] Found ${config.passageUrls?.length ?? 0} passage URLs and ${config.standaloneUrls?.length ?? 0} standalone URLs. AI tool calling ${hasUrls ? 'DISABLED' : 'ENABLED'}`);
      } catch (error) {
        console.error("Failed to parse URL config:", error);
      }
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
  const handleUrlTrigger = useCallback((url: string, relevance: string, title: string) => {
    setBrowserUrl(url);
    console.log(`[URL Trigger] Opening ${title}:`, url, "-", relevance);

    // Mark that we've revealed the browser for the first time
    // This will reset isFirstReveal to false after the animation
    setTimeout(() => {
      setIsFirstReveal(false);
    }, 2000); // Match animation duration
  }, []);

  // AI tool calling - automatically open browser when context warrants
  // Only enabled when NO manual URL cards are configured (manual cards take priority)
  // Triggers on sentence completion (non-blocking)
  useAIToolCalling({
    scriptText,
    currentWordIndex,
    recentTranscript,
    completedSentence,
    onToolCall: handleUrlTrigger,
    enabled: isRecording && !hasConfiguredUrls,
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

  // Calculate dynamic widths based on split percentage
  const teleprompterWidth = browserUrl !== null ? `${100 - displaySettings.splitPercentage}%` : '100%';
  const browserWidth = `${displaySettings.splitPercentage}%`;

  return (
    <>
      {browserUrl === null ? (
        // Fullscreen mode
        <div className="h-screen overflow-y-auto bg-gradient-to-b from-black to-zinc-900 pb-24">
          <TextViewer
            scriptText={scriptText}
            currentWordIndex={currentWordIndex}
          />
        </div>
      ) : (
        // Split-screen mode with independent scroll containers
        <div className="flex h-screen bg-gradient-to-b from-black to-zinc-900">
          <div
            className="h-full border-r border-white/10"
            style={{ width: teleprompterWidth }}
          >
            <TextViewer
              scriptText={scriptText}
              currentWordIndex={currentWordIndex}
            />
          </div>
          <div
            className={`h-full ${isFirstReveal ? 'animate-slide-in' : ''}`}
            style={{ width: browserWidth }}
          >
            <BrowserPanel
              url={browserUrl}
              onClose={handleCloseBrowser}
              displaySettings={displaySettings}
            />
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
