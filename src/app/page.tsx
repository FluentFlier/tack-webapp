"use client";

import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton } from "@insforge/nextjs";
import { Button } from "@/components/ui/button";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { LenisProvider } from "@/components/layout/LenisProvider";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useInView,
} from "framer-motion";
import { useRef } from "react";

// ─── Team data ───────────────────────────────────────────────────────────────
const team = [
  { name: "Jacob Amstutz", title: "CEO", initials: "JA", hue: "indigo" },
  { name: "Jay Rao", title: "CTO", initials: "JR", hue: "cyan" },
  { name: "Anushka Raghavendra", title: "COO", initials: "AR", hue: "violet" },
  { name: "Vishnu", title: "CPO", initials: "V", hue: "blue" },
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

// ─── Animated section wrapper ─────────────────────────────────────────────────
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
          prefersReduced || isInView ? "translateY(0)" : "translateY(20px)",
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
  const prefersReduced = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Parallax: orbs and hero text move at different rates
  const orbY = useTransform(scrollY, [0, 600], prefersReduced ? [0, 0] : [0, -80]);
  const heroTextY = useTransform(scrollY, [0, 600], prefersReduced ? [0, 0] : [0, -40]);

  return (
    <LenisProvider>
      <ScrollProgress />
      <div className="landing-root">

        {/* ─── Navigation ───────────────────────────────────────────── */}
        <header role="banner" className="landing-nav">
          <div aria-label="Main navigation" className="landing-nav__inner">
            <Link href="/" className="landing-logo" aria-label="Tack – Home">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
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

            <nav aria-label="Site navigation" className="landing-nav__links">
              <Link href="/" className="landing-nav__link landing-nav__link--active">
                Home
              </Link>
              <Link href="/#team" className="landing-nav__link">
                About Us
              </Link>
            </nav>

            <div className="landing-nav__actions">
              <SignedOut>
                <SignInButton className="landing-signin-btn">Sign In</SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/chat">
                  <button className="landing-signin-btn" type="button">Open Chat</button>
                </Link>
                <Link href="/pdf-reading">
                  <button className="landing-signin-btn" type="button">PDF Reader</button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════
            HERO
            ══════════════════════════════════════════════════════════ */}
        <main id="main-content-landing">
          <section
            aria-labelledby="hero-heading"
            className="landing-hero"
            ref={heroRef}
          >
            {/* ─── Hero background (scoped to this section only) ──── */}
            <div className="landing-bg" aria-hidden="true">
              <Image src="/hero-bg.png" alt="" fill priority style={{ objectFit: "cover" }} />
            </div>
            <div className="landing-overlay" aria-hidden="true" />
            <motion.div
              className="landing-orb landing-orb--purple"
              style={{ y: orbY }}
              aria-hidden="true"
            />
            <motion.div
              className="landing-orb landing-orb--blue"
              style={{ y: orbY }}
              aria-hidden="true"
            />

            <motion.div className="landing-hero__content" style={{ y: heroTextY }}>
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

              <div className="landing-hero__cta-group">
                <SignedOut>
                  <a href="#about" className="landing-cta-btn-ghost">
                    Learn More
                  </a>
                  <SignInButton>
                    <Button size="lg" className="landing-cta-btn">Get Started Free</Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/chat">
                    <Button size="lg" className="landing-cta-btn">Open Chat</Button>
                  </Link>
                  <Link href="/pdf-reading">
                    <Button size="lg" className="landing-cta-btn">Open PDF Reader</Button>
                  </Link>
                </SignedIn>
              </div>
            </motion.div>

          </section>

          {/* ═════════════════════════════════════════════════════════
              FEATURES
              ════════════════════════════════════════════════════════ */}
          <section aria-labelledby="features-heading" className="iso-section iso-features">
            <div className="iso-section__inner">
              <FadeIn>
                <h2 id="features-heading" className="iso-heading">
                  Built for <span className="iso-heading--accent">real access</span>
                </h2>
              </FadeIn>

              <ul className="iso-features__grid" role="list">
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
                    <li className="iso-feature-card">
                      <span className="iso-feature-card__num" aria-hidden="true">{feat.num}</span>
                      <h3 className="iso-feature-card__title">{feat.title}</h3>
                      <p className="iso-feature-card__body">{feat.body}</p>
                    </li>
                  </FadeIn>
                ))}
              </ul>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════
              MISSION
              ════════════════════════════════════════════════════════ */}
          <section aria-labelledby="mission-heading" className="iso-section iso-mission">
            <div className="iso-section__inner iso-mission__inner">
              <FadeIn>
                <h2 id="mission-heading" className="iso-heading iso-heading--center">
                  Making the web<br />
                  <span className="iso-heading--accent">accessible for all</span>
                </h2>
                <p className="iso-body iso-body--center">
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
          <section aria-labelledby="story-heading" className="iso-section iso-story">
            <div className="iso-section__inner iso-story__grid">
              {/* Visual panel */}
              <FadeIn className="iso-story__panel" delay={0.1}>
                <div className="iso-story__visual" aria-hidden="true">
                  <div className="iso-story__visual-inner">
                    <span className="iso-story__visual-label">OUR STORY</span>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                      <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
                      <circle cx="17" cy="20" r="4" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
                      <path d="M6 32l10-8 8 6 6-5 12 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                    </svg>
                  </div>
                </div>
              </FadeIn>

              <FadeIn className="iso-story__text">
                <h2 id="story-heading" className="iso-heading iso-heading--sm">
                  Born from a <span className="iso-heading--accent">real need</span>
                </h2>
                <p className="iso-body">
                  Our founders watched a family member struggle with screen readers
                  that couldn&apos;t keep up with modern, dynamic web pages. The gap
                  between what the web promised and what was actually accessible
                  was enormous.
                </p>
                <p className="iso-body">
                  We set out to bridge that gap with an AI layer that could
                  understand any page and present it clearly — no matter how
                  complex the underlying markup.
                </p>
              </FadeIn>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════
              TEAM
              ════════════════════════════════════════════════════════ */}
          <section aria-labelledby="team-heading" className="iso-section iso-team">
            <div className="iso-section__inner">
              <FadeIn>
                <h2 id="team-heading" className="iso-heading">
                  Meet the <span className="iso-heading--accent">team</span>
                </h2>
              </FadeIn>

              <ul className="iso-team__grid" role="list">
                {team.map((member, i) => (
                  <FadeIn key={member.name} delay={i * 0.1}>
                    <li className="iso-team-card">
                      <div
                        className={`iso-avatar iso-avatar--${member.hue}`}
                        aria-label={`${member.name} profile placeholder`}
                      >
                        <span className="iso-avatar__initials" aria-hidden="true">
                          {member.initials}
                        </span>
                      </div>
                      <div className="iso-team-card__info">
                        <h3 className="iso-team-card__name">{member.name}</h3>
                        <p className="iso-team-card__title">{member.title}</p>
                        {/* TODO: replace placeholder with real bio */}
                        <p className="iso-team-card__bio">Placeholder bio — update before launch.</p>
                      </div>
                    </li>
                  </FadeIn>
                ))}
              </ul>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════
              VALUES / ABOUT anchor
              ════════════════════════════════════════════════════════ */}
          <section
            id="about"
            aria-labelledby="values-heading"
            className="iso-section iso-values"
          >
            <div className="iso-section__inner">
              <FadeIn>
                <h2 id="values-heading" className="iso-heading">
                  Our <span className="iso-heading--accent">values</span>
                </h2>
              </FadeIn>

              <ul className="iso-values__grid" role="list">
                {values.map((v, i) => (
                  <FadeIn key={v.title} delay={i * 0.12}>
                    <li className="iso-value-card">
                      <div className="iso-value-card__icon" aria-hidden="true">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M8.5 12l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <h3 className="iso-value-card__title">{v.title}</h3>
                      <p className="iso-value-card__body">{v.body}</p>
                    </li>
                  </FadeIn>
                ))}
              </ul>
            </div>
          </section>

          {/* ─── Footer ───────────────────────────────────────────── */}
          <footer className="iso-footer" role="contentinfo">
            <div className="iso-footer__inner">
              <Link href="/" className="landing-logo" aria-label="Tack – Home">
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                  <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9 14.5C9 11.5 11.5 9 14 9C16.5 9 19 11.5 19 14.5C19 17.5 16.5 19 14 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>TACK</span>
              </Link>
              <p className="iso-footer__copy">
                © {new Date().getFullYear()} Tack. Accessibility is not a feature — it&apos;s a foundation.
              </p>
              <nav aria-label="Footer navigation" className="iso-footer__links">
                <a href="#about" className="iso-footer__link">About</a>
                <Link href="/chat" className="iso-footer__link">Chat</Link>
                <Link href="/pdf-reading" className="iso-footer__link">PDF Reader</Link>
              </nav>
            </div>
          </footer>
        </main>
      </div>
    </LenisProvider>
  );
}
