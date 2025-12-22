"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SessionReview } from "@/app/_components/jaime/session-review";
import { useTopicGrouping } from "@/hooks/use-topic-grouping";
import type { JaimeSession } from "@/types/jaime";
import { JAIME_CONFIG } from "@/constants/jaime-config";
import { z } from "zod";

// Validation schema for stored session data
const storedSessionSchema = z.object({
  id: z.string(),
  startTime: z.string().or(z.date()),
  endTime: z.string().or(z.date()).nullable(),
  privacyMode: z.enum(['captions-only', 'ai-assistant']),
  sensitivity: z.enum(['conservative', 'balanced', 'aggressive']),
  transcriptLines: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      timestamp: z.string().or(z.date()),
      isFinal: z.boolean(),
    })
  ),
  urlHistory: z.array(
    z.object({
      url: z.string(),
      openedAt: z.string().or(z.date()),
      source: z.enum(['ai', 'voice-command']),
      relevance: z.string().optional(),
    })
  ),
  topicGroups: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        startLineIndex: z.number(),
        endLineIndex: z.number(),
        urls: z.array(z.string()),
        keywords: z.array(z.string()),
      })
    )
    .nullable(),
});

function ReviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [session, setSession] = useState<JaimeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { topicGroups, isProcessing, generateGroups } = useTopicGrouping();

  // Load session from localStorage
  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    try {
      const key = `${JAIME_CONFIG.STORAGE.KEY_PREFIX}${sessionId}`;
      const storedData = localStorage.getItem(key);

      if (!storedData) {
        setError('Session not found');
        setLoading(false);
        return;
      }

      // Parse and validate with Zod
      const parsed = JSON.parse(storedData) as unknown;
      const validationResult = storedSessionSchema.safeParse(parsed);

      if (!validationResult.success) {
        console.error('[Review] Invalid session data:', validationResult.error);
        setError('Session data is corrupted or invalid');
        setLoading(false);
        return;
      }

      const rawSession = validationResult.data;

      // Convert date strings back to Date objects
      const parsedSession: JaimeSession = {
        ...rawSession,
        startTime: new Date(rawSession.startTime),
        endTime: rawSession.endTime ? new Date(rawSession.endTime) : null,
        transcriptLines: rawSession.transcriptLines.map((line) => ({
          ...line,
          timestamp: new Date(line.timestamp),
        })),
        urlHistory: rawSession.urlHistory.map((url) => ({
          ...url,
          openedAt: new Date(url.openedAt),
        })),
      };

      setSession(parsedSession);
      setLoading(false);
    } catch (err) {
      console.error('[Review] Error loading session:', err);
      setError('Failed to load session');
      setLoading(false);
    }
  }, [sessionId]);

  // Generate topic groups when session is loaded
  useEffect(() => {
    if (session && !session.topicGroups) {
      void generateGroups(session.transcriptLines, session.urlHistory);
    }
  }, [session, generateGroups]);

  // Update session with generated topic groups
  useEffect(() => {
    if (session && topicGroups.length > 0 && !session.topicGroups) {
      const updatedSession = {
        ...session,
        topicGroups,
      };
      setSession(updatedSession);

      // Save updated session to localStorage
      if (sessionId) {
        const key = `${JAIME_CONFIG.STORAGE.KEY_PREFIX}${sessionId}`;
        localStorage.setItem(key, JSON.stringify(updatedSession));
      }
    }
  }, [topicGroups, session, sessionId]);

  const handleNewSession = () => {
    router.push('/jaime');
  };

  if (loading || isProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black to-zinc-900">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          </div>
          <p className="text-white/60">
            {isProcessing ? 'Generating topic groups...' : 'Loading session...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black to-zinc-900">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-2 text-2xl font-bold text-white">Error</h1>
          <p className="mb-6 text-white/60">{error ?? 'Session not found'}</p>
          <button
            onClick={() => router.push('/jaime')}
            className="rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            Back to Jaime Mode
          </button>
        </div>
      </div>
    );
  }

  return <SessionReview session={session} onNewSession={handleNewSession} />;
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black to-zinc-900">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
            </div>
            <p className="text-white/60">Loading...</p>
          </div>
        </div>
      }
    >
      <ReviewPageContent />
    </Suspense>
  );
}
