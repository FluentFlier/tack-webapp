# CONTEXT.md — Tack Project History & Decision Log

> Last updated: **July 6, 2026** (branch `fix/audit-fixes`, 36 commits ahead of
> `origin/main`, redesign T4 + landing restructure uncommitted in working tree).
>
> This document records every significant decision made on Tack, in chronological
> order, with the outcome: **what worked, what didn't, and what we'd do differently.**
> `CLAUDE.md` is the how-to-work-here guide; this is the why-it's-like-this record.

---

## 1. Founding decisions (February 13, 2026)

Initial design approved in `docs/plans/2026-02-13-tack-initial-design.md`.

### D1. Product: AI web assistant for blind / visually impaired users
Chat interface where users ask questions, summarize web pages, and read content —
screen-reader-first. **Outcome: held up.** Every subsequent decision has been
filtered through "does this help a screen-reader user." The product thesis was
validated further by 2026 market events (mainstream browser agents shipping with
accessibility as an afterthought — see §7).

### D2. Architecture: single Next.js App Router app + InsForge BaaS, no separate backend
All server logic in Next.js API routes; InsForge for auth, PostgreSQL, and
OpenAI-compatible AI. **Worked.** A two-person team never had to run infrastructure.
Costs of the choice showed up later as SDK version pinning pain (D24) and the
in-memory rate limiter limitation (D19). Verdict: right call for this team size;
revisit only if the browser-extension backend needs long-lived connections.

### D3. Stack: TypeScript strict + Tailwind 3.4 + shadcn/ui + Zod
**Worked.** shadcn's Radix base gave accessible primitives for free. Tailwind is
deliberately **locked at 3.4** (v4 breaks the InsForge template assumptions —
standing rule in AGENTS.md). Zod became load-bearing during the July security audit.

### D4. Interaction model: hybrid chat + slash commands
Natural conversation by default, `/summarize <url>`, `/read <url>`, `/help`,
`/clear` for power users. **Worked as a model** — but the first *implementation*
(commands rewritten into English prompt sentences) did not survive; see D19.

### D5. Auth required from day one (email/password via InsForge)
Enables persistent conversations and per-user accessibility preferences.
**Right call, rough execution** — login was the most persistent early bug source
(D12), and the auth *UI gating* approach was reworked twice (D15).

### D6. AI model: gpt-4o-mini for everything
Cheap default via InsForge gateway. **Worked**; vision variant added later for real
alt text (D21). Cost controls are still missing — flagged as launch risk.

### D7. Database schema: conversations / messages / user_preferences, RLS everywhere
`messages.metadata` as JSONB was a quietly excellent decision — it later absorbed
command info, source URLs, scraped-content follow-up context, and the `failed` retry
flag without a single migration. **Worked.**

### D8. Docs discipline from day one
`docs/ARCHITECTURE|ACCESSIBILITY|API|SETUP.md` + dated plans in `docs/plans/`.
**Worked** — the RESUME.md pattern (Feb) let sessions resume mid-implementation, and
the later superpowers spec/plan convention (D26) grew out of this.

---

## 2. Feature buildout — V2 (March 3, 2026)

Plan: `docs/plans/2026-03-03-tack-features-v2.md`. Executed as four **parallel agent
tracks** (extraction, PDF, voice, alt-text) — an early version of the subagent-driven
workflow. **The parallelization worked**; all four tracks landed.

### D9. Web extraction: server-side fetch + @mozilla/readability + jsdom
Rather than a headless browser. **Worked** for public articles; fails behind logins
and on JS-heavy SPAs — which is precisely the gap the browser extension (roadmap
Phase 2) closes by reading the live tab. Original implementation had no SSRF
protection; fixed in July (D18).

### D10. In-app reader view (`/reader?url=`)
Renders extracted content as clean semantic HTML instead of sending users back to
the broken source page. **Worked** — one of the most product-defining pages.

### D11. PDF pipeline: server pdf-parse → later client-side pdfjs/unpdf/embedpdf
**Mixed.** Text extraction works; scanned PDFs (no text layer) don't — now detected
honestly with a message instead of failing silently (D22). OCR deliberately deferred.
Image handling inside PDFs was broken and **disabled outright in April** ("disable
broken image handling on pdf reader") — shipping a broken feature was judged worse
than not having it. Still disabled.

### D12. Voice via browser-native Web Speech API (no external service)
**Half worked.** Voice *input* (dictation, Alt+V) works and stays. Voice *output*
was the project's biggest lesson — see D13.

---

## 3. The April hard lessons (team phase, FluentFlier org)

April was the multi-contributor phase (branches `jay`, `daniel`, `anushka`,
`ashley`, `Cris`; PRs #12–#17). Decisions from this period:

### D13. ❌ REMOVED: built-in text-to-speech auto-read
The app originally spoke assistant responses aloud automatically.
**It spoke over users' own screen readers.** A blind user already has a finely
tuned voice they've used for years; the app adding a second voice on top is
hostile, not helpful. Removed Apr 14 ("disable built in screen reader since it
speaks over existing user screen reader").
**Standing rule ever since: the app never emits TTS. Output speech belongs to the
user's screen reader; the app communicates through ARIA live regions.**
This is the single most important accessibility lesson in the repo.

### D14. Aria/verbosity cleanup (Apr 14)
Removed unimplemented pages from headers; changed aria labels and element types so
screen readers "read out less unnecessary info." **Worked** — established the
"tab economy" principle that later became a hard constraint in the redesign spec.

### D15. Auth gating: three iterations
1. *April:* "basic sign in check" — client-side `SignedIn`/`SignedOut` +
   `SignInFirst` component on protected pages. Worked but caused flashes and
   duplicated logic per page.
2. *April:* recurring login breakage; a whole `login_issue_fix` branch existed and
   was copied from (Apr 16 "attempt at fixing the login by copying changes from
   login_issue_fix branch"). **What didn't work: debugging auth by copying diffs
   between branches** — root cause was never written down, and login pain recurred.
3. *June 18 (final):* removed all client-side gating and `SignInFirst`; auth is
   enforced by `middleware.ts` redirects + `auth()` checks in every API route.
   **This is the current model. Don't reintroduce client gating.**

### D16. AI honesty warnings (Apr 20)
Added "AI can make mistakes" notices to chat and PDF reader. **Worked** — for this
audience, trust is earned by admitting limits (same philosophy as D21, D22).

### D17. PDF reader infinite re-render (Apr 10)
`settings` was rebuilt as a fresh object every render and used in a `useEffect`
dependency array → effect fired every render → flash loop. Fixed with
`useMemo` (spec: `docs/superpowers/specs/2026-04-10-pdf-reader-fix-and-restyle-design.md`).
**Lesson encoded in CLAUDE.md: never put freshly-constructed objects in dep arrays.**
The same spec replaced the reader's hardcoded white-on-white inline styles with
design-system tokens, while deliberately preserving the reader's own user-facing
color settings (they're an accessibility feature, not a styling bug).

---

## 4. The July 5 audit — security & correctness overhaul

A full accessibility/AI audit produced `docs/plans/2026-07-05-audit-fixes.md`,
executed on branch `fix/audit-fixes` (the current branch). This was the largest
single quality investment in the project. Every item below is committed.

### D18. Security hardening
- **SSRF guard** (`assertPublicUrl`): DNS-resolves user-supplied URLs and rejects
  private/loopback/link-local/unique-local ranges; follows max 3 redirects,
  re-validating each hop. The original extract route would happily fetch
  `http://169.254.169.254`. **Fixed.**
- **Zod schemas on every POST body** with clear 400s.
- **IDOR fix (Jul 6):** the chat route did not verify conversation ownership —
  any authenticated user could write into any conversation ID. Ownership checks are
  now mandatory pattern.
- **Prompt-injection guard:** scraped page content is wrapped in BEGIN/END markers
  with a system instruction to never follow instructions found inside.
- **XSS guard** in rendering; timeouts on all external calls (a `setTimeout` leak in
  the timeout helper itself was found and fixed).
- **Vitest introduced** — now 188 tests across 10 files (commands, validation,
  rate-limit, markdown, SSE, chunking, queue, schemas, image-fetch, chat-helpers).
  **All passing.** What worked: pure-logic tests in `src/lib` are cheap and have
  real catch-rate. What's missing: component/integration tests (roadmap Phase 1).

### D19. Chat architecture corrections
- ❌ **What didn't work:** commands rewritten into English sentences client-side,
  and a magic `__COMMAND__` string protocol for server commands. Both were fragile
  string-matching in disguise.
  ✅ **Replacement:** structured `{ message, conversation_id, command, args }`
  POSTs; the server branches on the `command` field. Declarative
  `requiresArgs`/`argError` on command definitions.
- **Conversation memory added** (last 20 messages), plus at most one prior scraped
  page injected as follow-up context (capped at 8k chars) — so "what did that
  article say about X" works without blowing the token budget.
- **AI-generated titles** via a second cheap completion, fired non-blocking, with a
  sliced-message fallback. First version blocked the response; fixed.
- **In-memory rate limiter** (`checkRateLimit`, 20/min/user on chat): kept
  deliberately, documented as per-instance/dev-grade. Durable store is a launch
  prerequisite, not a today problem.

### D20. Streaming (SSE) done accessibility-first
`stream: true` through the InsForge gateway; route emits `token` events then `done`
with the DB-saved message. **The a11y-specific decision:** screen readers announce
"Response started" → full response once → "Response complete", never per-token.
What didn't work initially: the client-side thinking indicator overlapped streamed
text (fixed), and the server-side catch block emitted errors to the client but
**logged nothing server-side** — which made the July 6 outage (D27) needlessly hard
to debug. Logging added.

### D21. ❌→✅ Alt text: from fabrication to vision
Original implementation passed the image *URL as text* to gpt-4o-mini and asked it
to write alt text — **the model made descriptions up.** For blind users this is
actively harmful: a confident wrong description is worse than none.
**Replacement:** fetch the actual image server-side (SSRF-guarded, 4MB cap,
content-type checked), base64 it, send real pixels to the vision model. If anything
fails: honest fallback `"Image (no description available)", generated: false`.
**Standing rule: never ship a guessed description.**

### D22. PDF reader correctness pass
- Full-document summary was silently truncating long PDFs → replaced with
  **map-reduce** (18k-char chunks under the 20k Zod cap, summarize each, then
  summarize the summaries).
- Burst 429s from per-line shortening → module-level **request queue** (max 2
  concurrent, 500ms spacing, 429 → pause 30s, retry once).
- `alert()` dialogs → inline `role="alert"` notices. **No alert() anywhere, ever.**
- Scanned-PDF detection with an honest "no text layer" message (OCR = future work).
- A toggle that *lied* on fetch failure (showed "summary" state with no summary) was
  fixed — button state must reflect reality.

### D23. Markdown: hand-rolled semantic parser, no new dependency
System prompt now allows markdown; `ChatMessage` renders it as real semantic HTML
(`h2`–`h4` with `#`→`h2` demotion, `ul/ol`, descriptive links with
`rel="noopener"`, `strong`) by building React elements — no
`dangerouslySetInnerHTML`, no react-markdown dependency (parser stayed under the
~150-line budget set in the plan, with full test coverage). Historical plain-text
messages render via the old paragraph fallback. **Worked; headings are now
navigable landmarks for screen readers — a direct UX win.**

### D24. Dependency decisions
`@insforge/sdk` pinned **exactly 1.1.6** after a `^1.1.5` range caused lockfile
conflict churn during merges. `react@18` + `next@16` peer mismatch acknowledged and
deliberately deferred (React 19 upgrade is its own risky task — do not drive-by).
Lockfile conflicts are resolved by regenerating with `npm install`, never by hand.

---

## 5. Visual identity — two redesigns, one lesson

### D25. ❌ Redesign #1 (June 12): "futuristic" observatory/void theme
Dark cinematic landing (`iso-*`/`landing-*` classes, orbs, parallax), later codified
in `DESIGN.md` ("The Quiet Instrument", void palette, purple accent).
**What didn't work:** dark-only, decorative motion, and an aesthetic that read as
exactly the "dark mode showoff" anti-reference PRODUCT.md warns against. It was
replaced within a month — the clearest scope/churn lesson in the project: **a
redesign without a written spec and a11y constraints gets redone.**
(`DESIGN.md` still documents this system and is now historical for palette purposes;
its *rules* — One Voice, register boundary, anti-eyebrow, flat-by-default — carried
forward.)

### D26. ✅ Redesign #2 (July 6): "Editorial / Pine & Oat" + subagent workflow
Spec-first this time: `docs/superpowers/specs/2026-07-06-frontend-redesign-design.md`,
approved mockup `mockups/editorial-paper.html`/`editorial-theme.html`. Serif
editorial voice, hairlines instead of card chrome, and — critically — **a real
light theme with dark as a peer**, both AAA-verified for body text, governed by
`data-theme` + `localStorage tack_theme` + FOUC-blocking script, kept separate from
the `data-color-profile` accessibility axis.

Executed as four tasks with **subagent-driven development** (implementer → spec
review → code-quality review, fixes, re-review):
- **T1** theme foundation (tokens, `useTheme`, `ThemeToggle`) — review caught a
  missing `useMemo`, an SSR guard, and a settings toggle bug before merge.
- **T2** app shell + chat restyle.
- **T3** secondary pages — **spec review caught missing high-contrast focus rings**
  on the contact page (a WCAG blocker) and a misleading CSS comment; both fixed by a
  focused follow-up agent.
- **T4** landing rebuild (`lpage-*`), removal of ALL dead observatory CSS
  (`landing-*`, `iso-*`, legacy `about-*`/`contact-form` blocks), Framer parallax
  dropped in favor of calm.

**What worked:** the two-stage review loop caught real accessibility bugs a single
pass would have shipped; page-scoped class prefixes (`lpage-*`, `cpage-*`) made the
old CSS safely deletable. **Process notes:** the user directed model choice per task
(Fable for the big rebuild, Haiku for the surgical CSS fix) — matching model weight
to task weight worked well. Standing constraint during this phase: **nothing pushed
or committed without explicit instruction** (T4 + restructure are still uncommitted
in the working tree, by design).

### D27. Landing restructure + the stale-cache outage (July 6)
- User decision: landing page keeps only webapp information; "Meet the team" and
  "Our values" moved to a dedicated `/about` page (previously a redirect). Nav,
  footer, and anchor links updated (`/#team`→`/about`, hero "Learn More"→`#features`).
- Immediately after, "chat isn't working": root cause was **a stale `.next`
  Turbopack cache serving the pre-restructure client bundle** (browser errors
  referenced the deleted `team` array), compounded by the SSE catch block logging
  nothing server-side (D20). Fix: kill dev server, `rm -rf .next`, restart, plus
  server-side stream-error logging.
  **Lessons:** (1) when the browser contradicts the source, suspect the build cache
  first; (2) every error path must log server-side; (3) an unrelated-looking page
  crash can present as "feature X broken."

### D28. Repo hygiene decisions (July 6)
`.claude/` and `.impeccable/` added to `.gitignore`. Merge conflicts with
`origin/main` (which had received the homepage redesign) resolved by **taking
upstream as base and re-applying local functional changes on top** — now the
standing convention. The Cursor GitHub agent's access is managed via
GitHub → Settings → Integrations (user asked; answered; no repo change).

---

## 6. Current state (as of July 6, 2026, evening)

- **Branch:** `fix/audit-fixes`, 36 commits ahead of `origin/main`, not pushed.
- **Uncommitted in working tree (deliberately):** T4 landing rebuild, `/about` page,
  landing restructure, chat SSE error logging, globals.css cleanup.
- **Quality gates:** typecheck ✅ lint ✅ (18 known react-hooks warnings in
  a11y-critical files — tracked debt) tests ✅ (188/188) build ✅.
- **Working features:** chat with SSE streaming + memory + structured commands +
  AI titles; web extraction with real vision alt text + reader view; PDF reader with
  map-reduce summaries and honest failure modes; voice dictation; accessibility
  preferences (contrast profiles, font size, reduced motion, verbosity); light/dark
  editorial theme.
- **Known debt:** durable rate limiting, error monitoring, cost controls,
  react@18/next@16 mismatch, react-hooks lint warnings, OCR, PDF image handling
  (disabled), no component/integration tests, Serper key needs rotation, no CI.

## 7. Where this is going (decided July 6, 2026)

User goal: **public launch by end of 2026.** Strategic decision after evaluating
webapp-only vs browser agent vs iOS:

- **Launch surface = webapp + Chrome MV3 extension** ("browser agent" in its
  conservative form). The extension reuses the chat UI in a side panel and reads the
  live tab via the accessibility tree — closing the exact gap of server-side
  extraction (logins, SPAs). Assisted actions ship as announce → confirm → execute,
  one step at a time. **No autonomous multi-step agency at launch** — the blind
  community's own 2026 reviews of Gemini Auto Browse / Copilot Actions frame
  autonomy-first agents as fragile workarounds; Tack's differentiation is
  a11y-native trust, not autonomy theater.
- **iOS deferred to Q1 2027**, starting as a Safari Web Extension (reusing the
  Chrome work) before any native SwiftUI app.
- Five phases with hard exit criteria (Stabilize → Harden core → Extension MVP →
  Private beta → Launch, targeting Dec 15–18). Full detail lives in the
  `tack-launch-roadmap` Cursor canvas. Phase exits are **cut lines**: scope gets cut
  to hold the date, never the reverse.

---

## 8. The distilled principles (what the history teaches)

1. **The app never speaks.** Screen readers speak; the app provides structure and
   live regions. (D13)
2. **Honesty over capability theater.** No fabricated alt text, no lying toggles,
   no fake streaming, no silent truncation, honest "can't do scanned PDFs." (D16,
   D21, D22)
3. **Structure over string-matching.** Structured commands beat prompt rewriting;
   semantic HTML beats styled divs; tokens beat hex. (D19, D23, D26)
4. **Spec first, then build, then two-stage review.** The unspecced redesign got
   redone; the specced one shipped with review-caught a11y fixes. (D25 vs D26)
5. **Every error path logs server-side and announces client-side.** (D20, D27)
6. **Trust the boundary, guard the boundary.** Zod + SSRF + ownership checks at
   route boundaries; no client-side auth theater. (D15, D18)
7. **When the browser contradicts the source, clear `.next`.** (D27)
8. **Cut scope, keep the date.** (§7)
