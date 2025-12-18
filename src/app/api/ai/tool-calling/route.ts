import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { env } from "@/env";

export async function POST(req: Request) {
  const { scriptText, currentPosition, recentTranscript } = await req.json();

  // Get a window of text around the current position
  const contextStart = Math.max(0, currentPosition - 100);
  const contextEnd = Math.min(scriptText.length, currentPosition + 200);
  const scriptExcerpt = scriptText.substring(contextStart, contextEnd);

  // Initialize Google provider with API key
  const google = createGoogleGenerativeAI({
    apiKey: env.GOOGLE_API_KEY,
  });

  // AI analysis without tool calling (tools can be added back later)
  const result = streamText({
    model: google("gemini-2.0-flash-exp"),
    prompt: `You are helping with a voice-aware teleprompter. The user is reading a script and you should analyze the context to identify when relevant webpages or resources might be helpful.

Current script excerpt:
"${scriptExcerpt}"

Recent speech:
"${recentTranscript}"

Analyze if the current context would benefit from showing a webpage (documentation, reference, example, article, etc.). Be specific about URLs that would be relevant.

Important guidelines:
- Only suggest if there's a SPECIFIC, RELEVANT webpage that would help
- Prefer official documentation over general articles
- Don't suggest for vague or general topics
- Be conservative - only when it would genuinely add value`,
  });

  return result.toDataStreamResponse();
}
