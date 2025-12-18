import { NextResponse } from "next/server";
import { env } from "@/env";

export async function GET() {
  try {
    // Return the API key directly
    // Note: This is acceptable for personal projects, but for production apps
    // you should implement proper token scoping or use Deepgram's temporary key API
    return NextResponse.json({ token: env.DEEPGRAM_API_KEY });
  } catch (error) {
    console.error("Error returning Deepgram token:", error);
    return NextResponse.json(
      { error: "Failed to get Deepgram token" },
      { status: 500 }
    );
  }
}
