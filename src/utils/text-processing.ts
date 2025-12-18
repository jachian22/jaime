/**
 * Text processing utilities for the teleprompter
 */

/**
 * Tokenizes script text into an array of words and whitespace
 * Preserves whitespace for proper text rendering
 */
export function tokenizeScript(text: string): string[] {
  return text.split(/(\s+)/).filter((token) => token.length > 0);
}

/**
 * Returns CSS classes for a token based on its position relative to current reading index
 * @param index - Index of the token in the array
 * @param currentIndex - Current reading position index
 * @returns Tailwind CSS classes
 */
export function classifyToken(index: number, currentIndex: number): string {
  // Already read - dimmed
  if (index < currentIndex) return "opacity-40";

  // Current and upcoming words (next 5) - highlighted
  if (index >= currentIndex && index < currentIndex + 5) {
    return "bg-[hsl(280,100%,70%)] text-white px-1 rounded";
  }

  // Future words - full opacity
  return "opacity-100";
}
