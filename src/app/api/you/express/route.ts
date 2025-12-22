import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env";

// Request body validation schema
const requestBodySchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
});

// You.com Express API response types
interface YouExpressResponse {
  answer: string;
  citations?: Array<{
    url: string;
    title: string;
    snippet: string;
  }>;
  web_results?: Array<{
    url: string;
    title: string;
    description: string;
  }>;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;

    // Validate request body
    const validationResult = requestBodySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { query } = validationResult.data;

    console.log("[You.com Express] Query:", query);

    // Call You.com Express API
    const response = await fetch("https://api.you.com/express", {
      method: "POST",
      headers: {
        "X-API-Key": env.YOU_COM,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent: "express",
        input: query,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[You.com Express] API error:", response.status, errorText);
      return NextResponse.json(
        {
          error: "You.com API error",
          status: response.status,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = (await response.json()) as YouExpressResponse;

    console.log("[You.com Express] Got answer:", data.answer?.substring(0, 100));

    // Return answer with citations
    return NextResponse.json({
      query,
      answer: data.answer,
      citations: data.citations ?? [],
      webResults: data.web_results ?? [],
    });
  } catch (error) {
    console.error("[You.com Express] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to get answer",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
