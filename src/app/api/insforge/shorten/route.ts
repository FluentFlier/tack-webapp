import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { checkRateLimit } from "@/lib/rate-limit";

//this file written almost entirely by GitHub Copilot with some fixes after Copilot tried guessing the API methods
//Copilot used to add authorization checks following design from chat api

type ReqBody = {
  text: string;
  percent: number; // percent to shorten (e.g., 30 means reduce length by 30%)
};

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await auth();
    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    //this rate limiting copied from chat route
    const { allowed } = checkRateLimit(userId, 20, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const { text, percent } = (await request.json()) as ReqBody;
    if (typeof text !== "string" || typeof percent !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL;
    const apiKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

    const targetLen = Math.max(20, Math.round(text.length * (1 - percent / 100)));

    // Best-effort: try calling InsForge model gateway if env is configured.
    if (base && apiKey) {
      
        const host = base.replace(/\/?$/g, "");
        const endpoint = `${host}/api/ai/chat/completion`;

        const prompt = `Shorten the following paragraph to approximately ${targetLen} characters (preserve meaning and key points). Any quotes should be left intact even if it means not shortening the paragraph. \n\nParagraph:\n${text}`;

        const body = {
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          maxTokens: 1024,
        };

        const r = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });

        const json = await r.json().catch(() => ({}));

        // InsForge documented response shape: { success: true, text: "..." }
        if (r.ok && json && typeof json.text === "string") {
          return NextResponse.json({ shortened: json.text });
        }
        else if (!r.ok) {
          return NextResponse.json({ error: "!r.ok" }, { status: 500 });
        }
        else if (!json) {
          return NextResponse.json({ error: "!json" }, { status: 500 });
        }
        else if (!(typeof json.text === "string")) {
          return NextResponse.json({ error: "!(typeof json.txt === 'string')" }, { status: 500 });
        }
      
    }
    else {
        return NextResponse.json({ error: "InsForge API not configured" }, { status: 500 });
    }

  }
    catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
