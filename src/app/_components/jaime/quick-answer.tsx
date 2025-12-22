"use client";

interface Citation {
  url: string;
  title: string;
  snippet: string;
}

interface QuickAnswerProps {
  query: string;
  answer: string;
  citations?: Citation[];
  onClose?: () => void;
  onCitationClick?: (url: string) => void;
}

export function QuickAnswer({
  query,
  answer,
  citations = [],
  onClose,
  onCitationClick,
}: QuickAnswerProps) {
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-black to-zinc-900 p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-1">
          <h2 className="mb-1 text-2xl font-bold text-white">Quick Answer</h2>
          <p className="text-sm text-white/60">{query}</p>
          <div className="mt-2 text-xs text-white/40">Powered by You.com</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Answer */}
      <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="prose prose-invert max-w-none">
          <p className="text-base leading-relaxed text-white/90 whitespace-pre-wrap">
            {answer}
          </p>
        </div>
      </div>

      {/* Citations */}
      {citations.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/60">
            Sources
          </h3>
          <div className="space-y-3">
            {citations.map((citation, index) => (
              <div
                key={index}
                className="group cursor-pointer rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-purple-500/50 hover:bg-white/10"
                onClick={() => onCitationClick?.(citation.url)}
              >
                {/* Citation Title */}
                <h4 className="mb-2 text-sm font-semibold text-white group-hover:text-purple-400">
                  {citation.title}
                </h4>

                {/* Citation Snippet */}
                <p className="mb-2 text-xs text-white/70">{citation.snippet}</p>

                {/* Citation URL */}
                <div className="text-xs">
                  <span className="truncate text-purple-400 group-hover:underline">
                    {new URL(citation.url).hostname}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No citations fallback */}
      {citations.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-sm text-white/40">No sources available</p>
        </div>
      )}
    </div>
  );
}
