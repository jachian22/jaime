import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import { env } from "@/env";

// Request body validation schema
const requestBodySchema = z.object({
  recentContext: z.string().min(1, "Context cannot be empty"),
  sensitivity: z.enum(['conservative', 'balanced', 'aggressive']),
});

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;

    // Validate request body with Zod
    const validationResult = requestBodySchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { recentContext, sensitivity } = validationResult.data;

    // Initialize Google provider with API key
    const google = createGoogleGenerativeAI({
      apiKey: env.GOOGLE_API_KEY,
    });

    // Define the openWebpage tool
    const openWebpage = tool({
      description: "Open a relevant webpage when the conversation needs specific information",
      inputSchema: z.object({
        url: z.string().describe("The URL to open"),
        relevance: z.string().describe("Why this webpage is relevant to the conversation"),
      }),
      execute: async ({ url, relevance }) => {
        // Return the tool call result - will be handled by client
        return { url, relevance };
      },
    });

    // Sensitivity-based guidelines
    const sensitivityGuidelines = {
      conservative: "Only suggest webpages for EXPLICIT requests or very specific information needs. Be extremely cautious.",
      balanced: "Suggest webpages for clear topical discussions where additional information would be valuable.",
      aggressive: "Proactively suggest webpages when they could enhance the conversation, even for tangential topics.",
    };

    const result = streamText({
      model: google("gemini-2.0-flash-exp"),
      tools: {
        openWebpage,
      },
      toolChoice: "auto",
      prompt: `You are Jaime, a research assistant for live conversations.

Recent conversation:
"${recentContext}"

Determine if there's a SPECIFIC, HIGH-VALUE webpage needed RIGHT NOW for this conversation.

Guidelines:
- Only suggest for explicit information needs or clear topical discussions
- Prioritize official documentation, technical specs, authoritative sources, and reputable reference sites
- DO NOT suggest for general, casual, or vague topics
- Cannot search the web - only use URLs from your training data that you're confident exist
- Be conservative: false positives (unnecessary suggestions) are worse than misses
- DO NOT make up or guess URLs - only suggest URLs you know are real

Current sensitivity level: ${sensitivity}
${sensitivityGuidelines[sensitivity]}

If appropriate, call the openWebpage tool with the exact URL and clear explanation of relevance.`,
    });

    // AI SDK 5: Use toUIMessageStreamResponse for tool call support
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[Jaime AI Error]", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process conversational assist request",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
