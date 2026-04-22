"use client";

import Link from "next/link";
import { SignIn } from "@insforge/nextjs";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    /* Dark cinematic background matching the landing page theme */
    <div className="auth-login-root">
      {/* Ambient gradient orbs — decorative */}
      <div className="landing-orb landing-orb--purple" aria-hidden="true" />
      <div className="landing-orb landing-orb--blue" aria-hidden="true" />

      {/*
        ── MAIN LANDMARK ──────────────────────────────────────────────
        All visible login content lives inside <main> so screen readers
        can jump directly to it via the "Skip to main content" link in
        the root layout.
      */}
      <main
        id="login-main"
        className="auth-login-main"
        aria-labelledby="login-heading"
      >
        {/*
          ── PAGE HEADER ──────────────────────────────────────────────
          Contains the brand logo, page title, and subtitle.
          Using <header> inside <main> is valid — it becomes a
          "sectional header" (no banner role) rather than a page banner.
        */}
        <header className="auth-login-header">
          <Link
            href="/"
            className="auth-login-logo"
            aria-label="Tack – Back to home"
          >
            <svg
              width="26"
              height="26"
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

          <h1 id="login-heading" className="auth-login-heading">
            Welcome Back
          </h1>
          <p className="auth-login-subtext">
            Sign in to continue to your accessible web experience.
          </p>
        </header>

        {/*
          ── FORM SECTION ─────────────────────────────────────────────
          The InsForge <SignIn> component renders the email field,
          password field, "Forgot password?" link, and "Sign Up" link
          internally inside a <form> element — satisfying the form
          landmark requirement. We wrap it in a <section> for additional
          landmark context with a label.
        */}
        <section
          aria-labelledby="login-form-heading"
          className="auth-login-form-section"
        >
          {/* Visually hidden heading labels the section for AT */}
          <h2 id="login-form-heading" className="sr-only">
            Sign in form
          </h2>

          <SignIn
            afterSignInUrl="/chat"
            onSuccess={() => {
              router.push("/chat");
            }}
          />
        </section>

        {/*
          ── FOOTER LANDMARK ──────────────────────────────────────────
          <footer> inside <main> = "sectional footer" (no contentinfo
          role conflict with the page footer). Used for secondary info
          like security notices and legal links.
        */}
        <footer className="auth-login-footer">
          <p className="auth-login-footer__text">
            <span aria-hidden="true">🔒</span>{" "}
            Secured by{" "}
            <a
              href="https://insforge.app"
              target="_blank"
              rel="noopener noreferrer"
              className="auth-login-footer__link"
            >
              InsForge
            </a>
            {" · "}
            <Link href="/about" className="auth-login-footer__link">
              About Tack
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
