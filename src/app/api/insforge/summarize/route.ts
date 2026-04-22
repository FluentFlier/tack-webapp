import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { checkRateLimit } from "@/lib/rate-limit";

//this file copied from src/app/insforge/shorten/route.ts (which was mostly written using GitHub Copilot) and then the prompt was modified manually
//Copilot used to add authorization checks following design from chat api

type ReqBody = {
  text: string;
  targetLength: number; 
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
        
    const { text, targetLength } = (await request.json()) as ReqBody;
    if (typeof text !== "string" || typeof targetLength !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL;
    const apiKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

    const targetLen = targetLength

    // Best-effort: try calling InsForge model gateway if env is configured.
    if (base && apiKey) {
      
        const host = base.replace(/\/?$/g, "");
        const endpoint = `${host}/api/ai/chat/completion`;

        const prompt = `Summarize the following text to approximately ${targetLen} characters (give a general overview of the text). \n\nText to summarize:\n${text}`;

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
          return NextResponse.json({ summary: json.text });
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
