/**
 * Fast word matcher optimized for real-time teleprompter highlighting
 * Uses exact matching with sequential assumption for <200ms latency
 */

interface MatchResult {
  matched: boolean;
  newIndex: number;
}

export class FastWordMatcher {
  private scriptWords: string[];
  private currentIndex: number;
  private lastWord: string = '';

  constructor(scriptText: string, startIndex: number = 0) {
    // Preprocess: lowercase + strip punctuation for fast comparison
    this.scriptWords = scriptText
      .toLowerCase()
      .split(/\s+/)
      .map(w => w.replace(/[^\w]/g, ''))
      .filter(w => w.length > 0);
    this.currentIndex = startIndex;
  }

  /**
   * Process a single word from interim/final transcript
   * Returns new index if matched, null if no match
   * OPTIMIZATION: O(1) for sequential reading, O(5) worst case
   */
  processWord(word: string): number | null {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');

    // Skip empty words
    if (cleanWord.length === 0) {
      return null;
    }

    // Skip if same as last word (Deepgram sometimes repeats in interims)
    if (cleanWord === this.lastWord) {
      return null;
    }
    this.lastWord = cleanWord;

    // FAST PATH: Check sequential match (99% case when reading)
    if (this.scriptWords[this.currentIndex] === cleanWord) {
      this.currentIndex++;
      return this.currentIndex;
    }

    // SLOW PATH: Check small lookahead window (user skipped/repeated)
    const lookAhead = 5;
    for (let i = 1; i <= lookAhead; i++) {
      const checkIndex = this.currentIndex + i;
      if (checkIndex < this.scriptWords.length &&
          this.scriptWords[checkIndex] === cleanWord) {
        this.currentIndex = checkIndex + 1;
        return this.currentIndex;
      }
    }

    // No match found - don't advance
    return null;
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
    this.lastWord = ''; // Reset last word on manual seek
  }

  /**
   * Get total word count
   */
  getTotalWords(): number {
    return this.scriptWords.length;
  }
}
