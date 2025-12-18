"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TextViewer } from "@/app/_components/teleprompter/text-viewer";
import { BrowserPanel } from "@/app/_components/teleprompter/browser-panel";
import { ControlBar } from "@/app/_components/teleprompter/control-bar";

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

  const handleBackToEdit = () => {
    setIsRecording(false);
    router.push("/");
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement Deepgram integration
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

  // Demo: Open browser after some time (for testing)
  useEffect(() => {
    if (currentWordIndex === 20 && browserUrl === null) {
      // Example: trigger browser at word 20
      setBrowserUrl("https://example.com");
    }
  }, [currentWordIndex, browserUrl]);

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

      <ControlBar
        isRecording={isRecording}
        onToggleRecording={handleToggleRecording}
        onReset={handleReset}
        onBackToEdit={handleBackToEdit}
        currentWordIndex={currentWordIndex}
        onManualAdvance={handleManualAdvance}
        onManualRewind={handleManualRewind}
      />
    </>
  );
}
