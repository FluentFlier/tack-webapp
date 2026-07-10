"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@insforge/nextjs";
import { useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { LandingNavMobile } from "@/components/layout/LandingNavMobile";

// ─── Team data ───────────────────────────────────────────────────────────────
const team = [
  { name: "Jacob Amstutz", title: "CEO", initials: "JA" },
  { name: "Jay Rao", title: "CTO", initials: "JR" },
  { name: "Anushka Raghavendra", title: "COO", initials: "AR" },
  { name: "Vishnu", title: "CPO", initials: "V" },
];

// ─── Values data ─────────────────────────────────────────────────────────────
const values = [
  {
    title: "Accessibility First",
    body: "Every design decision is evaluated through the lens of assistive technology compatibility.",
  },
  {
    title: "Privacy by Design",
    body: "We never store browsing data. Your sessions are your own.",
  },
  {
    title: "Human-Centered AI",
    body: "AI augments human capability; it never replaces the user's agency.",
  },
];

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

// ─── About page ───────────────────────────────────────────────────────────────
export default function About() {
  return (
    <div className="lpage-root">
      {/* ─── Navigation ───────────────────────────────────────────── */}
      <header role="banner" className="lpage-nav">
        <div className="lpage-nav__inner">
          <Link href="/" className="lpage-logo" aria-label="Tack – Home">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path d="M4 23H24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
              <path d="M13.2 15.8L20 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="10.5" cy="10.5" r="5" style={{ fill: "hsl(var(--primary))" }} />
            </svg>
            Tack
          </Link>

          <nav aria-label="Site navigation" className="lpage-nav__links">
            <Link href="/" className="lpage-nav__link">
              Home
            </Link>
            <Link
              href="/about"
              className="lpage-nav__link lpage-nav__link--active"
              aria-current="page"
            >
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

      <main id="main-content-about">
        {/* ═════════════════════════════════════════════════════════
            TEAM
            ════════════════════════════════════════════════════════ */}
        <section id="team" aria-labelledby="team-heading" className="lpage-section">
          <div className="lpage-section__inner">
            <FadeIn>
              <p className="lpage-eyebrow" aria-hidden="true">About Us</p>
              <h1 id="team-heading" className="lpage-heading">
                Meet the <span className="lpage-heading__accent">team</span>
              </h1>
            </FadeIn>

            <ul className="lpage-team__grid" role="list">
              {team.map((member, i) => (
                <FadeIn key={member.name} delay={i * 0.1}>
                  <li className="lpage-team-card">
                    <div
                      className="lpage-avatar"
                      aria-label={`${member.name} profile placeholder`}
                    >
                      <span className="lpage-avatar__initials" aria-hidden="true">
                        {member.initials}
                      </span>
                    </div>
                    <div className="lpage-team-card__info">
                      <h2 className="lpage-team-card__name">{member.name}</h2>
                      <p className="lpage-team-card__title">{member.title}</p>
                    </div>
                  </li>
                </FadeIn>
              ))}
            </ul>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════
            VALUES
            ════════════════════════════════════════════════════════ */}
        <section
          id="values"
          aria-labelledby="values-heading"
          className="lpage-section lpage-section--alt"
        >
          <div className="lpage-section__inner">
            <FadeIn>
              <p className="lpage-eyebrow" aria-hidden="true">What We Believe</p>
              <h2 id="values-heading" className="lpage-heading">
                Our <span className="lpage-heading__accent">values</span>
              </h2>
            </FadeIn>

            <ul className="lpage-values__grid" role="list">
              {values.map((v, i) => (
                <FadeIn key={v.title} delay={i * 0.12}>
                  <li className="lpage-value-card">
                    <div className="lpage-value-card__icon" aria-hidden="true">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M8.5 12l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h3 className="lpage-value-card__title">{v.title}</h3>
                    <p className="lpage-value-card__body">{v.body}</p>
                  </li>
                </FadeIn>
              ))}
            </ul>
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
  );
}
