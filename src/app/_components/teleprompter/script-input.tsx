"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "teleprompter_script";

export function ScriptInput() {
  const router = useRouter();
  const [scriptText, setScriptText] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setScriptText(saved);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (scriptText) {
      localStorage.setItem(STORAGE_KEY, scriptText);
    }
  }, [scriptText]);

  const handleStartSession = () => {
    if (scriptText.trim()) {
      localStorage.setItem(STORAGE_KEY, scriptText);
      router.push("/config");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-black to-zinc-900 px-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Voice-Aware <span className="text-[hsl(280,100%,70%)]">Teleprompter</span>
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Paste your script below to get started
          </p>
        </div>

        <div className="space-y-4">
          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder="Paste your script here..."
            className="min-h-[400px] w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)]"
          />

          <button
            onClick={handleStartSession}
            disabled={!scriptText.trim()}
            className="w-full rounded-full bg-white/10 px-10 py-3 font-semibold text-white transition hover:bg-white/20 disabled:opacity-50 disabled:hover:bg-white/10"
          >
            Configure Tool Calls
          </button>
        </div>
      </div>
    </div>
  );
}
