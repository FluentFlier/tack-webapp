"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@insforge/nextjs";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function Header() {
  const pathname = usePathname();

  return (
    <header
      role="banner"
      className="app-header sticky top-0 z-40"
    >
      <div className="flex h-14 items-center justify-between px-6">
        {/* Logo — weight-driven Inter with green dot */}
        <Link
          href="/"
          className="app-header__logo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-1 rounded-sm"
          aria-label="Tack — Home"
        >
          Tack<span className="app-header__logo-dot" aria-hidden="true">.</span>
        </Link>

        <nav aria-label="Site navigation" className="flex items-center gap-1">
          <SignedIn>
            <Link
              href="/chat"
              aria-current={pathname?.startsWith("/chat") ? "page" : undefined}
              className="app-header__nav-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              Chat
            </Link>
            <Link
              href="/pdf-reading"
              aria-current={pathname === "/pdf-reading" ? "page" : undefined}
              className="app-header__nav-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              PDF Reader
            </Link>
            <Link
              href="/settings"
              aria-current={pathname === "/settings" ? "page" : undefined}
              className="app-header__nav-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              Settings
            </Link>

            <div className="app-header__nav-divider mx-2" aria-hidden="true" />

            <ThemeToggle />

            <div
              aria-label="User menu"
              className="ml-2 pl-3 border-l border-[hsl(var(--border))]"
            >
              <span className="sr-only">User profile menu</span>
              <UserButton />
            </div>
          </SignedIn>

          <SignedOut>
            <ThemeToggle />
            <SignInButton>
              <button className="landing-signin-btn" type="button">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
