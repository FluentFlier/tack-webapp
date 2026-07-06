# Frontend Redesign — "Editorial / Pine & Oat" — 2026-07-06

Complete visual redesign of the Tack frontend. **Backend, API routes, hooks logic, data flow, and features are untouched** — this is presentation only. Approved design source of truth: `mockups/editorial-theme.html`.

## Design direction

Editorial / bookish: serif display (Playfair Display, already loaded as `--font-serif`), clean sans body (Inter), hairline rules instead of heavy glass cards, generous line-height, calm. Distinctive **Pine & Oat** palette (deliberately not the common cream+rust), with a real **light and dark theme**.

### Palette tokens (verified AAA body contrast in the mockup)

LIGHT:
- bg `#f3f1ea` · surface `#fbfaf5` · ink `#1c1e19` · muted `#5f645b`
- accent (pine) `#2c5f4f` · accent-strong `#234c3f` · hairline `#e2ded2`
- user-message tint `rgba(44,95,79,0.06)` · focus ring `#234c3f`

DARK:
- bg `#17140f` · surface `#1f1b14` · ink `#ece6da` · muted `#a89e8c`
- accent (sage) `#86bda9` · accent-strong `#9fccbb` · hairline `rgba(236,231,219,0.10)`
- user-message tint `rgba(134,189,169,0.08)` · focus ring `#86bda9`

## Theme system (light/dark) — client-only, no backend change

- Base light/dark is governed by a **`data-theme` attribute on `<html>`** (`light` | `dark`), separate from the existing `data-color-profile` (colorblind/high-contrast) mechanism, which continues to override on top and stays light-based as today.
- Persist choice in `localStorage` key `tack_theme` = `light` | `dark` | `system` (default `system`). `system` follows `matchMedia('(prefers-color-scheme: dark)')` and reacts to OS changes live.
- **FOUC prevention:** extend the existing blocking `<script>` in `layout.tsx` `<head>` to read `tack_theme` and set `data-theme` before first paint (same pattern as the existing font-size/profile logic).
- New `useTheme` hook + a small `ThemeToggle` button component (real `<button>`, `aria-pressed`/label reflecting state, visible focus ring). Placed in the Header and mirrored as a control on the Settings page.

### Token wiring

`globals.css` `:root` defines the shadcn HSL tokens (`--background`, `--foreground`, `--card`, `--card-foreground`, `--popover*`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive*`, `--border`, `--input`, `--ring`) for the **light** Pine & Oat palette. A `[data-theme="dark"]` block overrides them for **dark**. All component styling reads these tokens (or new `--font-serif`) so the whole app themes automatically. Additional editorial-specific vars (`--hairline`, `--user-tint`, `--focus`, `--accent-strong`) added alongside.

## Scope — whole app

Rewrite/retune, page by page, to the editorial system:
1. **Theme foundation** — token rewrite in `globals.css` (light+dark), remove/replace the old "observatory" dark tokens and `iso-*`/`app-*` hardcoded indigo values, wire fonts, keep a11y-preference CSS (`--base-font-size`, `.reduced-motion`, `data-color-profile` palettes, `#main-content:focus{outline:none}`, `overflow-x:clip`) intact. Add theme mechanism + `ThemeToggle` + `useTheme` + FOUC script update.
2. **App shell + chat** — `Header`, `Sidebar` (keep collapsed-history behavior), chat pages, `ChatMessage`, `ChatHistory`, `ChatInput`, `CommandPalette`, `SlashCommandButtons`, and `markdown.tsx` className props → editorial (serif headings, hairline dividers, message layout per mockup).
3. **Secondary pages** — `settings` (add ThemeToggle control), `reader`, `pdf-reader` + `pdf-reader-settings` chrome (leave the PDF reader's user-configurable inline color styles functional — separate feature), `about`, `contact`.
4. **Landing** — `page.tsx` rebuilt editorial (currently `iso-*` observatory), plus `LandingNavMobile` if styled inline.

## Hard constraints (accessibility — primary users are blind, braille display, screen readers)

- **Tab economy:** minimize focusable elements, one logical linear source order, prominent skip link, no tab traps. (This is why history is collapsed by default — keep such patterns.)
- Preserve ALL existing a11y affordances added in prior work: semantic landmarks, `role`/`aria-*`, `LiveRegion`s, streaming `aria-live` handling, retry buttons, `role=status`/`role=alert` notices, focus management (`FocusManager`, `#main-content` outline suppression), skip link, `sr-only`.
- Every interactive element has a clearly visible, thick, high-contrast focus ring (`--focus`) that works in BOTH themes.
- WCAG AA (≥4.5:1) body text in both themes; accent-on-bg passes AA.
- Respect `reduced_motion` (motion-safe gating), `font_size` (rem-based scales from `--base-font-size`), and the colorblind/high-contrast `data-color-profile` palettes (must still override correctly on top of light/dark).
- No behavioral/logic changes: do not touch API routes, `useChat`, `useVoice`, request-queue, validation, image-fetch, chat-helpers, or any data flow. Styling, markup semantics, and the new theme toggle only.
- Serif gradient text (if used) must have high-contrast/forced-colors fallbacks (as already done for `.app-page-title`).

## Verification

`npm run typecheck && npm run lint && npm test && npm run build` all pass after each task. No aria/landmark regressions (diff review). Manual: toggle light/dark, tab through chat, confirm focus visibility in both themes.

## Out of scope / unchanged

- Backend, DB schema (theme mode is client-only localStorage), API behavior, feature set.
- PDF reader user-color settings (their own inline-style system stays functional).
- react@18/next@16 version mismatch (tracked separately).
