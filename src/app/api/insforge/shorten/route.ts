import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { createClient } from "@insforge/sdk";
import { checkRateLimit } from "@/lib/rate-limit";
import { shortenSchema, withTimeout } from "@/lib/validation";

//this file written almost entirely by GitHub Copilot with some fixes after Copilot tried guessing the API methods
//Copilot used to add authorization checks following design from chat api

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await auth();
    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed } = checkRateLimit(`shorten:${userId}`, 20, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = shortenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { text, percent } = parsed.data;

    const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL;
    if (!baseUrl) {
      console.error("[shorten] NEXT_PUBLIC_INSFORGE_BASE_URL is not set");
      return NextResponse.json(
        { error: "Shortening is not configured." },
        { status: 500 }
      );
    }

    const insforge = createClient({ baseUrl, edgeFunctionToken: token });

    const targetLen = Math.max(20, Math.round(text.length * (1 - percent / 100)));
    const prompt = `Shorten the following paragraph to approximately ${targetLen} characters (preserve meaning and key points). Any quotes should be left intact even if it means not shortening the paragraph. \n\nParagraph:\n${text}`;

    const completion = await withTimeout(
      insforge.ai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1024,
      }),
      60000,
      "Shorten completion"
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error("[shorten] upstream returned empty content");
      return NextResponse.json(
        { error: "Shortening service is unavailable. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ shortened: content });
  } catch (err: unknown) {
    console.error("[shorten] handler error", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
