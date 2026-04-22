import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton } from "@insforge/nextjs";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function Home() {
  return (
    <div className="landing-root">
      {/* ─── Background image layer ─── */}
      <div className="landing-bg" aria-hidden="true">
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          priority
          style={{ objectFit: "cover" }}
        />
      </div>

      {/* ─── Dark overlay + gradient ─── */}
      <div className="landing-overlay" aria-hidden="true" />

      {/* ─── Ambient gradient orbs ─── */}
      <div className="landing-orb landing-orb--purple" aria-hidden="true" />
      <div className="landing-orb landing-orb--blue" aria-hidden="true" />

      {/* ─── Top Navigation ─── */}
      <header className="landing-nav">
        <nav className="landing-nav__inner" aria-label="Site header">
          {/* Logo */}
          <Link href="/" className="landing-logo" aria-label="Tack – Home">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden="true"
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

          {/* Navigation links */}
          <nav aria-label="Main navigation" className="landing-nav__links">
            <Link href="/" className="landing-nav__link landing-nav__link--active">
              Home
            </Link>
            <Link href="/about" className="landing-nav__link">
              About Us
            </Link>
            <Link href="/contact" className="landing-nav__link">
              Contact Us
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="landing-nav__actions">
            <button
              className="landing-nav__icon-btn"
              aria-label="Search"
              type="button"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>

            <SignedOut>
              <SignInButton>
                <button className="landing-signin-btn" type="button">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Link href="/chat">
                <button className="landing-signin-btn" type="button">
                  Open Chat
                </button>
              </Link>
              <Link href="/pdf-reading">
                <button className="landing-signin-btn" type="button">
                  PDF Reader
                </button>
              </Link>
            </SignedIn>
          </div>
        </nav>
      </header>

      {/* ─── Hero Section ─── */}
      <main className="landing-hero">
        <section aria-labelledby="hero-heading" className="landing-hero__content">
          <h1 id="hero-heading" className="landing-hero__heading">
            <span className="landing-hero__heading-line">The Internet,</span>
            <span className="landing-hero__heading-line landing-hero__heading-line--accent">
              Made Accessible
            </span>
          </h1>

          <p className="landing-hero__subtext">
            Tack is an AI assistant that helps blind and visually impaired users
            navigate, read, and understand web content through natural conversation.
          </p>

          <div className="landing-hero__cta-group flex flex-row gap-3">
            <SignedOut>
              <Link href="/about">
                <Button size="lg" className="landing-cta-btn">
                  Learn More
                </Button>
              </Link>
              <SignInButton>
                <Button size="lg" className="landing-cta-btn">
                  Get Started Free
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/chat">
                <Button size="lg" className="landing-cta-btn m-2">
                  Open Chat
                </Button>
              </Link>
              <Link href="/pdf-reading">
                <Button size="lg" className="landing-cta-btn m-2">
                  Open PDF Reader
                </Button>
              </Link>
            </SignedIn>
          </div>
        </section>
      </main>
    </div>
  );
}
