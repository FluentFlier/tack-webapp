"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@insforge/nextjs";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export function Header() {
  return (
    <header
      role="banner"
      className="app-header sticky top-0 z-40"
    >
      <div className="flex h-16 items-center justify-between px-5">
        <Link
          href="/"
          className="app-header__logo flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
          aria-label="Tack - Home"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
            className="app-header__logo-icon"
          >
            <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M9 14.5C9 11.5 11.5 9 14 9C16.5 9 19 11.5 19 14.5C19 17.5 16.5 19 14 19"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>TACK</span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-3">
          <SignedIn>
            <Link href="/chat" aria-label="Go to chat">
              <Button variant="ghost" size="sm" className="text-[rgba(240,237,237,0.6)] hover:text-[rgba(240,237,237,0.9)] hover:bg-[rgba(140,100,220,0.08)]">
                Chat
              </Button>
            </Link>
            <Link href="/pdf" aria-label="PDF Reader">
              <Button variant="ghost" size="sm">
                <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                PDF Reader
              </Button>
            </Link>
            <Link href="/settings" aria-label="Settings">
              <Button variant="ghost" size="sm" className="text-[rgba(240,237,237,0.6)] hover:text-[rgba(240,237,237,0.9)] hover:bg-[rgba(140,100,220,0.08)]">
                <Settings className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Settings
              </Button>
            </Link>
            <div className="ml-2 pl-2 border-l border-border/50">
              <UserButton />
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <button className="landing-signin-btn" type="button">Sign In</button>
            </SignInButton>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
