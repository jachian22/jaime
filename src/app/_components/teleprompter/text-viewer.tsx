"use client";

import { useEffect, useMemo, useRef } from "react";
import { tokenizeScript, classifyToken } from "@/utils/text-processing";

interface TextViewerProps {
  scriptText: string;
  currentWordIndex: number;
}

export function TextViewer({ scriptText, currentWordIndex }: TextViewerProps) {
  const tokens = useMemo(() => tokenizeScript(scriptText), [scriptText]);
  const currentWordRef = useRef<HTMLSpanElement>(null);

  // Auto-scroll to keep current word visible
  useEffect(() => {
    if (currentWordRef.current) {
      currentWordRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentWordIndex]);

  return (
    <div className="flex h-full min-h-screen items-center justify-center overflow-y-auto p-8">
      <div className="max-w-4xl text-2xl leading-relaxed text-white">
        {tokens.map((token, index) => (
          <span
            key={index}
            ref={index === currentWordIndex ? currentWordRef : null}
            className={classifyToken(index, currentWordIndex)}
          >
            {token}
          </span>
        ))}
      </div>
    </div>
  );
}
