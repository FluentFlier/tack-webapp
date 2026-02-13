"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { insforge } from "@/lib/insforge";
import { useAuth } from "@insforge/nextjs";
import type { Conversation } from "@/types";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    async function loadConversations() {
      const { data, error } = await insforge.database
        .from("conversations")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setConversations(data as Conversation[]);
      }
      setLoading(false);
    }

    loadConversations();
  }, [isSignedIn]);

  return (
    <aside
      role="complementary"
      aria-label="Conversation history"
      className="w-64 border-r bg-muted/40 flex flex-col h-full"
    >
      <div className="p-3">
        <Link href="/chat">
          <Button
            className="w-full justify-start"
            variant="outline"
            aria-label="Start a new chat"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            New Chat
          </Button>
        </Link>
      </div>

      <nav
        aria-label="Chat history"
        className="flex-1 overflow-y-auto px-2 pb-4"
      >
        {loading ? (
          <p className="text-sm text-muted-foreground px-2 py-1" role="status">
            Loading conversations...
          </p>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-1">
            No conversations yet
          </p>
        ) : (
          <ul role="list" className="space-y-1">
            {conversations.map((conv) => {
              const isActive = pathname === `/chat/${conv.id}`;
              return (
                <li key={conv.id}>
                  <Link
                    href={`/chat/${conv.id}`}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring",
                      isActive && "bg-accent font-medium"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <MessageSquare
                      className="h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">{conv.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
