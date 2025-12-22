"use client";

import { useState } from "react";
import type { JaimeSession } from "@/types/jaime";
import { exportToMarkdown, exportToJSON, downloadFile } from "@/utils/jaime-export";

interface SessionReviewProps {
  session: JaimeSession;
  onNewSession: () => void;
}

export function SessionReview({ session, onNewSession }: SessionReviewProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const handleExportMarkdown = () => {
    const markdown = exportToMarkdown(session);
    const startTime = new Date(session.startTime);
    const filename = `jaime-session-${startTime.toISOString().slice(0, 10)}.md`;
    downloadFile(markdown, filename, 'text/markdown');
  };

  const handleExportJSON = () => {
    const json = exportToJSON(session);
    const startTime = new Date(session.startTime);
    const filename = `jaime-session-${startTime.toISOString().slice(0, 10)}.json`;
    downloadFile(json, filename, 'application/json');
  };

  // Calculate duration
  const startTime = new Date(session.startTime);
  const endTime = session.endTime ? new Date(session.endTime) : null;
  const duration = endTime
    ? Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60)
    : 0;

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 border-b border-white/10 pb-6">
          <h1 className="mb-2 text-3xl font-bold text-white">Session Review</h1>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>{startTime.toLocaleString()}</span>
            <span>•</span>
            <span>{duration} minutes</span>
            <span>•</span>
            <span>{session.transcriptLines.length} lines</span>
            <span>•</span>
            <span className="capitalize">{session.privacyMode.replace('-', ' ')}</span>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export Markdown
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export JSON
          </button>
          <button
            onClick={onNewSession}
            className="ml-auto flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Start New Session
          </button>
        </div>

        {/* Topics */}
        {session.topicGroups && session.topicGroups.length > 0 ? (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Topics</h2>
            <div className="space-y-4">
              {session.topicGroups.map((topic) => (
                <div
                  key={topic.id}
                  className="overflow-hidden rounded-lg border border-white/10 bg-white/5"
                >
                  {/* Topic Header */}
                  <button
                    onClick={() => toggleTopic(topic.id)}
                    className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/5"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-white">{topic.title}</h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-white/60">
                        <span>
                          Lines {topic.startLineIndex + 1}-{topic.endLineIndex + 1}
                        </span>
                        {topic.urls.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{topic.urls.length} URL(s)</span>
                          </>
                        )}
                      </div>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-6 w-6 text-white/60 transition-transform ${
                        expandedTopics.has(topic.id) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Topic Content (Expanded) */}
                  {expandedTopics.has(topic.id) && (
                    <div className="border-t border-white/10 p-4">
                      {/* Transcript */}
                      <div className="mb-4 space-y-2">
                        {session.transcriptLines
                          .slice(topic.startLineIndex, topic.endLineIndex + 1)
                          .map((line) => (
                            <div key={line.id} className="rounded bg-white/5 p-3">
                              <div className="mb-1 text-xs text-white/50">
                                [{formatTimestamp(line.timestamp)}]
                              </div>
                              <div className="text-white">{line.text}</div>
                            </div>
                          ))}
                      </div>

                      {/* URLs */}
                      {topic.urls.length > 0 && (
                        <div className="mb-4">
                          <h4 className="mb-2 text-sm font-semibold text-white/80">URLs:</h4>
                          <div className="space-y-1">
                            {topic.urls.map((url, idx) => {
                              const urlData = session.urlHistory.find((u) => u.url === url);
                              return (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-purple-400">→</span>
                                  <div>
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-purple-300 underline hover:text-purple-200"
                                    >
                                      {url}
                                    </a>
                                    {urlData?.relevance && (
                                      <div className="text-xs text-white/50">
                                        {urlData.relevance}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Keywords */}
                      {topic.keywords.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-white/80">Keywords:</h4>
                          <div className="flex flex-wrap gap-2">
                            {topic.keywords.map((keyword, idx) => (
                              <span
                                key={idx}
                                className="rounded-full bg-purple-900/50 px-3 py-1 text-xs text-purple-300"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/60">No topics generated for this session.</p>
          </div>
        )}

        {/* Full Transcript */}
        <div>
          <h2 className="mb-4 text-2xl font-bold text-white">Full Transcript</h2>
          <div className="space-y-2">
            {session.transcriptLines.map((line) => (
              <div key={line.id} className="rounded-lg bg-white/5 p-4">
                <div className="mb-2 text-xs text-white/50">
                  [{formatTimestamp(line.timestamp)}]
                </div>
                <div className="text-lg leading-relaxed text-white">{line.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
