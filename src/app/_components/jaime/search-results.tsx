"use client";

import Image from "next/image";

interface SearchResult {
  url: string;
  title: string;
  description: string;
  snippets?: string[];
  thumbnail_url?: string;
  published_date?: string;
}

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  onResultClick?: (url: string) => void;
}

export function SearchResults({ query, results, onResultClick }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-b from-black to-zinc-900 p-8">
        <div className="text-center">
          <div className="mb-4 text-4xl">🔍</div>
          <h2 className="mb-2 text-xl font-semibold text-white">No results found</h2>
          <p className="text-white/60">Try a different search query</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-black to-zinc-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="mb-1 text-2xl font-bold text-white">Search Results</h2>
        <p className="text-sm text-white/60">
          Found {results.length} {results.length === 1 ? 'result' : 'results'} for &quot;{query}&quot;
        </p>
        <div className="mt-2 text-xs text-white/40">Powered by You.com</div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className="group cursor-pointer rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-purple-500/50 hover:bg-white/10"
            onClick={() => onResultClick?.(result.url)}
          >
            {/* Thumbnail */}
            {result.thumbnail_url && (
              <div className="mb-3 overflow-hidden rounded relative h-32">
                <Image
                  src={result.thumbnail_url}
                  alt={result.title}
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}

            {/* Title */}
            <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-purple-400">
              {result.title}
            </h3>

            {/* Description */}
            <p className="mb-2 text-sm text-white/70">{result.description}</p>

            {/* Snippets */}
            {result.snippets && result.snippets.length > 0 && (
              <div className="mb-2 space-y-1">
                {result.snippets.slice(0, 2).map((snippet, snippetIndex) => (
                  <p key={snippetIndex} className="text-xs text-white/50">
                    ...{snippet}...
                  </p>
                ))}
              </div>
            )}

            {/* URL & Date */}
            <div className="flex items-center justify-between text-xs">
              <span className="truncate text-purple-400 group-hover:underline">
                {new URL(result.url).hostname}
              </span>
              {result.published_date && (
                <span className="text-white/40">{result.published_date}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
