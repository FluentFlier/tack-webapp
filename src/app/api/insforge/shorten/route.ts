import { NextResponse } from "next/server";

type ReqBody = {
  text: string;
  percent: number; // percent to shorten (e.g., 30 means reduce length by 30%)
};

export async function POST(request: Request) {
  try {
    const { text, percent } = (await request.json()) as ReqBody;
    if (typeof text !== "string" || typeof percent !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL;
    const apiKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

    const targetLen = Math.max(20, Math.round(text.length * (1 - percent / 100)));

    // Best-effort: try calling InsForge model gateway if env is configured.
    if (base && apiKey) {
      try {
        const host = base.replace(/\/?$/g, "");
        const endpoint = `${host}/api/ai/chat/completion`;

        const prompt = `Shorten the following paragraph to approximately ${targetLen} characters (preserve meaning and key points).\n\nParagraph:\n${text}`;

        const body = {
          model: "openai/gpt-4",
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
        if (r.ok && json && json.success && typeof json.text === "string") {
          return NextResponse.json({ shortened: json.text });
        }
      } catch (err) {
        console.error("InsForge chat/completion call failed:", err);
      }
    }

  }
    catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
