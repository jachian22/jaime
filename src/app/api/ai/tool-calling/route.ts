import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import { env } from "@/env";

export async function POST(req: Request) {
  const { scriptText, currentPosition, recentTranscript } = await req.json();

  // Get a window of text around the current position
  const contextStart = Math.max(0, currentPosition - 100);
  const contextEnd = Math.min(scriptText.length, currentPosition + 200);
  const scriptExcerpt = scriptText.substring(contextStart, contextEnd);

  const result = streamText({
    model: google("gemini-2.0-flash-exp", {
      apiKey: env.GOOGLE_API_KEY,
    }),
    tools: {
      openWebpage: tool({
        description:
          "Open a webpage or article in the browser panel when relevant context is mentioned",
        parameters: z.object({
          url: z.string().describe("The URL to open"),
          query: z
            .string()
            .describe("The search query or context that triggered this"),
          relevance: z
            .string()
            .describe(
              "Why this webpage is relevant to the current script context"
            ),
        }),
        execute: async ({ url, query, relevance }) => {
          return { url, query, relevance };
        },
      }),
    },
    prompt: `You are helping with a voice-aware teleprompter. The user is reading a script and you should open relevant webpages when context suggests it would be helpful.

Current script excerpt:
"${scriptExcerpt}"

Recent speech:
"${recentTranscript}"

Analyze if the current context would benefit from showing a webpage (documentation, reference, example, article, etc.).

Important guidelines:
- Only call the tool if there's a SPECIFIC, RELEVANT webpage that would help
- Prefer official documentation over general articles
- Don't call the tool for vague or general topics
- Be conservative - only trigger when it would genuinely add value

If appropriate, call the openWebpage tool with the URL and explanation.`,
  });

  return result.toDataStreamResponse();
}
