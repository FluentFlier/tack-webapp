import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@insforge/nextjs";
import { Search } from "lucide-react";

const team = [
  {
    name: "Alex Rivera",
    role: "Founder & CEO",
    initials: "AR",
    gradient: "from-purple-600 to-indigo-600",
    bio: "Passionate about making technology accessible to everyone.",
  },
  {
    name: "Morgan Chen",
    role: "Head of Accessibility",
    initials: "MC",
    gradient: "from-blue-600 to-cyan-600",
    bio: "Specialist in WCAG standards and assistive technology design.",
  },
  {
    name: "Jordan Kim",
    role: "Lead Engineer",
    initials: "JK",
    gradient: "from-violet-600 to-purple-600",
    bio: "Building robust, screen-reader-first interfaces since 2015.",
  },
  {
    name: "Taylor Brooks",
    role: "Product Designer",
    initials: "TB",
    gradient: "from-indigo-500 to-blue-600",
    bio: "Designing experiences that put users with disabilities first.",
  },
];

export default function AboutPage() {
  return (
    <div className="about-root">
      {/* ─── Ambient gradient orbs ─── */}
      <div className="landing-orb landing-orb--purple" aria-hidden="true" />
      <div className="landing-orb landing-orb--blue" aria-hidden="true" />

      {/* ─── Top Navigation ─── */}
      <header role="banner" className="landing-nav">
        <div className="landing-nav__inner">
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

          <nav aria-label="Main navigation" className="landing-nav__links">
            <Link href="/" className="landing-nav__link">
              Home
            </Link>
            <Link href="/about" className="landing-nav__link landing-nav__link--active">
              About Us
            </Link>
            <Link href="/contact" className="landing-nav__link">
              Contact Us
            </Link>
          </nav>

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
            </SignedIn>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="about-main">

        {/* ── Mission Section ── */}
        <section aria-labelledby="mission-heading" className="about-section about-mission">
          <div className="about-section__inner">
            <p className="about-section__eyebrow">Our Purpose</p>
            <h1 id="mission-heading" className="about-heading">
              Making the Web<br />
              <span className="about-heading--accent">Accessible for All</span>
            </h1>
            <p className="about-body">
              Tack was built on a simple belief: the internet should be navigable
              by everyone, regardless of ability. We combine AI with thoughtful
              design to give blind and visually impaired users a voice-first
              browsing experience that doesn$apost compromise on capability.
            </p>
          </div>
        </section>

        {/* ── Story Section ── */}
        <section aria-labelledby="story-heading" className="about-section about-story">
          <div className="about-section__inner about-story__grid">
            {/* Placeholder image */}
            <div className="about-story__image-wrap" aria-hidden="true">
              <div className="about-placeholder-img about-placeholder-img--wide">
                <div className="about-placeholder-img__icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="17" cy="20" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6 32l10-8 8 6 6-5 12 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="about-placeholder-img__label">Our Story</span>
              </div>
            </div>

            <div className="about-story__text">
              <p className="about-section__eyebrow">How We Started</p>
              <h2 id="story-heading" className="about-heading about-heading--sm">
                Born from a <span className="about-heading--accent">real need</span>
              </h2>
              <p className="about-body">
                Our founders watched a family member struggle with screen readers
                that couldn$apost keep up with modern, dynamic web pages. The gap
                between what the web promised and what was actually accessible
                was enormous.
              </p>
              <p className="about-body">
                We set out to bridge that gap with an AI layer that could
                understand any page and present it clearly — no matter how
                complex the underlying markup.
              </p>
            </div>
          </div>
        </section>

        {/* ── Team Section ── */}
        <section aria-labelledby="team-heading" className="about-section about-team">
          <div className="about-section__inner">
            <p className="about-section__eyebrow">The People</p>
            <h2 id="team-heading" className="about-heading">
              Meet the <span className="about-heading--accent">Team</span>
            </h2>

            <ul className="about-team__grid" role="list">
              {team.map((member) => (
                <li key={member.name} className="about-team__card">
                  {/* Placeholder avatar */}
                  <div
                    className="about-avatar"
                    aria-label={`${member.name} profile photo placeholder`}
                  >
                    <div className={`about-avatar__bg about-avatar__bg--${member.name.split(" ")[1].toLowerCase()}`} aria-hidden="true" />
                    <span className="about-avatar__initials" aria-hidden="true">
                      {member.initials}
                    </span>
                  </div>

                  <div className="about-team__info">
                    <h3 className="about-team__name">{member.name}</h3>
                    <p className="about-team__role">{member.role}</p>
                    <p className="about-team__bio">{member.bio}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Values Section ── */}
        <section aria-labelledby="values-heading" className="about-section about-values">
          <div className="about-section__inner">
            <p className="about-section__eyebrow">What Drives Us</p>
            <h2 id="values-heading" className="about-heading">
              Our <span className="about-heading--accent">Values</span>
            </h2>

            <ul className="about-values__grid" role="list">
              {[
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
              ].map((value) => (
                <li key={value.title} className="about-values__card">
                  <div className="about-values__card-icon" aria-hidden="true">
                    <div className="about-placeholder-img about-placeholder-img--sm">
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                        <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M10 14l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="about-values__title">{value.title}</h3>
                  <p className="about-values__body">{value.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

      </main>
    </div>
  );
}
