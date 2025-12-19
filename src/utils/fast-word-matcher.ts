/**
 * Fast word matcher optimized for real-time teleprompter highlighting
 * Uses exact matching with sequential assumption for <200ms latency
 */

export class FastWordMatcher {
  private scriptWords: string[];
  private currentIndex: number;
  private lastWord = '';

  constructor(scriptText: string, startIndex = 0) {
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
   * Process final transcript with position correction
   * If interim results caused us to jump ahead incorrectly, this will correct the position
   */
  processFinalTranscript(words: string[]): number | null {
    if (words.length === 0) return null;

    const cleanWords = words.map(w => w.toLowerCase().replace(/[^\w]/g, '')).filter(w => w.length > 0);
    if (cleanWords.length === 0) return null;

    // Try to match the phrase starting from current position
    let matchIndex = this.findPhraseMatch(cleanWords, this.currentIndex);

    // If no match forward, look backwards (interim might have jumped ahead)
    if (matchIndex === null) {
      const lookBackWindow = 10;
      const startSearch = Math.max(0, this.currentIndex - lookBackWindow);
      matchIndex = this.findPhraseMatch(cleanWords, startSearch);
    }

    if (matchIndex !== null) {
      // Update position to end of matched phrase
      this.currentIndex = matchIndex + cleanWords.length;
      this.lastWord = cleanWords[cleanWords.length - 1] ?? '';
      return this.currentIndex;
    }

    return null;
  }

  /**
   * Find a phrase match starting from a given position
   * Returns the starting index if found, null otherwise
   */
  private findPhraseMatch(words: string[], startIndex: number): number | null {
    const searchWindow = 10;
    const searchEnd = Math.min(startIndex + searchWindow, this.scriptWords.length);

    for (let i = startIndex; i < searchEnd; i++) {
      // Check if all words in the phrase match starting at position i
      let allMatch = true;
      for (let j = 0; j < words.length; j++) {
        if (i + j >= this.scriptWords.length || this.scriptWords[i + j] !== words[j]) {
          allMatch = false;
          break;
        }
      }

      if (allMatch) {
        return i; // Found match at position i
      }
    }

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
