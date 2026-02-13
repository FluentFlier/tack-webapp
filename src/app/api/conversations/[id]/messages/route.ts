import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { createClient } from "@insforge/sdk";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { token, userId } = await auth();

    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
      edgeFunctionToken: token,
    });

    // Verify conversation belongs to user
    const { data: conv, error: convError } = await insforge.database
      .from("conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (convError || !conv) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Fetch messages
    const { data: messages, error: msgError } = await insforge.database
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (msgError) {
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
