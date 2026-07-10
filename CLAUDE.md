# CLAUDE.md — Agent Guide for Tack

This file tells AI coding agents how to work in this repository. Read it fully before
making changes. The project history and the reasoning behind every major decision live
in `CONTEXT.md` — read that when you need to know *why* something is the way it is,
or before proposing to change an existing pattern (it may have already been tried
and reverted).

---

## 1. What Tack is

Tack is an **AI web assistant for blind and visually impaired users**. It reads pages,
summarizes URLs, answers questions about web content, and reads PDFs — through a
keyboard- and voice-first chat interface that works **with** screen readers, never
against them.

The users are competent daily screen-reader users (NVDA, JAWS, VoiceOver, braille
displays), not "edge cases to accommodate." Success metric: a blind user completes in
30 seconds what previously took 5 minutes of fighting a broken DOM.

**Accessibility is the product, not a feature.** Every change is judged first by
whether it helps or harms a screen-reader user. When a visual improvement and an
accessibility property conflict, accessibility wins. Always.

Product/brand source of truth: `PRODUCT.md`. Design tokens and rules: `DESIGN.md`
(note: `DESIGN.md` documents the older "void/observatory" palette; the **current**
visual system is Editorial / Pine & Oat — see §6 and
`docs/superpowers/specs/2026-07-06-frontend-redesign-design.md`).

---

## 2. Commands

```bash
npm run dev          # Next.js dev server (Turbopack) on :3000
npm run build        # production build — must pass before any task is "done"
npm run typecheck    # tsc --noEmit (strict mode)
npm run lint         # eslint . (flat config)
npm test             # vitest run — 188 tests in src/lib/__tests__/, all must pass
npm run format       # prettier over src/
```

**Definition of done for any code task:** `npm run typecheck && npm run lint && npm test && npm run build` all pass.

Dev server logs live at `.next/dev/logs/next-development.log`. If the browser behaves
inconsistently with the source code (e.g. errors referencing deleted variables), the
`.next` cache is stale — kill the dev server, `rm -rf .next`, restart. This has burned
us before (see CONTEXT.md, July 6 chat outage).

---

## 3. Stack and architecture

Single Next.js app (App Router), no separate backend. InsForge BaaS provides auth,
PostgreSQL (PostgREST), and AI (OpenAI-compatible gateway).

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | `react@18` — known mismatch with next@16, upgrade to React 19 is tracked separately; do NOT bump casually |
| Language | TypeScript 5, strict | |
| Styling | **Tailwind CSS 3.4 — locked, do not upgrade to v4** | + shadcn/ui (Radix) + hand-written CSS in `globals.css` |
| Backend | InsForge (`@insforge/sdk` pinned **exactly** `1.1.6`, `@insforge/nextjs` ^1.1.7) | see `AGENTS.md` for SDK docs workflow |
| AI model | `openai/gpt-4o-mini` via InsForge gateway | cheap default; vision used only for real alt text |
| Validation | Zod v4 — every POST body has a schema in `src/lib/validation.ts` | |
| Web extraction | `@mozilla/readability` + `jsdom` server-side; Serper API for `/search` | |
| PDF | `pdfjs-dist` / `unpdf` / `@embedpdf/*` client pipeline | |
| Voice | Web Speech API (browser-native, no external service) | input only — see §5 TTS rule |
| Animation | framer-motion + Lenis smooth scroll (landing only) | always gated by reduced-motion |
| Tests | Vitest (`src/lib/__tests__/`) | pure-logic tests; no component tests yet |

### Directory map

```
middleware.ts                    # InsForge auth middleware (project ROOT, not src/)
src/app/
  page.tsx                       # public landing (editorial lpage-* classes)
  about/  contact/               # public pages (lpage-* / cpage-* classes)
  (protected)/                   # auth-required: chat/, chat/[id]/, settings/, reader/
  pdf-reading/  pdf-reading-settings/   # PDF reader (own inline color-settings system — leave it functional)
  api/
    chat/route.ts                # THE core route: auth, rate limit, Zod, history,
                                 #   structured commands, injection guard, SSE streaming,
                                 #   AI titles, IDOR ownership check
    extract/route.ts             # Readability extraction + SSRF guard + vision alt text
    conversations/[id]/messages/ # history retrieval
    insforge/shorten|summarize/  # PDF line/document AI endpoints
  globals.css                    # tokens + all page-scoped class blocks (lpage-*, cpage-*, app-*)
src/components/
  a11y/                          # LiveRegion, FocusManager, ScreenReaderOnly — CRITICAL, do not weaken
  chat/                          # ChatMessage, ChatInput, ChatHistory, CommandPalette, SlashCommandButtons
  layout/                        # Header, Sidebar, LandingNavMobile
  pdf-reading/                   # pdf-reader, settings, PdfReadableLine
  theme/                         # ThemeToggle
  ui/                            # shadcn primitives
src/hooks/    useChat (SSE client), useVoice, useTheme, usePreferences, use-toast
src/lib/      commands, validation (SSRF guard + Zod), rate-limit, request-queue,
              markdown.tsx (hand-rolled parser), sse, serper, image-fetch,
              chunk-text, chat-helpers, themes, insforge, env
src/types/    shared interfaces (Message.metadata carries command/source/scraped_content/failed)
docs/         ARCHITECTURE, ACCESSIBILITY, API, SETUP + plans/ + superpowers/{plans,specs}
mockups/      editorial-theme.html = approved design source of truth for the redesign
```

### Data flow (chat)

`ChatInput` → `useChat` parses local slash commands (`/help`, `/clear`) client-side;
server commands post **structured** `{ message, conversation_id, command, args }` —
never rewritten into English sentences (that approach failed; see CONTEXT.md).
`/api/chat` authenticates, rate-limits (20/min/user), validates with Zod, loads last
20 messages of history, injects at most one prior `metadata.scraped_content` as
follow-up context, wraps scraped content in BEGIN/END untrusted-data markers
(prompt-injection guard), streams SSE (`token` events, then `done` with the saved
message), saves both messages, and fires a non-blocking AI title generation for new
conversations.

### Database (RLS on everything)

`conversations` (id, user_id, title, timestamps) · `messages` (id, conversation_id,
role, content, `metadata` jsonb, created_at) · `user_preferences` (user_id,
high_contrast, font_size, screen_reader_verbosity, reduced_motion).

Schema changes go through the InsForge MCP `run-raw-sql` tool, not the SDK.

---

## 4. InsForge patterns (follow exactly)

- Client-side singleton: `src/lib/insforge.ts` (`createClient({ baseUrl, anonKey })`).
- Server/API routes: `const { token, userId } = await auth()` from
  `@insforge/nextjs/server`, then `createClient({ baseUrl, edgeFunctionToken: token })`.
  Return 401 when token/userId missing.
- **Never** raw-fetch InsForge endpoints with the anon key from server code — that was
  a bug (shorten/summarize routes) and was fixed to the client-with-token pattern.
- AI calls: `insforge.ai.chat.completions.create({ model: "openai/gpt-4o-mini", ... })`,
  read `completion.choices[0]?.message?.content`. Wrap in the 60s timeout helper.
  Pass `maxTokens` on main completions.
- Database inserts take array format `[{...}]` per SDK convention; reads/writes return
  `{ data, error }` — always check `error`.
- Per `AGENTS.md`: fetch InsForge SDK docs via the `fetch-docs` MCP tool before writing
  new integration code.
- **Ownership checks**: any route touching a conversation must verify
  `conversation.user_id === userId` (an IDOR here was found and fixed — do not regress).

---

## 5. Accessibility hard rules (non-negotiable)

These encode real failures and real user feedback. Violating any of these is a
blocking review failure.

1. **Never emit text-to-speech output from the app.** The built-in auto-read feature
   spoke over users' own screen readers and was removed (Apr 2026). Voice *input*
   (Web Speech API dictation) is fine. Output speech belongs to the user's screen
   reader. The app communicates via ARIA live regions instead.
2. **Never fabricate alt text.** Image descriptions must come from actual pixels
   (vision model on fetched image bytes). If vision is unavailable or the fetch fails,
   emit `"Image (no description available)"` with `generated: false`. A guessed
   description is worse than none.
3. **Streaming announcements are batched.** LiveRegion announces "Response started,"
   then the completed response once, then "Response complete." Never announce
   per-token — it turns a screen reader into noise.
4. **Every interactive element has a thick, high-contrast `:focus-visible` ring**
   using the `--focus` token, visible in BOTH themes. Never suppress `focus-visible`
   without an equivalent replacement. (T3 review caught missing rings; this is a
   repeat-offender class of bug.)
5. **Tab economy.** Minimize focusable elements; one logical linear source order;
   prominent skip link (`#main-content`); no tab traps. This is why sidebar chat
   history is collapsed by default — keep such patterns.
6. **Errors are announced.** `role="alert"` for errors, `role="status"` for progress.
   Never `alert()` (all removed), never a silent failure. Failed chat messages keep
   the user's text and show an accessible Retry button — never delete user input on
   error.
7. **Semantic HTML first.** Real `h2`–`h4` from the markdown renderer, real lists,
   landmarks (`banner`/`main`/`complementary`/`nav` with labels), `role="log"` on
   chat history, `aria-hidden` on decorative icons.
8. **Respect user preferences everywhere**: `reduced_motion` (motion-safe gating on
   every animation, including framer-motion via `useReducedMotion`), `font_size`
   (rem-based from `--base-font-size`), `data-color-profile` (high-contrast/colorblind
   palettes must still override on top of light/dark themes).
9. **WCAG AA (≥4.5:1) is the floor** for body text in both themes; core interaction
   paths target AAA.
10. **No information conveyed by color alone.**

When editing anything under `src/components/a11y/`, `LiveRegion` usage, focus
management, or aria attributes: treat it as high-risk, diff-review for regressions.

---

## 6. Design system (current: Editorial / Pine & Oat)

Approved mockup: `mockups/editorial-theme.html`. Spec:
`docs/superpowers/specs/2026-07-06-frontend-redesign-design.md`.

- **Two real themes** governed by `data-theme` (`light`|`dark`) on `<html>`, persisted
  in `localStorage` key `tack_theme` (`light`|`dark`|`system`), FOUC-prevented by the
  blocking script in `layout.tsx` head. `data-color-profile` (high contrast /
  colorblind) overrides on top and is a separate axis — don't merge them.
- Tokens are shadcn HSL custom properties in `globals.css` `:root` (light) and
  `[data-theme="dark"]`, plus editorial extras: `--hairline`, `--user-tint`,
  `--focus`, `--accent-strong`, `--font-serif`. All styling reads tokens —
  no hardcoded hex in components.
- Light: bg `#f3f1ea`, ink `#1c1e19`, pine accent `#2c5f4f`. Dark: bg `#17140f`,
  ink `#ece6da`, sage accent `#86bda9`. Body contrast verified AAA.
- Typography: Playfair Display (serif) for display/brand surfaces; Inter for
  functional UI. **Register boundary:** serif lives on marketing surfaces and page
  titles; it does not colonize the app shell.
- Hairline rules instead of heavy cards; flat surfaces; calm. No gradients-as-identity,
  no neon, no glassmorphism-as-decoration, no bouncy/spring animation (ease-out only).
- Page-scoped CSS class prefixes prevent bleed: `lpage-*` (landing/about), `cpage-*`
  (contact), `app-*` (shell). The old `landing-*`/`iso-*` observatory classes are
  **dead** — removed in T4; don't reintroduce them.
- "If it reads as designed-for-someone-with-a-disability, redesign it. Design it for
  someone doing real work."

---

## 7. Coding conventions

- Strict TS; no `any` without justification. Shared types in `src/types/index.ts`.
- Zod-validate every POST body at the route boundary; return 400 with a clear message.
- All external fetches: SSRF-guard with `assertPublicUrl()` (`src/lib/validation.ts`)
  — DNS-resolves and rejects private/loopback/link-local ranges, follows max 3
  redirects re-validating each. Any new route that fetches a user-supplied URL MUST
  use it.
- Timeouts on everything external: `AbortSignal.timeout(15000)` on Serper,
  60s wrapper on AI calls, 10s per image fetch. Use the existing helpers — a
  `setTimeout` leak in the timeout helper was already fixed once.
- Rate limiting via `checkRateLimit()` (`src/lib/rate-limit.ts`). It is **in-memory,
  per-instance** — documented limitation; production needs a durable store (roadmap
  Phase 1).
- Burst-prone client work (PDF line shortening) goes through the module-level
  request queue (`src/lib/request-queue.ts`, max 2 concurrent, 500ms spacing,
  429 → pause 30s and retry once).
- Long-document AI work uses map-reduce chunking (`src/lib/chunk-text.ts`, 18k char
  chunks under the 20k Zod cap).
- Markdown rendering: the hand-rolled parser in `src/lib/markdown.tsx` builds React
  elements (no `dangerouslySetInnerHTML` with remote content, no react-markdown dep).
  Headings demote `#`→`h2`. Extend it rather than adding a dependency.
- `useEffect` deps: never put a freshly-constructed object in a dependency array
  (caused the PDF reader infinite re-render loop). `useMemo` stable references.
- Server errors must be logged server-side (`console.error` with a `[route]` prefix)
  **and** emitted to the client — the SSE catch block used to swallow errors silently.
- Tests accompany logic in `src/lib/`: add cases to the matching file in
  `src/lib/__tests__/` for any change to command parsing, validation, rate limiting,
  markdown, SSE framing, chunking, or queueing.
- Comments explain non-obvious intent only. Don't narrate code.

---

## 8. Git and workflow norms

- Repo: `github.com/FluentFlier/tack-webapp`. Long-lived branches per teammate exist
  (`jay`, `daniel`, ...); active work happens on feature branches like
  `fix/audit-fixes`.
- **Never push or commit unless the user explicitly asks.** This has been a standing
  instruction; redesign tasks were deliberately left uncommitted in the working tree
  for review.
- Never touch git config; never force-push main.
- `.claude/` and `.impeccable/` are gitignored — keep them out of commits.
- `.env.local` holds real keys (InsForge base URL/anon key, Serper). Never commit it;
  `.env.example` carries placeholders.
- Merge-conflict convention from experience: when local diverges from `origin/main`
  after a remote redesign, take upstream as base and re-apply local functional changes
  on top (don't fight upstream visual changes hunk-by-hunk). Regenerate
  `package-lock.json` with `npm install` rather than hand-merging it.
- Larger features follow the superpowers workflow: design spec in
  `docs/superpowers/specs/`, implementation plan in `docs/superpowers/plans/`,
  subagent-driven execution with two-stage review (spec compliance → code quality).
  Reviews have real teeth — they've caught missing focus rings, dead CSS, misleading
  comments. Keep that bar.

---

## 9. Known gotchas / footguns

| Gotcha | What to do |
|---|---|
| Stale `.next` cache serves deleted code (Turbopack) | Kill dev server, `rm -rf .next`, restart; hard-refresh browser |
| `react@18` + `next@16` peer mismatch | Known; upgrade is its own tracked task — don't drive-by fix |
| `@insforge/sdk` pinned exactly `1.1.6` | A `^1.1.5` range caused lockfile conflict churn; keep the pin |
| Tailwind must stay 3.4 | v4 breaks the setup (per AGENTS.md) — locked in package.json |
| In-memory rate limiter resets on deploy, per-instance only | Fine for dev; durable store required before launch |
| PDF reader has its own user-configurable inline color system | It is intentionally separate from the theme system — leave functional |
| Old `SignInFirst` / `SignedIn`/`SignedOut` client gating removed | Auth is enforced by `middleware.ts` + `auth()` in API routes; don't reintroduce client gating |
| Hydration mismatch from browser-extension attribute injection | Already guarded; be careful with html/body attributes |
| `#main-content:focus { outline: none }` is deliberate | It suppresses the route-change focus ring on the page container, not on interactive elements |
| Scanned PDFs (no text layer) | Detected and messaged; OCR is future work, don't fake it |
| 18 react-hooks lint warnings around LiveRegion/pdf-reader-settings | Known debt touching a11y-critical code — fix carefully, with screen-reader verification, not mechanically |

---

## 10. Environment

```
NEXT_PUBLIC_INSFORGE_BASE_URL=   # https://5bycmn95.us-west.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=   # from InsForge backend metadata
SERPER_API_KEY=                  # server-only, for /search — rotate before launch
```

Secrets live in `.env.local` locally and must move to hosting env vars for deploys.

---

## 11. Where to read more

- `CONTEXT.md` — full project history, every major decision with outcome
  (what worked / what didn't). **Read before proposing architectural changes.**
- `PRODUCT.md` — users, brand, design principles, anti-references.
- `docs/ARCHITECTURE.md`, `docs/ACCESSIBILITY.md`, `docs/API.md`, `docs/SETUP.md`.
- `docs/plans/2026-07-05-audit-fixes.md` — the security/a11y audit remediation plan
  (most of the current branch).
- `docs/superpowers/specs/2026-07-06-frontend-redesign-design.md` — current visual
  system spec.
- Launch roadmap (Jul 2026 → launch): maintained as a Cursor canvas
  (`tack-launch-roadmap.canvas.tsx` in the workspace canvases directory); summary in
  `CONTEXT.md` §7.
