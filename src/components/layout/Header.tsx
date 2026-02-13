"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@insforge/nextjs";
import { Button } from "@/components/ui/button";
import { MessageSquare, Settings } from "lucide-react";

export function Header() {
  return (
    <header
      role="banner"
      className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
          aria-label="Tack - Home"
        >
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
          Tack
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-2">
          <SignedIn>
            <Link href="/chat" aria-label="Go to chat">
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                Chat
              </Button>
            </Link>
            <Link href="/settings" aria-label="Settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                Settings
              </Button>
            </Link>
            <UserButton />
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
