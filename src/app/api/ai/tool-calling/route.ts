import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import { env } from "@/env";

export async function POST(req: Request) {
  try {
    const body = await req.json() as { scriptText: string; currentPosition: number; recentTranscript: string };
    const { scriptText, currentPosition, recentTranscript } = body;

    // Get a window of text around the current position
    const contextStart = Math.max(0, currentPosition - 100);
    const contextEnd = Math.min(scriptText.length, currentPosition + 200);
    const scriptExcerpt = scriptText.substring(contextStart, contextEnd);

    // Initialize Google provider with API key
    const google = createGoogleGenerativeAI({
      apiKey: env.GOOGLE_API_KEY,
    });

  // Define tools (structured for easy addition of searchWeb later)
  const openWebpage = tool({
    description: "Open a webpage or documentation in the browser panel when relevant to the script context",
    inputSchema: z.object({
      url: z.string().describe("The URL to open"),
      relevance: z.string().describe("Why this webpage is relevant to the current context"),
      category: z.enum(["documentation", "tutorial", "reference", "article"]).describe("Type of resource")
    }),
    execute: async ({ url, relevance, category }) => {
      // Return the tool call result - will be handled by client
      return { url, relevance, category };
    },
  });

  // Future: Add searchWeb tool here for Option 3
  // const searchWeb = tool({ ... });

  const result = streamText({
    model: google("gemini-2.0-flash-exp"),
    tools: {
      openWebpage,
      // searchWeb,  // Uncomment when implementing Option 3
    },
    toolChoice: "auto",
    prompt: `You are helping with a voice-aware teleprompter. The user is reading a script and you should identify when opening relevant webpages would be helpful.

Current script excerpt:
"${scriptExcerpt}"

Recent speech:
"${recentTranscript}"

Analyze if the current context would benefit from showing a webpage (documentation, reference, tutorial, article, etc.).

Important guidelines:
- Only call openWebpage if there's a SPECIFIC, RELEVANT URL that would help
- Prefer official documentation over general articles
- Use URLs you know from your training data (you cannot search)
- Don't suggest for vague or general topics
- Be conservative - only when it would genuinely add value
- Do NOT make up URLs - only suggest URLs you're confident exist

If appropriate, call the openWebpage tool with the exact URL and explanation.`,
    });

    // AI SDK 5: Use toUIMessageStreamResponse for tool call support
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[AI Tool Calling Error]", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process AI request",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
