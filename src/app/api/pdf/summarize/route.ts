import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { createClient } from "@insforge/sdk";

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await auth();
    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, title } = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
      edgeFunctionToken: token,
    });

    const truncated = text.slice(0, 16000);

    const completion = await insforge.ai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Tack, an AI assistant for blind and visually impaired users.
Summarize the following document faithfully and accurately.
- Do not add interpretations or opinions not present in the source
- Preserve the key points, structure, and meaning of the original text
- Use clear, well-structured language with numbered lists for key points
- Start with a one-sentence overview, then list key points
- End with any important details or caveats from the document`,
        },
        {
          role: "user",
          content: `Please summarize this document titled "${title || "Untitled"}":\n\n${truncated}`,
        },
      ],
    });

    const summary =
      completion.choices[0]?.message?.content || "Unable to generate summary.";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("PDF summarize error:", error);
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
