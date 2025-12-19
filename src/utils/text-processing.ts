/**
 * Text processing utilities for the teleprompter
 */

export interface SentenceToken {
  text: string;
  wordStartIndex: number; // Starting word index for this sentence
  wordEndIndex: number;   // Ending word index for this sentence
}

/**
 * Splits text into sentences, preserving sentence boundaries
 * Each sentence gets tracked with its word index range
 */
export function tokenizeIntoSentences(text: string): SentenceToken[] {
  // Split by sentence-ending punctuation (., !, ?)
  // Keep the punctuation with the sentence
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences = text.match(sentenceRegex) ?? [text];

  const result: SentenceToken[] = [];
  let currentWordIndex = 0;

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length === 0) continue;

    // Count words in this sentence (for word matching)
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    result.push({
      text: trimmed,
      wordStartIndex: currentWordIndex,
      wordEndIndex: currentWordIndex + wordCount,
    });

    currentWordIndex += wordCount;
  }

  return result;
}

/**
 * Tokenizes script text into an array of words and whitespace
 * Preserves whitespace for proper text rendering
 */
export function tokenizeScript(text: string): string[] {
  return text.split(/(\s+)/).filter((token) => token.length > 0);
}

/**
 * Returns CSS classes for a token based on its position relative to current reading index
 * Simplified: only greys out past words, no highlighting
 */
export function classifyToken(index: number, currentIndex: number): string {
  // Already read - greyed out
  if (index < currentIndex) return "opacity-40";

  // Current and future words - full opacity, no highlighting
  return "opacity-100";
}
