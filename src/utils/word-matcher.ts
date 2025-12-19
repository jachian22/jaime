/**
 * Fuzzy word matcher with skip-to-next-match logic
 * Matches spoken words from Deepgram to script text, handling typos and skipped words
 */

interface MatchResult {
  matched: boolean;
  newIndex: number;
  confidence: number;
}

export class WordMatcher {
  private scriptWords: string[];
  private currentIndex: number;
  private transcriptBuffer: string[] = [];

  constructor(scriptText: string, startIndex: number = 0) {
    this.scriptWords = scriptText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    this.currentIndex = startIndex;
  }

  /**
   * Process new transcript and find matching position in script
   */
  processTranscript(transcript: string, isFinal: boolean): MatchResult {
    const words = transcript.toLowerCase().split(/\s+/);

    if (isFinal) {
      this.transcriptBuffer.push(...words);
    }

    // Try to find a match starting from current position
    const result = this.findNextMatch(words);

    if (result.matched) {
      this.currentIndex = result.newIndex;
      this.transcriptBuffer = []; // Clear buffer on match
    }

    return result;
  }

  /**
   * Find the next match in the script, looking ahead up to 20 words
   * OPTIMIZATION: Reduced from 50 to 20 words, returns on first match (early exit)
   */
  private findNextMatch(words: string[]): MatchResult {
    // Look ahead up to 20 words (reduced from 50 for performance)
    const lookAheadWindow = 20;
    const searchEnd = Math.min(
      this.currentIndex + lookAheadWindow,
      this.scriptWords.length
    );

    for (let i = this.currentIndex; i < searchEnd; i++) {
      const similarity = this.calculateSimilarity(
        words,
        this.scriptWords.slice(i, i + words.length)
      );

      if (similarity > 0.7) {
        // 70% match threshold - EARLY EXIT
        return {
          matched: true,
          newIndex: i + words.length,
          confidence: similarity,
        };
      }
    }

    return { matched: false, newIndex: this.currentIndex, confidence: 0 };
  }

  /**
   * Calculate similarity between two word arrays (0-1 scale)
   */
  private calculateSimilarity(arr1: string[], arr2: string[]): number {
    if (arr1.length === 0 || arr2.length === 0) return 0;

    let matches = 0;
    const maxLen = Math.max(arr1.length, arr2.length);

    for (let i = 0; i < Math.min(arr1.length, arr2.length); i++) {
      const word1 = arr1[i];
      const word2 = arr2[i];
      if (word1 && word2 && this.wordsMatch(word1, word2)) {
        matches++;
      }
    }

    return matches / maxLen;
  }

  /**
   * Check if two words match, accounting for punctuation and typos
   */
  private wordsMatch(word1: string, word2: string): boolean {
    // Remove punctuation for comparison
    const clean1 = word1.replace(/[^\w]/g, "");
    const clean2 = word2.replace(/[^\w]/g, "");

    // Exact match
    if (clean1 === clean2) return true;

    // Levenshtein distance for typos (allow up to 2 character differences)
    return this.levenshteinDistance(clean1, clean2) <= 2;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * (minimum number of single-character edits needed to transform one string into another)
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0]![j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i]![j] = matrix[i - 1]![j - 1]!;
        } else {
          matrix[i]![j] = Math.min(
            matrix[i - 1]![j - 1]! + 1, // substitution
            matrix[i]![j - 1]! + 1,     // insertion
            matrix[i - 1]![j]! + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length]![str1.length]!;
  }

  /**
   * Get current word index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Manually set the current index (for manual controls)
   */
  setCurrentIndex(index: number): void {
    this.currentIndex = Math.max(0, Math.min(index, this.scriptWords.length));
  }

  /**
   * Get total word count
   */
  getTotalWords(): number {
    return this.scriptWords.length;
  }
}
