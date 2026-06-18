"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@insforge/nextjs";
import { Search } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="about-root">
      <div className="landing-orb landing-orb--purple" aria-hidden="true" />
      <div className="landing-orb landing-orb--blue" aria-hidden="true" />

      <header role="banner" className="landing-nav">
        <div className="landing-nav__inner">
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

          <nav aria-label="Main navigation" className="landing-nav__links">
            <Link href="/" className="landing-nav__link">Home</Link>
            <Link href="/about" className="landing-nav__link">About Us</Link>
            <Link href="/contact" className="landing-nav__link landing-nav__link--active">Contact Us</Link>
          </nav>

          <div className="landing-nav__actions">
            <button className="landing-nav__icon-btn" aria-label="Search" type="button">
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
            <SignedOut>
              <SignInButton>
                <button className="landing-signin-btn" type="button">Sign In</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/chat">
                <button className="landing-signin-btn" type="button">Open Chat</button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="about-main">
        <section aria-labelledby="contact-heading" className="about-section">
          <div className="about-section__inner">
            <p className="about-section__eyebrow">Get in Touch</p>
            <h1 id="contact-heading" className="about-heading">
              Contact <span className="about-heading--accent">Us</span>
            </h1>
            <p className="about-body">
              Have a question, feedback, or want to learn more about Tack?
              We&apos;d love to hear from you.
            </p>

            <form
              className="contact-form"
              aria-label="Contact form"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="contact-form__group">
                <label htmlFor="contact-name" className="contact-form__label">Name</label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  className="contact-form__input"
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="contact-form__group">
                <label htmlFor="contact-email" className="contact-form__label">Email</label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  className="contact-form__input"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="contact-form__group">
                <label htmlFor="contact-subject" className="contact-form__label">Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  name="subject"
                  className="contact-form__input"
                  placeholder="How can we help?"
                  required
                />
              </div>

              <div className="contact-form__group">
                <label htmlFor="contact-message" className="contact-form__label">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  className="contact-form__input contact-form__textarea"
                  placeholder="Tell us more…"
                  rows={6}
                  required
                />
              </div>

              <button type="submit" className="contact-form__submit">
                Send Message
              </button>
            </form>
          </div>
        </section>

        <section aria-labelledby="contact-alt-heading" className="about-section about-section--alt">
          <div className="about-section__inner contact-alt-grid">
            <div className="contact-alt-card">
              <p className="about-section__eyebrow">Email</p>
              <h2 id="contact-alt-heading" className="about-heading about-heading--sm">
                support@<span className="about-heading--accent">tack.ai</span>
              </h2>
              <p className="about-body">Reach our support team directly for account or technical issues.</p>
            </div>
            <div className="contact-alt-card">
              <p className="about-section__eyebrow">Accessibility Feedback</p>
              <h2 className="about-heading about-heading--sm">
                a11y@<span className="about-heading--accent">tack.ai</span>
              </h2>
              <p className="about-body">Found a barrier? Tell us and we&apos;ll fix it fast.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
