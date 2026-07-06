"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@insforge/nextjs";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

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

        <div aria-label="" className="flex items-center gap-3">
          <SignedIn>
            <Link href="/chat" aria-label="Go to chat">
              <Button variant="ghost" size="sm" className="app-header__nav-btn">
                Chat
              </Button>
            </Link>
            <Link href="/pdf-reading" aria-label="Go to PDF reader">
              <Button variant="ghost" size="sm" className="app-header__nav-btn">
                PDF Reader
              </Button>
            </Link>
            <Link href="/settings" aria-label="Settings">
              <Button variant="ghost" size="sm" className="app-header__nav-btn">
                <Settings className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Settings
              </Button>
            </Link>
            <ThemeToggle />
            <div aria-label="User menu" className="ml-1 pl-3 border-l border-[hsl(var(--border))]">
              <span aria-label="User Profile Menu"></span>
              <UserButton />
            </div>
          </SignedIn>
          <SignedOut>
            <ThemeToggle />
            <SignInButton>
              <button className="landing-signin-btn" type="button">Sign In</button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
