import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { createClient } from "@insforge/sdk";

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await auth();

    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversation_id } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
      edgeFunctionToken: token,
    });

    // Create or use existing conversation
    let convId = conversation_id;
    if (!convId) {
      const { data: conv, error: convError } = await insforge.database
        .from("conversations")
        .insert({ user_id: userId, title: message.slice(0, 100) })
        .select()
        .single();

      if (convError || !conv) {
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 }
        );
      }
      convId = conv.id;
    }

    // Save user message
    await insforge.database.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
      metadata: {},
    });

    // Build system prompt for accessibility focus
    const systemPrompt = `You are Tack, an AI assistant designed to help blind and visually impaired users access the internet.
Your responses should be:
- Clear and well-structured with logical flow
- Use plain language, avoiding visual references like "as you can see" or "the blue button"
- When describing web content, focus on the information hierarchy and meaning
- Use numbered lists and headings when organizing complex information
- Keep responses concise but thorough
- If asked to summarize a URL, explain that you'll process it and provide a structured summary`;

    // Get AI response
    const completion = await insforge.ai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const assistantContent =
      completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Save assistant message
    const { data: savedMessage, error: msgError } = await insforge.database
      .from("messages")
      .insert({
        conversation_id: convId,
        role: "assistant",
        content: assistantContent,
        metadata: {},
      })
      .select()
      .single();

    if (msgError) {
      return NextResponse.json(
        { error: "Failed to save response" },
        { status: 500 }
      );
    }

    // Update conversation timestamp
    await insforge.database
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convId);

    return NextResponse.json({
      message: savedMessage,
      conversation_id: convId,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
