import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env";

// Request body validation schema
const requestBodySchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  count: z.number().int().min(1).max(20).optional().default(5),
  freshness: z.enum(["day", "week", "month", "year"]).optional(),
});

// You.com Search API response types
interface YouSearchResult {
  url: string;
  title: string;
  description: string;
  snippets?: string[];
  thumbnail_url?: string;
  published_date?: string;
  author?: string;
}

interface YouSearchResponse {
  hits: YouSearchResult[];
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

    const { query, count, freshness } = validationResult.data;

    console.log("[You.com Search] Query:", query, "Count:", count);

    // Build You.com API URL
    const params = new URLSearchParams({
      query,
      count: count.toString(),
    });

    if (freshness) {
      params.append("freshness", freshness);
    }

    // Call You.com Search API
    const response = await fetch(
      `https://api.you.com/search?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": env.YOU_COM,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[You.com Search] API error:", response.status, errorText);
      return NextResponse.json(
        {
          error: "You.com API error",
          status: response.status,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = (await response.json()) as YouSearchResponse;

    console.log(`[You.com Search] Got ${data.hits?.length ?? 0} results`);

    // Return results
    return NextResponse.json({
      query,
      results: data.hits ?? [],
      count: data.hits?.length ?? 0,
    });
  } catch (error) {
    console.error("[You.com Search] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to search",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
