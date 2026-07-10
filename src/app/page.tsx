"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@insforge/nextjs";
import { LenisProvider } from "@/components/layout/LenisProvider";
import { useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { LandingNavMobile } from "@/components/layout/LandingNavMobile";

// ─── Animated section wrapper (fade-in only, reduced-motion aware) ──────────
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const prefersReduced = useReducedMotion();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: prefersReduced || isInView ? 1 : 0,
        transform:
          prefersReduced || isInView ? "translateY(0)" : "translateY(16px)",
        transition: prefersReduced
          ? "none"
          : `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <LenisProvider>
      <div className="lpage-root">

        {/* ─── Navigation ───────────────────────────────────────────── */}
        <header role="banner" className="lpage-nav">
          <div className="lpage-nav__inner">
            <Link href="/" className="lpage-logo" aria-label="Tack – Home">
              {/* Pushpin mark — green head, needle pinned into baseline */}
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <path d="M4 23H24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
                <path d="M13.2 15.8L20 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="10.5" cy="10.5" r="5" style={{ fill: "hsl(var(--primary))" }} />
              </svg>
              Tack
            </Link>

            <nav aria-label="Site navigation" className="lpage-nav__links">
              <Link
                href="/"
                className="lpage-nav__link lpage-nav__link--active"
                aria-current="page"
              >
                Home
              </Link>
              <Link href="/about" className="lpage-nav__link">
                About Us
              </Link>
              <Link href="/contact" className="lpage-nav__link">
                Contact Us
              </Link>
            </nav>

            <LandingNavMobile />

            <div className="lpage-nav__actions">
              <SignedOut>
                <SignInButton className="lpage-signin-btn">Sign In</SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/chat">
                  <button className="lpage-signin-btn" type="button">Open Chat</button>
                </Link>
                <Link href="/pdf-reading">
                  <button className="lpage-signin-btn" type="button">PDF Reader</button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════
            HERO — calm editorial: oat surface, serif headline, hairlines
            ══════════════════════════════════════════════════════════ */}
        <main id="main-content-landing">
          <section aria-labelledby="hero-heading" className="lpage-hero">
            <div className="lpage-hero__inner">
              <p className="lpage-eyebrow" aria-hidden="true">
                An AI Reading Companion
              </p>
              <h1 id="hero-heading" className="lpage-hero__heading">
                <span className="lpage-hero__heading-line">The Internet,</span>
                <span className="lpage-hero__heading-line lpage-hero__heading-line--accent">
                  Made Accessible
                </span>
              </h1>

              <p className="lpage-hero__subtext">
                Tack is an AI assistant that helps blind and visually impaired users
                navigate, read, and understand web content through natural conversation.
              </p>

              <div className="lpage-hero__cta-group">
                <SignedOut>
                  <a href="#features" className="lpage-cta lpage-cta--ghost">
                    Learn More
                  </a>
                  <SignInButton>
                    <button className="lpage-cta" type="button">Get Started Free</button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/chat">
                    <button className="lpage-cta" type="button">Open Chat</button>
                  </Link>
                  <Link href="/pdf-reading">
                    <button className="lpage-cta lpage-cta--ghost" type="button">
                      Open PDF Reader
                    </button>
                  </Link>
                </SignedIn>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════
              FEATURES
              ════════════════════════════════════════════════════════ */}
          <section id="features" aria-labelledby="features-heading" className="lpage-section lpage-section--alt">
            <div className="lpage-section__inner">
              <FadeIn>
                <p className="lpage-eyebrow" aria-hidden="true">What Tack Does</p>
                <h2 id="features-heading" className="lpage-heading">
                  Built for <span className="lpage-heading__accent">real access</span>
                </h2>
              </FadeIn>

              <ul className="lpage-features__grid" role="list">
                {[
                  {
                    num: "01",
                    title: "AI Chat Interface",
                    body: "Ask anything about a web page. Get clear, structured answers optimized for screen readers.",
                  },
                  {
                    num: "02",
                    title: "PDF Reader",
                    body: "Upload any PDF and navigate it through conversation — no more inaccessible document formats.",
                  },
                  {
                    num: "03",
                    title: "Accessibility Settings",
                    body: "Seven color profiles, four font sizes, and a full reduced-motion mode — all persistent across sessions.",
                  },
                ].map((feat, i) => (
                  <FadeIn key={feat.num} delay={i * 0.1}>
                    <li className="lpage-feature-card">
                      <span className="lpage-feature-card__num" aria-hidden="true">{feat.num}</span>
                      <h3 className="lpage-feature-card__title">{feat.title}</h3>
                      <p className="lpage-feature-card__body">{feat.body}</p>
                    </li>
                  </FadeIn>
                ))}
              </ul>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════
              MISSION
              ════════════════════════════════════════════════════════ */}
          <section aria-labelledby="mission-heading" className="lpage-section">
            <div className="lpage-section__inner lpage-mission__inner">
              <FadeIn>
                <p className="lpage-eyebrow lpage-eyebrow--center" aria-hidden="true">
                  Our Mission
                </p>
                <h2 id="mission-heading" className="lpage-heading lpage-heading--center">
                  Making the web<br />
                  <span className="lpage-heading__accent">accessible for all</span>
                </h2>
                <p className="lpage-body lpage-body--center">
                  Tack was built on a simple belief: the internet should be navigable
                  by everyone, regardless of ability. We combine AI with thoughtful
                  design to give blind and visually impaired users a voice-first
                  browsing experience that doesn&apos;t compromise on capability.
                </p>
              </FadeIn>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════
              STORY
              ════════════════════════════════════════════════════════ */}
          <section aria-labelledby="story-heading" className="lpage-section lpage-section--alt">
            <div className="lpage-section__inner lpage-story__grid">
              {/* Decorative editorial panel */}
              <FadeIn className="lpage-story__panel" delay={0.1}>
                <div className="lpage-story__visual" aria-hidden="true">
                  <span className="lpage-story__visual-label">Our Story</span>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="17" cy="20" r="4" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M6 32l10-8 8 6 6-5 12 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </FadeIn>

              <FadeIn className="lpage-story__text">
                <p className="lpage-eyebrow" aria-hidden="true">Where We Began</p>
                <h2 id="story-heading" className="lpage-heading lpage-heading--sm">
                  Born from a <span className="lpage-heading__accent">real need</span>
                </h2>
                <p className="lpage-body">
                  Our founders watched a family member struggle with screen readers
                  that couldn&apos;t keep up with modern, dynamic web pages. The gap
                  between what the web promised and what was actually accessible
                  was enormous.
                </p>
                <p className="lpage-body">
                  We set out to bridge that gap with an AI layer that could
                  understand any page and present it clearly — no matter how
                  complex the underlying markup.
                </p>
              </FadeIn>
            </div>
          </section>

          {/* ─── Footer ───────────────────────────────────────────── */}
          <footer className="lpage-footer" role="contentinfo">
            <div className="lpage-footer__inner">
              <Link href="/" className="lpage-logo lpage-logo--footer" aria-label="Tack – Home">
                <svg width="20" height="20" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                  <path d="M4 23H24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
                  <path d="M13.2 15.8L20 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="10.5" cy="10.5" r="5" style={{ fill: "hsl(var(--primary))" }} />
                </svg>
                Tack
              </Link>
              <p className="lpage-footer__copy">
                © {new Date().getFullYear()} Tack. Accessibility is not a feature — it&apos;s a foundation.
              </p>
              <nav aria-label="Footer navigation" className="lpage-footer__links">
                <Link href="/about" className="lpage-footer__link">About</Link>
                <Link href="/chat" className="lpage-footer__link">Chat</Link>
                <Link href="/pdf-reading" className="lpage-footer__link">PDF Reader</Link>
              </nav>
            </div>
          </footer>
        </main>
      </div>
    </LenisProvider>
  );
}
