# Jaime - AI Media Assistant

A real-time, voice-controlled AI assistant for content creators. Built to explore different paradigms of AI-human collaboration during media production—from scripted content to free-form conversations.

## Overview

Two modes, two different approaches to AI assistance:

### Teleprompter Mode
AI-powered teleprompter that dynamically surfaces relevant web content based on script context. Designed for video creators, presenters, and live streamers who need reference material on-demand without breaking flow.

**Key Challenge:** Predicting what information a speaker needs *before* they need it, based on upcoming script content and conversational context.

### Jaime Mode
Voice-controlled research assistant for podcasts and live conversations. Paying homage to the Joe Rogan Expeience and his assistant Jamie, it listens to conversations in real-time and responds to natural voice commands to pull up facts, search results, and reference material. Not every podcaster can afford to pay a Jamie to pull up references mid-podcast, but soon we can have an AI representation of him helping us when we are short handed.

**Key Challenge:** Detecting intent from conversational speech, distinguishing commands from content, and providing relevant information without interrupting flow.

## Technical Highlights

### Real-Time Audio Pipeline

Intentional choice we made with Voice AI is to focus more on the downstream processing of language for relevant tool-use vs the challenges with handling silences and filtering out filler words. This gives us the chance to explore tool-calling with streaming text to explore engineering ah-ha moments at the speed of spoken thought.

- Browser → Deepgram WebSocket → Live transcription with interim/final results
- Solved: Processing time choppiness with UI choices to smooth out the experience
- User-configurable tool-calls with more explicitly phrased triggers for reliability where you need it
- Real-time speech-to-text processing from Deepgram fed to AI SDK's streamText with custom parsing gets us near real-time tool-calling to open webpages in iframe mid-conversation
- MediaRecorder reuse across reconnections to avoid permission re-prompts

### Multi-AI Orchestration
Three AI providers working together:
- **Deepgram**: Real-time speech-to-text streaming
- **Vercel AI SDK**: Contextual analysis and relevance detection with stream processing
- **You.com**: Search API for web results and quick facts

### Context Window Management
- Rolling context windows (1000-4000 chars) based on sensitivity settings
- Prevents token bloat while maintaining conversation coherence
- AI decides when to surface content vs. stay silent (critical for avoiding noise)

### Voice Command Detection
Pattern-based intent detection with debouncing:
```typescript
// Detects commands in natural speech without wake word isolation
"Jaime, what is quantum computing" → Express API (quick fact)
"Jaime, look up React hooks" → Search API (web results)
"Jaime, close this" → UI action
```

Challenges:
- Matching patterns in conversational flow without false positives
- Debouncing repeated/corrected speech
- Distinguishing activation words from casual mentions

### State Management
- Custom React hooks for complex stateful logic (audio streaming, session lifecycle, AI analysis)
- localStorage auto-save every 30s with crash recovery
- URL history tracking per session for post-production review

## Architecture

```
┌─────────────┐
│   Browser   │
│ MediaRecorder│
└──────┬──────┘
       │ WebSocket (audio/webm)
       ▼
┌─────────────┐
│  Deepgram   │ ──► Transcript (interim + final)
└─────────────┘
       │
       ▼
┌─────────────────────────┐
│  Voice Command Hook     │
│  (Pattern Matching)     │
└───┬─────────────────┬───┘
    │                 │
    ▼                 ▼
┌─────────┐     ┌──────────┐
│ You.com │     │  Gemini  │
│ Search/ │     │ Context  │
│ Express │     │ Analysis │
└─────────┘     └──────────┘
    │                 │
    └────────┬────────┘
             ▼
    ┌─────────────────┐
    │  Browser Panel  │
    │  SearchResults  │
    │  QuickAnswer    │
    └─────────────────┘
```

## Engineering Decisions

**TypeScript Throughout**: Strict mode enabled, discriminated unions for panel content types

**Error Boundaries**: WebSocket failures, API errors, mic permissions all handled gracefully

**Performance**: Next.js Image optimization, lazy loading, minimal re-renders via useCallback

**Configurability**: Centralized config (`JAIME_CONFIG`) for tuning thresholds without code changes

**Developer Experience**: Extensive console logging with prefixes for debugging multi-system interactions

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **AI/ML**: Deepgram (STT), Vercel AI SDK (LLM framework), You.com (Search + Express)
- **State**: Custom React hooks, localStorage persistence
- **Real-time**: WebSocket connections, MediaRecorder API
- **Auth**: Clerk
- **Database**: Drizzle ORM + PostgreSQL
- **Type Safety**: Zod for runtime validation

## Setup

### Prerequisites
```bash
# API Keys required:
DEEPGRAM_API_KEY=
GOOGLE_API_KEY=
YOU_COM=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
DATABASE_URL=
```

### Installation
```bash
npm install
npm run dev
```

Navigate to:
- `/teleprompter` - Scripted content mode
- `/jaime` - Voice command mode

## Notable Implementation Details

**WebSocket Auto-Reconnect**: Uses refs to track recording state across reconnections, preventing race conditions when Deepgram closes idle connections.

**Sample Rate Handling**: Browsers ignore requested sample rates. Solution: Extract actual rate from `MediaStreamTrack.getSettings()` and pass to Deepgram via URL parameter.

**Debouncing Strategy**: 2-second debounce on voice commands prevents duplicate triggers from speech corrections and repeated phrases.

**Panel Content Discrimination**: TypeScript discriminated unions ensure type-safe rendering of SearchResults vs. QuickAnswer vs. BrowserPanel.

**Sensitivity Levels**: Three-tier system (Conservative/Balanced/Aggressive) adjusts context window size and AI trigger thresholds without modal changes.

---

Built as an exploration of real-time AI orchestration and voice interface design. Both modes are production-ready with comprehensive error handling and resilience patterns. Next steps are to setup a robust testing harness to push the limits of real-time agentic tool calling
