export const JAIME_CONFIG = {
  // Context window sizes (characters)
  CONTEXT_WINDOW: {
    CONSERVATIVE: 1000,  // ~150 words
    BALANCED: 2000,      // ~300 words
    AGGRESSIVE: 4000,    // ~600 words
  },

  // Transcript display
  TRANSCRIPT: {
    MAX_VISIBLE_LINES: 50,
    AUTO_SCROLL_DELAY_MS: 100,
    LINE_FADE_DURATION_MS: 300,
  },

  // Voice commands
  VOICE_COMMANDS: {
    DEBOUNCE_MS: 2000,
    ACTIVATION_WORDS: ['jamie', 'jaime'],
  },

  // Session persistence
  STORAGE: {
    AUTO_SAVE_INTERVAL_MS: 30000, // 30 seconds
    KEY_PREFIX: 'jaime_session_',
  },

  // Browser panel
  BROWSER: {
    DEFAULT_SPLIT_PERCENTAGE: 50,
  },
} as const;

export type SensitivityLevel = 'conservative' | 'balanced' | 'aggressive';
export type PrivacyMode = 'captions-only' | 'ai-assistant';
