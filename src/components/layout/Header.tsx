"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@insforge/nextjs";
import { Button } from "@/components/ui/button";
import { MessageSquare, Settings, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header
      role="banner"
      className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded-sm"
          aria-label="Tack - Home"
        >
          <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/10 border border-primary/20">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          </div>
          <span className="font-serif text-lg font-medium italic">Tack</span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-1">
          <SignedIn>
            <Link href="/chat" aria-label="Go to chat">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Chat
              </Button>
            </Link>
            <Link href="/settings" aria-label="Settings">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" aria-hidden="true" />
                Settings
              </Button>
            </Link>
            <div className="ml-2 pl-2 border-l border-border/50">
              <UserButton />
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <Button size="sm">Sign In</Button>
            </SignInButton>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
