"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PassageBasedUrl, StandaloneUrl, UrlConfigState, WebpageDisplaySettings } from "@/types/url-config";

const STORAGE_KEY = "teleprompter_script";
const CONFIG_STORAGE_KEY = "teleprompter_url_config";

// Normalize URL to ensure it has a protocol
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  // Already has protocol
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Add https:// prefix
  return `https://${trimmed}`;
}

export default function ConfigPage() {
  const router = useRouter();
  const [scriptText, setScriptText] = useState("");

  // Selection state
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  // URL configuration state
  const [passageUrls, setPassageUrls] = useState<PassageBasedUrl[]>([]);
  const [standaloneUrls, setStandaloneUrls] = useState<StandaloneUrl[]>([]);
  const [displaySettings, setDisplaySettings] = useState<WebpageDisplaySettings>({
    holdTime: 2,
    scrollSpeed: 50,
    splitPercentage: 50
  });
  const [aiToolCallingEnabled, setAiToolCallingEnabled] = useState<boolean>(!scriptText);

  // UI state
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [showStandaloneDialog, setShowStandaloneDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [currentTitle, setCurrentTitle] = useState<string>("");
  const [currentRelevance, setCurrentRelevance] = useState<string>("");
  const [currentTriggerPhrase, setCurrentTriggerPhrase] = useState<string>("");
  const [currentSelectedText, setCurrentSelectedText] = useState<string>("");

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
      setPassageUrls(config.passageUrls ?? []);
      setStandaloneUrls(config.standaloneUrls ?? []);
      if (config.displaySettings) {
        setDisplaySettings(config.displaySettings);
      }
      // Default: AI enabled if no script, disabled if script exists
      const defaultAiEnabled = !saved;
      setAiToolCallingEnabled(config.aiToolCallingEnabled ?? defaultAiEnabled);
    }
  }, [router]);

  // Save config to localStorage
  useEffect(() => {
    const config: UrlConfigState = {
      passageUrls,
      standaloneUrls,
      displaySettings,
      aiToolCallingEnabled
    };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  }, [passageUrls, standaloneUrls, displaySettings, aiToolCallingEnabled]);

  const handleCaptureSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !scriptText) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();

    if (!selectedText) return;

    // Store the selected text
    setCurrentSelectedText(selectedText);

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
    return { wordStartIndex, wordEndIndex, selectedText };
  };

  const handleAddPassageUrl = () => {
    const result = handleCaptureSelection();
    if (!result) return;

    // If editingId is set, we're reselecting text for an existing URL
    // Keep editingId and reopen the dialog with the new selection
    if (!editingId) {
      setEditingId(null); // Clear editing mode only if not reselecting
    }
    setShowUrlDialog(true);
  };

  const handleEditUrl = (urlConfig: PassageBasedUrl | StandaloneUrl) => {
    setEditingId(urlConfig.id);
    setCurrentUrl(urlConfig.url || "");
    setCurrentTitle(urlConfig.title || "");
    setCurrentRelevance(urlConfig.relevance || "");

    if (urlConfig.type === 'passage') {
      setCurrentSelectedText(urlConfig.selectedText || "");
      setSelectionStart(urlConfig.startWordIndex);
      setSelectionEnd(urlConfig.endWordIndex);
      setShowUrlDialog(true);
    } else {
      setCurrentTriggerPhrase(urlConfig.triggerPhrase || "");
      setShowStandaloneDialog(true);
    }
  };

  const handleSavePassageUrl = () => {
    if (selectionStart === null || selectionEnd === null || !currentUrl || !currentTitle) return;

    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);
    const normalizedUrl = normalizeUrl(currentUrl);

    if (editingId) {
      // Update existing URL
      setPassageUrls(passageUrls.map(u =>
        u.id === editingId
          ? {
              ...u,
              startWordIndex: start,
              endWordIndex: end,
              selectedText: currentSelectedText,
              url: normalizedUrl,
              title: currentTitle,
              relevance: currentRelevance
            }
          : u
      ));
    } else {
      // Add new URL with next queue position
      const allUrls = [...passageUrls, ...standaloneUrls];
      const maxPosition = allUrls.reduce((max, u) => Math.max(max, u.queuePosition), -1);

      const newUrl: PassageBasedUrl = {
        id: crypto.randomUUID(),
        type: 'passage',
        startWordIndex: start,
        endWordIndex: end,
        selectedText: currentSelectedText,
        url: normalizedUrl,
        title: currentTitle,
        relevance: currentRelevance,
        queuePosition: maxPosition + 1
      };

      setPassageUrls([...passageUrls, newUrl]);
    }

    // Reset
    resetDialog();
  };

  const resetDialog = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setShowUrlDialog(false);
    setShowStandaloneDialog(false);
    setEditingId(null);
    setCurrentUrl("");
    setCurrentTitle("");
    setCurrentRelevance("");
    setCurrentTriggerPhrase("");
    setCurrentSelectedText("");
    window.getSelection()?.removeAllRanges();
  };

  const handleSaveStandaloneUrl = () => {
    if (!currentUrl || !currentTriggerPhrase || !currentTitle) return;

    const normalizedUrl = normalizeUrl(currentUrl);

    if (editingId) {
      // Update existing URL
      setStandaloneUrls(standaloneUrls.map(u =>
        u.id === editingId
          ? {
              ...u,
              triggerPhrase: currentTriggerPhrase,
              url: normalizedUrl,
              title: currentTitle,
              relevance: currentRelevance
            }
          : u
      ));
    } else {
      // Add new URL with next queue position
      const allUrls = [...passageUrls, ...standaloneUrls];
      const maxPosition = allUrls.reduce((max, u) => Math.max(max, u.queuePosition), -1);

      const newUrl: StandaloneUrl = {
        id: crypto.randomUUID(),
        type: 'standalone',
        triggerPhrase: currentTriggerPhrase,
        url: normalizedUrl,
        title: currentTitle,
        relevance: currentRelevance,
        queuePosition: maxPosition + 1
      };

      setStandaloneUrls([...standaloneUrls, newUrl]);
    }

    // Reset
    resetDialog();
  };

  const handleRemoveUrl = (id: string) => {
    setPassageUrls(passageUrls.filter(u => u.id !== id));
    setStandaloneUrls(standaloneUrls.filter(u => u.id !== id));
  };

  // Drag and drop handlers for combined queue
  const handleDragStart = (e: React.DragEvent, url: PassageBasedUrl | StandaloneUrl) => {
    // Only allow dragging standalones
    if (url.type === 'passage') {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: url.id, type: url.type }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetUrl: PassageBasedUrl | StandaloneUrl, targetVisualIndex: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    const { id: draggedId, type: draggedType } = JSON.parse(data) as { id: string; type: 'passage' | 'standalone' };

    // Only allow dragging standalones (passages are locked in script order)
    if (draggedType === 'passage') {
      console.log("[Drag-Drop] Cannot drag passages - they're locked in script order");
      return;
    }

    if (draggedId === targetUrl.id) return;

    // Get current combined queue (without the dragged item)
    const currentCombined = combinedQueue.filter(u => u.id !== draggedId);

    // Calculate the queuePosition for the dropped standalone
    // We want to insert it at targetVisualIndex in the queue without the dragged item
    let newQueuePosition: number;

    if (targetVisualIndex === 0) {
      // Dropping at the very start
      const firstCard = currentCombined[0];
      if (firstCard?.type === 'passage') {
        // Before first passage (which is at position 0)
        newQueuePosition = -100;
      } else if (firstCard) {
        // Before first standalone
        newQueuePosition = firstCard.queuePosition - 100;
      } else {
        newQueuePosition = 0;
      }
    } else if (targetVisualIndex >= currentCombined.length) {
      // Dropping at the very end
      const lastCard = currentCombined[currentCombined.length - 1];
      if (lastCard?.type === 'passage') {
        const passageIndex = passageUrls.filter(p => p.startWordIndex <= lastCard.startWordIndex).length - 1;
        newQueuePosition = (passageIndex + 1) * 1000;
      } else if (lastCard) {
        newQueuePosition = lastCard.queuePosition + 100;
      } else {
        newQueuePosition = 0;
      }
    } else {
      // Dropping between two cards
      const beforeCard = currentCombined[targetVisualIndex - 1];
      const afterCard = currentCombined[targetVisualIndex];

      if (!beforeCard || !afterCard) {
        // Fallback to end position
        newQueuePosition = currentCombined.length * 1000;
      } else {
        const beforePos = beforeCard.type === 'passage'
          ? passageUrls.filter(p => p.startWordIndex <= beforeCard.startWordIndex).length * 1000 - 1000
          : beforeCard.queuePosition;

        const afterPos = afterCard.type === 'passage'
          ? passageUrls.filter(p => p.startWordIndex <= afterCard.startWordIndex).length * 1000 - 1000
          : afterCard.queuePosition;

        // Place in the middle
        newQueuePosition = (beforePos + afterPos) / 2;
      }
    }

    // Update the standalone with the new queuePosition
    const updatedStandalones = standaloneUrls.map(s =>
      s.id === draggedId ? { ...s, queuePosition: newQueuePosition } : s
    );

    setStandaloneUrls(updatedStandalones);
    console.log(`[Drag-Drop] Moved standalone to position ${newQueuePosition}`);
  };

  const loadTestData = () => {
    // Get first 10 words and words 20-30 from script for testing
    const words = scriptText.split(/\s+/).filter(w => w.length > 0);
    const firstSelection = words.slice(0, Math.min(10, words.length)).join(' ');
    const secondSelection = words.slice(20, Math.min(30, words.length)).join(' ');

    const testPassageUrls: PassageBasedUrl[] = [
      {
        id: "test-1",
        type: "passage",
        startWordIndex: 0,
        endWordIndex: 9,
        selectedText: firstSelection,
        url: "https://react.dev",
        title: "React Documentation",
        relevance: "React official documentation",
        queuePosition: 0
      },
      {
        id: "test-2",
        type: "passage",
        startWordIndex: 20,
        endWordIndex: 29,
        selectedText: secondSelection,
        url: "https://nextjs.org/docs",
        title: "Next.js Documentation",
        relevance: "Next.js documentation",
        queuePosition: 2
      }
    ];

    const testStandaloneUrls: StandaloneUrl[] = [
      {
        id: "test-3",
        type: "standalone",
        triggerPhrase: "typescript",
        url: "https://www.typescriptlang.org/docs/",
        title: "TypeScript Docs",
        relevance: "TypeScript documentation",
        queuePosition: 1
      },
      {
        id: "test-4",
        type: "standalone",
        triggerPhrase: "tailwind",
        url: "https://tailwindcss.com/docs",
        title: "Tailwind CSS Docs",
        relevance: "Tailwind CSS documentation",
        queuePosition: 3
      }
    ];

    setPassageUrls(testPassageUrls);
    setStandaloneUrls(testStandaloneUrls);
  };

  const startTeleprompter = () => {
    const config: UrlConfigState = {
      passageUrls,
      standaloneUrls,
      displaySettings
    };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    router.push("/teleprompter");
  };

  // Combined queue: passages sorted by script order (locked), standalones freely positioned
  // Each standalone has a queuePosition representing its visual position in the full queue
  const combinedQueue = (() => {
    const sortedPassages = [...passageUrls].sort((a, b) => a.startWordIndex - b.startWordIndex);

    // Create array of all cards with a sort key
    const allCards: Array<{card: PassageBasedUrl | StandaloneUrl; sortKey: number}> = [
      // Passages use their script position as base, multiplied to leave room for standalones
      ...sortedPassages.map((p, index) => ({
        card: p,
        sortKey: index * 1000 // Large gap to insert standalones between
      })),
      // Standalones use their queuePosition directly
      ...standaloneUrls.map(s => ({
        card: s,
        sortKey: s.queuePosition
      }))
    ];

    // Sort by the sort key
    allCards.sort((a, b) => a.sortKey - b.sortKey);

    return allCards.map(item => item.card);
  })();

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
        <div className="w-96 border-l border-white/10 bg-black/40 p-6 overflow-y-auto">
          <h2 className="mb-4 text-xl font-bold text-white">Manual Queue</h2>
          <p className="mb-4 text-xs text-white/50">Drag to reorder for manual &quot;Next&quot; button</p>

          {/* Display Settings */}
          <div className="mb-6 rounded-lg bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 flex items-center justify-between text-xs text-white/70">
                  <span>AI Agentic Search</span>
                  <button
                    onClick={() => setAiToolCallingEnabled(!aiToolCallingEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      aiToolCallingEnabled ? 'bg-purple-600' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        aiToolCallingEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
                <p className="mt-1 text-xs text-white/40">
                  When enabled, AI automatically opens relevant webpages during presentation
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/70">Webpage Width (%)</label>
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={displaySettings.splitPercentage}
                  onChange={(e) => setDisplaySettings({...displaySettings, splitPercentage: Number(e.target.value)})}
                  className="w-full rounded bg-white/10 px-2 py-1 text-sm text-white"
                />
                <p className="mt-1 text-xs text-white/40">Controls how much screen space the webpage takes (teleprompter gets the rest)</p>
              </div>
            </div>
          </div>

          {combinedQueue.length === 0 ? (
            <p className="text-sm text-white/50">No URLs configured yet</p>
          ) : (
            <div className="space-y-3">
              {combinedQueue.map((urlConfig, index) => {
                const isPassage = urlConfig.type === 'passage';

                return (
                  <div
                    key={urlConfig.id}
                    draggable={!isPassage}
                    onDragStart={(e) => handleDragStart(e, urlConfig)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, urlConfig, index)}
                    className={isPassage
                      ? "rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 transition"
                      : "rounded-lg bg-green-500/10 border border-green-500/20 p-4 cursor-move hover:bg-green-500/20 transition"
                    }
                  >
                    <div className="mb-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span className={isPassage ? "text-xs font-semibold text-blue-400" : "text-xs font-semibold text-green-400"}>
                          #{index + 1} - {urlConfig.title}
                          {isPassage && <span className="ml-2 text-xs text-white/40">(locked in script order)</span>}
                        </span>
                        <span className="text-xs text-white/40">{!isPassage && '⋮⋮'}</span>
                      </div>
                      {isPassage ? (
                        <>
                          <p className="text-xs text-white/80 italic mb-1">
                            &quot;{'selectedText' in urlConfig ? urlConfig.selectedText : ''}&quot;
                          </p>
                          <p className="text-xs text-white/40">
                            (words {'startWordIndex' in urlConfig ? `${urlConfig.startWordIndex}-${urlConfig.endWordIndex}` : ''})
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-white/60 mb-1">
                          Trigger: &quot;{'triggerPhrase' in urlConfig ? urlConfig.triggerPhrase : ''}&quot;
                        </p>
                      )}
                      <p className="mt-2 text-sm text-white break-all">{urlConfig.url}</p>
                      {urlConfig.relevance && (
                        <p className="mt-1 text-xs text-white/50">{urlConfig.relevance}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditUrl(urlConfig)}
                        className="text-xs text-green-400 hover:text-green-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveUrl(urlConfig.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Passage URL Dialog */}
      {showUrlDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-lg rounded-xl bg-zinc-900 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">
              {editingId ? 'Edit URL for Passage' : 'Add URL for Selected Passage'}
            </h3>

            <div className="space-y-4">
              {currentSelectedText && (
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-white/60 mb-1">Selected text:</p>
                      <p className="text-sm text-white/80 italic">&quot;{currentSelectedText}&quot;</p>
                    </div>
                    {editingId && (
                      <button
                        onClick={() => {
                          setShowUrlDialog(false);
                          // Keep editingId and form data, user will reselect text
                        }}
                        className="ml-2 text-xs text-green-400 hover:text-green-300"
                      >
                        Reselect
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  placeholder="e.g., React Hooks Documentation"
                  className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={currentUrl}
                  onChange={(e) => setCurrentUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Relevance (optional)
                </label>
                <textarea
                  value={currentRelevance}
                  onChange={(e) => setCurrentRelevance(e.target.value)}
                  placeholder="Why is this URL relevant?"
                  className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSavePassageUrl}
                  disabled={!currentTitle || !currentUrl}
                  className="flex-1 rounded-full bg-purple-600 px-6 py-2 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingId ? 'Update' : 'Save'}
                </button>
                <button
                  onClick={resetDialog}
                  className="flex-1 rounded-full bg-white/10 px-6 py-2 font-semibold text-white transition hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Standalone URL Dialog */}
      {showStandaloneDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-lg rounded-xl bg-zinc-900 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">
              {editingId ? 'Edit Standalone URL' : 'Add Standalone URL'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  placeholder="e.g., TypeScript Documentation"
                  className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Trigger Phrase <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={currentTriggerPhrase}
                  onChange={(e) => setCurrentTriggerPhrase(e.target.value)}
                  placeholder="e.g., typescript"
                  className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={currentUrl}
                  onChange={(e) => setCurrentUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Relevance (optional)
                </label>
                <textarea
                  value={currentRelevance}
                  onChange={(e) => setCurrentRelevance(e.target.value)}
                  placeholder="Why is this URL relevant?"
                  className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveStandaloneUrl}
                  disabled={!currentTitle || !currentUrl || !currentTriggerPhrase}
                  className="flex-1 rounded-full bg-green-600 px-6 py-2 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingId ? 'Update' : 'Save'}
                </button>
                <button
                  onClick={resetDialog}
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
