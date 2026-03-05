import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { createClient } from "@insforge/sdk";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { checkRateLimit } from "@/lib/rate-limit";

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  return Array.from(new Set(text.match(urlRegex) || []));
}

async function extractContent(url: string): Promise<{
  title: string;
  content: string;
  url: string;
} | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Tack/1.0 (Accessibility Assistant)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (!article) return null;

    const content = (article.textContent || "").slice(0, 4000);
    return { title: article.title || "Untitled", content, url };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await auth();
    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed } = checkRateLimit(userId, 20, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const { message, conversation_id } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const sanitizedMessage = message.slice(0, 10000).trim();
    if (!sanitizedMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
      edgeFunctionToken: token,
    });

    let convId = conversation_id;
    if (!convId) {
      const { data: conv, error: convError } = await insforge.database
        .from("conversations")
        .insert({ user_id: userId, title: sanitizedMessage.slice(0, 100) })
        .select()
        .single();

      if (convError || !conv) {
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
      }
      convId = conv.id;
    }

    await insforge.database.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: sanitizedMessage,
      metadata: {},
    });

    const urls = extractUrls(sanitizedMessage);
    const extractions = await Promise.all(urls.map(extractContent));
    const validExtractions = extractions.filter(Boolean) as {
      title: string;
      content: string;
      url: string;
    }[];

    let contextBlock = "";
    const sources: { title: string; url: string }[] = [];
    if (validExtractions.length > 0) {
      contextBlock = "\n\n--- EXTRACTED WEB CONTENT ---\n";
      for (const ext of validExtractions) {
        contextBlock += `\nSource: ${ext.title} (${ext.url})\n${ext.content}\n---\n`;
        sources.push({ title: ext.title, url: ext.url });
      }
      contextBlock += "\n--- END EXTRACTED CONTENT ---\n";
    }

    const systemPrompt = `You are Tack, an AI assistant designed to help blind and visually impaired users access the internet.
Your responses should be:
- Clear and well-structured with logical flow
- Use plain language, avoiding visual references like "as you can see" or "the blue button"
- When describing web content, focus on the information hierarchy and meaning
- Use numbered lists and headings when organizing complex information
- Keep responses concise but thorough
- When summarizing extracted web content, faithfully represent the original meaning — do not add interpretations or opinions not present in the source
- Always indicate which source each piece of information comes from when multiple sources are provided
- If the extracted content is insufficient to answer the user's question, say so clearly`;

    const userContent = validExtractions.length > 0
      ? `${sanitizedMessage}${contextBlock}\nBased on the extracted content above, please respond to my message. Cite sources by title when referencing information.`
      : sanitizedMessage;

    const completion = await insforge.ai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    const assistantContent =
      completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    const metadata: Record<string, unknown> = {};
    if (sources.length > 0) {
      metadata.sources = sources;
      metadata.source_url = sources[0].url;
    }

    const { data: savedMessage, error: msgError } = await insforge.database
      .from("messages")
      .insert({
        conversation_id: convId,
        role: "assistant",
        content: assistantContent,
        metadata,
      })
      .select()
      .single();

    if (msgError) {
      return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
    }

    await insforge.database
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convId);

    return NextResponse.json({ message: savedMessage, conversation_id: convId });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
