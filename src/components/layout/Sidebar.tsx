"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { insforge } from "@/lib/insforge";
import { useAuth } from "@insforge/nextjs";
import type { Conversation } from "@/types";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const loadConversations = useCallback(async () => {
    if (!isSignedIn) return;
    const { data, error } = await insforge.database
      .from("conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setConversations(data as Conversation[]);
    }
    setLoading(false);
  }, [isSignedIn]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Listen for custom event to refresh sidebar
  useEffect(() => {
    const handleRefresh = () => loadConversations();
    window.addEventListener("sidebar:refresh", handleRefresh);
    return () => window.removeEventListener("sidebar:refresh", handleRefresh);
  }, [loadConversations]);

  const deleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm("Delete this conversation?");
    if (!confirmed) return;

    await insforge.database
      .from("conversations")
      .delete()
      .eq("id", convId);

    setConversations((prev) => prev.filter((c) => c.id !== convId));

    if (pathname === `/chat/${convId}`) {
      router.push("/chat");
    }
  };

  return (
    <aside
      role="complementary"
      aria-label="Conversation history"
      className="app-sidebar w-64 flex flex-col h-full"
    >
      <div className="p-3">
        <Link href="/chat">
          <Button
            className="app-sidebar__new-chat w-full justify-start"
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
                <li key={conv.id} className="group relative">
                  <Link
                    href={`/chat/${conv.id}`}
                    className={cn(
                      "app-sidebar__item flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-ring",
                      isActive && "app-sidebar__item--active font-medium"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <MessageSquare
                      className="h-3.5 w-3.5 shrink-0 opacity-50"
                      aria-hidden="true"
                    />
                    <span className="truncate">{conv.title}</span>
                  </Link>
                  <button
                    onClick={(e) => deleteConversation(e, conv.id)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    aria-label={`Delete conversation: ${conv.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-destructive" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
