"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PassageBasedUrl, StandaloneUrl, UrlConfigState } from "@/types/url-config";

const STORAGE_KEY = "teleprompter_script";
const CONFIG_STORAGE_KEY = "teleprompter_url_config";

export default function ConfigPage() {
  const router = useRouter();
  const [scriptText, setScriptText] = useState("");

  // Selection state
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  // URL configuration state
  const [passageUrls, setPassageUrls] = useState<PassageBasedUrl[]>([]);
  const [standaloneUrls, setStandaloneUrls] = useState<StandaloneUrl[]>([]);
  const [queue, setQueue] = useState<string[]>([]);

  // UI state
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [showStandaloneDialog, setShowStandaloneDialog] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentCategory, setCurrentCategory] = useState<"documentation" | "tutorial" | "reference" | "article">("documentation");
  const [currentRelevance, setCurrentRelevance] = useState("");
  const [currentTriggerPhrase, setCurrentTriggerPhrase] = useState("");

  // Load script from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setScriptText(saved);
    } else {
      router.push("/");
    }

    // Load existing config if any
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (savedConfig) {
      const config = JSON.parse(savedConfig) as UrlConfigState;
      setPassageUrls(config.passageUrls);
      setStandaloneUrls(config.standaloneUrls);
      setQueue(config.queue);
    }
  }, [router]);

  // Save config to localStorage
  useEffect(() => {
    if (passageUrls.length > 0 || standaloneUrls.length > 0 || queue.length > 0) {
      const config: UrlConfigState = {
        passageUrls,
        standaloneUrls,
        queue
      };
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    }
  }, [passageUrls, standaloneUrls, queue]);

  const handleCaptureSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !scriptText) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (!selectedText.trim()) return;

    // Get character positions
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;

    // Convert character positions to word indices
    const words = scriptText.split(/\s+/);
    let charCount = 0;
    let wordStartIndex = 0;
    let wordEndIndex = 0;
    let foundStart = false;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word) continue;

      const wordStart = charCount;
      const wordEnd = charCount + word.length;

      if (!foundStart && wordEnd > startOffset) {
        wordStartIndex = i;
        foundStart = true;
      }

      if (foundStart && wordStart < endOffset) {
        wordEndIndex = i;
      }

      charCount = wordEnd + 1; // +1 for space
    }

    setSelectionStart(wordStartIndex);
    setSelectionEnd(wordEndIndex);
  };

  const handleAddPassageUrl = () => {
    handleCaptureSelection();
    if (selectionStart === null || selectionEnd === null) return;
    setShowUrlDialog(true);
  };

  const handleSavePassageUrl = () => {
    if (selectionStart === null || selectionEnd === null || !currentUrl) return;

    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);

    const newUrl: PassageBasedUrl = {
      id: crypto.randomUUID(),
      type: 'passage',
      startWordIndex: start,
      endWordIndex: end,
      url: currentUrl,
      category: currentCategory,
      relevance: currentRelevance
    };

    setPassageUrls([...passageUrls, newUrl]);
    setQueue([...queue, newUrl.id]);

    // Reset
    setSelectionStart(null);
    setSelectionEnd(null);
    setShowUrlDialog(false);
    setCurrentUrl("");
    setCurrentRelevance("");
  };

  const handleSaveStandaloneUrl = () => {
    if (!currentUrl || !currentTriggerPhrase) return;

    const newUrl: StandaloneUrl = {
      id: crypto.randomUUID(),
      type: 'standalone',
      triggerPhrase: currentTriggerPhrase,
      url: currentUrl,
      category: currentCategory,
      relevance: currentRelevance
    };

    setStandaloneUrls([...standaloneUrls, newUrl]);
    setQueue([...queue, newUrl.id]);

    // Reset
    setShowStandaloneDialog(false);
    setCurrentUrl("");
    setCurrentRelevance("");
    setCurrentTriggerPhrase("");
  };

  const handleRemoveUrl = (id: string) => {
    setPassageUrls(passageUrls.filter(u => u.id !== id));
    setStandaloneUrls(standaloneUrls.filter(u => u.id !== id));
    setQueue(queue.filter(qId => qId !== id));
  };

  const handleReorderQueue = (id: string, direction: 'up' | 'down') => {
    const currentIndex = queue.indexOf(id);
    if (currentIndex === -1) return;

    const newQueue = [...queue];
    if (direction === 'up' && currentIndex > 0) {
      [newQueue[currentIndex - 1], newQueue[currentIndex]] = [newQueue[currentIndex]!, newQueue[currentIndex - 1]!];
    } else if (direction === 'down' && currentIndex < newQueue.length - 1) {
      [newQueue[currentIndex], newQueue[currentIndex + 1]] = [newQueue[currentIndex + 1]!, newQueue[currentIndex]!];
    }
    setQueue(newQueue);
  };

  const loadTestData = () => {
    const testPassageUrls: PassageBasedUrl[] = [
      {
        id: "test-1",
        type: "passage",
        startWordIndex: 0,
        endWordIndex: 10,
        url: "https://react.dev",
        category: "documentation",
        relevance: "React official documentation"
      },
      {
        id: "test-2",
        type: "passage",
        startWordIndex: 20,
        endWordIndex: 30,
        url: "https://nextjs.org/docs",
        category: "documentation",
        relevance: "Next.js documentation"
      }
    ];

    const testStandaloneUrls: StandaloneUrl[] = [
      {
        id: "test-3",
        type: "standalone",
        triggerPhrase: "typescript",
        url: "https://www.typescriptlang.org/docs/",
        category: "documentation",
        relevance: "TypeScript documentation"
      },
      {
        id: "test-4",
        type: "standalone",
        triggerPhrase: "tailwind",
        url: "https://tailwindcss.com/docs",
        category: "documentation",
        relevance: "Tailwind CSS documentation"
      }
    ];

    const testQueue = ["test-1", "test-2", "test-3", "test-4"];

    setPassageUrls(testPassageUrls);
    setStandaloneUrls(testStandaloneUrls);
    setQueue(testQueue);
  };

  const startTeleprompter = () => {
    const config: UrlConfigState = {
      passageUrls,
      standaloneUrls,
      queue
    };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    router.push("/teleprompter");
  };

  const allUrls = [...passageUrls, ...standaloneUrls];
  const queuedUrls = queue.map(id => allUrls.find(u => u.id === id)).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Configure Tool Calls</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Edit Script
            </button>
            <button
              onClick={startTeleprompter}
              className="rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Start Teleprompter
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Script Text Viewer */}
        <div className="flex-1 p-8">
          <div className="mx-auto max-w-4xl">
            <div className="sticky top-16 z-40 mb-4 rounded-lg bg-zinc-900/95 p-4 backdrop-blur-sm">
              <p className="mb-3 text-sm text-white/60">
                Highlight text by clicking and dragging, then click &quot;Add URL for Selection&quot;.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAddPassageUrl}
                  className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Add URL for Selection
                </button>
                <button
                  onClick={() => setShowStandaloneDialog(true)}
                  className="rounded-full bg-green-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Add Standalone URL
                </button>
                <button
                  onClick={() => {
                    setSelectionStart(null);
                    setSelectionEnd(null);
                    window.getSelection()?.removeAllRanges();
                  }}
                  className="rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Clear Selection
                </button>
                <button
                  onClick={loadTestData}
                  className="rounded-full bg-yellow-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-yellow-700"
                >
                  Load Test Data
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-8">
              <div className="select-text space-y-4 text-2xl leading-relaxed text-white">
                {scriptText}
              </div>
            </div>
          </div>
        </div>

        {/* URL Queue Panel */}
        <div className="w-96 border-l border-white/10 bg-black/40 p-6">
          <h2 className="mb-4 text-xl font-bold text-white">URL Queue</h2>

          {queuedUrls.length === 0 ? (
            <p className="text-sm text-white/50">No URLs configured yet</p>
          ) : (
            <div className="space-y-3">
              {queuedUrls.map((urlConfig, index) => {
                if (!urlConfig) return null;

                return (
                  <div key={urlConfig.id} className="rounded-lg bg-white/5 p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-semibold text-purple-400">
                            {urlConfig.category.toUpperCase()}
                          </span>
                          <span className="text-xs text-white/40">#{index + 1}</span>
                        </div>
                        {urlConfig.type === 'passage' ? (
                          <p className="text-xs text-white/60">
                            Words {urlConfig.startWordIndex}-{urlConfig.endWordIndex}
                          </p>
                        ) : (
                          <p className="text-xs text-white/60">
                            Trigger: &quot;{urlConfig.triggerPhrase}&quot;
                          </p>
                        )}
                        <p className="mt-1 text-sm text-white">{urlConfig.url}</p>
                        {urlConfig.relevance && (
                          <p className="mt-1 text-xs text-white/50">{urlConfig.relevance}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleReorderQueue(urlConfig.id, 'up')}
                          disabled={index === 0}
                          className="text-white/50 hover:text-white disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleReorderQueue(urlConfig.id, 'down')}
                          disabled={index === queuedUrls.length - 1}
                          className="text-white/50 hover:text-white disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUrl(urlConfig.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Passage URL Dialog */}
      {showUrlDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-lg rounded-xl bg-zinc-900 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">Add URL for Selected Passage</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">URL</label>
                <input
                  type="url"
                  value={currentUrl}
                  onChange={(e) => setCurrentUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Category</label>
                <select
                  value={currentCategory}
                  onChange={(e) => setCurrentCategory(e.target.value as typeof currentCategory)}
                  className="w-full rounded-lg bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="documentation">Documentation</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="reference">Reference</option>
                  <option value="article">Article</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Relevance (optional)
                </label>
                <textarea
                  value={currentRelevance}
                  onChange={(e) => setCurrentRelevance(e.target.value)}
                  placeholder="Why is this URL relevant?"
                  className="w-full rounded-lg bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSavePassageUrl}
                  className="flex-1 rounded-full bg-purple-600 px-6 py-2 font-semibold text-white transition hover:bg-purple-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowUrlDialog(false);
                    setCurrentUrl("");
                    setCurrentRelevance("");
                  }}
                  className="flex-1 rounded-full bg-white/10 px-6 py-2 font-semibold text-white transition hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Standalone URL Dialog */}
      {showStandaloneDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-lg rounded-xl bg-zinc-900 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">Add Standalone URL</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Trigger Phrase
                </label>
                <input
                  type="text"
                  value={currentTriggerPhrase}
                  onChange={(e) => setCurrentTriggerPhrase(e.target.value)}
                  placeholder="Phrase that triggers this URL"
                  className="w-full rounded-lg bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">URL</label>
                <input
                  type="url"
                  value={currentUrl}
                  onChange={(e) => setCurrentUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Category</label>
                <select
                  value={currentCategory}
                  onChange={(e) => setCurrentCategory(e.target.value as typeof currentCategory)}
                  className="w-full rounded-lg bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="documentation">Documentation</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="reference">Reference</option>
                  <option value="article">Article</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Relevance (optional)
                </label>
                <textarea
                  value={currentRelevance}
                  onChange={(e) => setCurrentRelevance(e.target.value)}
                  placeholder="Why is this URL relevant?"
                  className="w-full rounded-lg bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveStandaloneUrl}
                  className="flex-1 rounded-full bg-green-600 px-6 py-2 font-semibold text-white transition hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowStandaloneDialog(false);
                    setCurrentUrl("");
                    setCurrentRelevance("");
                    setCurrentTriggerPhrase("");
                  }}
                  className="flex-1 rounded-full bg-white/10 px-6 py-2 font-semibold text-white transition hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
