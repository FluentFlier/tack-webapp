"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { SignedIn, SignedOut, SignInButton } from "@insforge/nextjs";
import { Search } from "lucide-react";
import { LandingNavMobile } from "@/components/layout/LandingNavMobile";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<"name" | "email" | "subject" | "message", string>>;

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const subject = String(data.get("subject") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const next: FieldErrors = {};
    if (!name) next.name = "Name is required.";
    if (!email) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address.";
    if (!subject) next.subject = "Subject is required.";
    if (!message) next.message = "Message is required.";

    if (Object.keys(next).length > 0) {
      setErrors(next);
      setStatus("idle");
      return;
    }

    const body = `From: ${name} <${email}>\n\n${message}`;
    const mailto = `mailto:support@tack.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setErrors({});
    setStatus("sent");
    form.reset();
  }

  return (
    <div className="cpage-root">
      <header role="banner" className="cpage-nav">
        <div className="cpage-nav__inner">
          <Link href="/" className="cpage-logo" aria-label="Tack – Home">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path d="M4 23H24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
              <path d="M13.2 15.8L20 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="10.5" cy="10.5" r="5" style={{ fill: "hsl(var(--primary))" }} />
            </svg>
            Tack
          </Link>

          <nav aria-label="Main navigation" className="cpage-nav__links">
            <Link href="/" className="cpage-nav__link">Home</Link>
            <Link href="/about" className="cpage-nav__link">About Us</Link>
            <Link href="/contact" className="cpage-nav__link cpage-nav__link--active" aria-current="page">Contact Us</Link>
          </nav>

          <LandingNavMobile />

          <div className="cpage-nav__actions">
            <button className="cpage-nav__icon-btn" aria-label="Search" type="button">
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
            <SignedOut>
              <SignInButton>
                <button className="cpage-signin-btn" type="button">Sign In</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/chat">
                <button className="cpage-signin-btn" type="button">Open Chat</button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="cpage-main">
        <section aria-labelledby="contact-heading" className="cpage-section">
          <div className="cpage-section__inner">
            <p className="cpage-eyebrow" aria-hidden="true">Get in Touch</p>
            <h1 id="contact-heading" className="cpage-heading">
              Contact <span className="cpage-heading__accent">Us</span>
            </h1>
            <p className="cpage-body">
              Have a question, feedback, or want to learn more about Tack?
              We&apos;d love to hear from you.
            </p>

            <form
              className="cpage-form"
              aria-label="Contact form"
              noValidate
              onSubmit={handleSubmit}
            >
              <div className="cpage-form__group">
                <label htmlFor="contact-name" className="cpage-form__label">Name</label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  className="cpage-form__input"
                  placeholder="Your name"
                  autoComplete="name"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "contact-name-error" : undefined}
                  required
                />
                {errors.name && (
                  <p id="contact-name-error" role="alert" className="cpage-form__error">{errors.name}</p>
                )}
              </div>

              <div className="cpage-form__group">
                <label htmlFor="contact-email" className="cpage-form__label">Email</label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  className="cpage-form__input"
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "contact-email-error" : undefined}
                  required
                />
                {errors.email && (
                  <p id="contact-email-error" role="alert" className="cpage-form__error">{errors.email}</p>
                )}
              </div>

              <div className="cpage-form__group">
                <label htmlFor="contact-subject" className="cpage-form__label">Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  name="subject"
                  className="cpage-form__input"
                  placeholder="How can we help?"
                  aria-invalid={errors.subject ? true : undefined}
                  aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                  required
                />
                {errors.subject && (
                  <p id="contact-subject-error" role="alert" className="cpage-form__error">{errors.subject}</p>
                )}
              </div>

              <div className="cpage-form__group">
                <label htmlFor="contact-message" className="cpage-form__label">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  className="cpage-form__input cpage-form__textarea"
                  placeholder="Tell us more…"
                  rows={6}
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={errors.message ? "contact-message-error" : undefined}
                  required
                />
                {errors.message && (
                  <p id="contact-message-error" role="alert" className="cpage-form__error">{errors.message}</p>
                )}
              </div>

              <button type="submit" className="cpage-form__submit">
                Send Message
              </button>

              {status === "sent" && (
                <p role="status" className="cpage-form__success">
                  Your email client should open shortly. If it doesn&apos;t, write us at support@tack.ai.
                </p>
              )}
            </form>
          </div>
        </section>

        <section aria-labelledby="contact-alt-heading" className="cpage-section cpage-section--alt">
          <div className="cpage-section__inner cpage-alt-grid">
            <div className="cpage-alt-card">
              <p className="cpage-eyebrow">Email</p>
              <h2 id="contact-alt-heading" className="cpage-heading cpage-heading--sm">
                support@<span className="cpage-heading__accent">tack.ai</span>
              </h2>
              <p className="cpage-body">Reach our support team directly for account or technical issues.</p>
            </div>
            <div className="cpage-alt-card">
              <p className="cpage-eyebrow">Accessibility Feedback</p>
              <h2 className="cpage-heading cpage-heading--sm">
                a11y@<span className="cpage-heading__accent">tack.ai</span>
              </h2>
              <p className="cpage-body">Found a barrier? Tell us and we&apos;ll fix it fast.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
