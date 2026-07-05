import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { createClient } from "@insforge/sdk";
import { checkRateLimit } from "@/lib/rate-limit";
import { summarizeSchema, withTimeout } from "@/lib/validation";

//this file copied from src/app/insforge/shorten/route.ts (which was mostly written using GitHub Copilot) and then the prompt was modified manually
//Copilot used to add authorization checks following design from chat api

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await auth();
    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed } = checkRateLimit(`summarize:${userId}`, 20, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = summarizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { text, targetLength } = parsed.data;

    const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL;
    if (!baseUrl) {
      console.error("[summarize] NEXT_PUBLIC_INSFORGE_BASE_URL is not set");
      return NextResponse.json(
        { error: "Summarization is not configured." },
        { status: 500 }
      );
    }

    const insforge = createClient({ baseUrl, edgeFunctionToken: token });

    const prompt = `Summarize the following text to approximately ${targetLength} characters (give a general overview of the text). \n\nText to summarize:\n${text}`;

    const completion = await withTimeout(
      insforge.ai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1024,
      }),
      60000,
      "Summarize completion"
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error("[summarize] upstream returned empty content");
      return NextResponse.json(
        { error: "Summarization service is unavailable. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ summary: content });
  } catch (err: unknown) {
    console.error("[summarize] handler error", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
