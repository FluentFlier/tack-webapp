---
name: Tack
description: AI web assistant for blind and visually impaired users
colors:
  void-bg: "#0a0a0f"
  surface: "#111117"
  elevated-surface: "#1b1b24"
  muted-surface: "#171720"
  ink-primary: "#e8eaed"
  ink-muted: "#84848f"
  purple-accent: "#6481d9"
  purple-accent-dim: "#5e79ca"
  border: "#202032"
  destructive: "#df3a3a"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2rem, 5vw, 3.6rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "0"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.2em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "12px"
  pill: "100px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.purple-accent}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.purple-accent-dim}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  button-ghost-hover:
    backgroundColor: "{colors.elevated-surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  button-landing:
    backgroundColor: "{colors.purple-accent}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  input-default:
    backgroundColor: "{colors.muted-surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  card-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Tack

## 1. Overview

**Creative North Star: "The Quiet Instrument"**

Tack is a precision tool that disappears when you use it. The interface does not perform its own sophistication. Every surface, every color step, every typographic choice exists to reduce friction between a visually impaired user and the web — not to demonstrate craft to a sighted observer. The dark environment is a working choice: reduced glare, reduced visual noise, maximal contrast for text. It is never cinematic for its own sake.

The tension in this system is held between two pulls: the serif display typography (Playfair Display) that signals warmth and human editorial voice, and the tight utilitarian app shell (Inter, structured grid, flat surfaces) that signals focused tool. Neither wins completely. Together they say: this is serious software that respects you.

This system explicitly rejects the hacker-aesthetic dark mode (neon accents, gradient glow, glass cards as decoration) and the playful consumer-app register (bouncy motion, emoji-adjacent iconography, rounded pill-everything). It equally rejects the clinical accessibility portal (hospital blue, form-heavy, "accessibility" as a visual style). The anti-reference for every decision: if it reads as "designed for someone with a disability," redesign it. Design it for someone doing real work.

**Key Characteristics:**
- Dark-first, WCAG AA minimum on every text surface (AAA on core interaction paths)
- Serif display for brand voice; sans body for functional clarity
- Purple accent used sparingly — presence is earned, not default
- Motion: state-response only; all animations have non-motion alternatives
- Tonal depth through surface steps, not shadows at rest

---

## 2. Colors: The Void Palette

One near-black background with just enough blue-violet chroma to feel intentional, not absent. A single purple accent. Everything else is steps on the neutral ramp.

### Primary
- **Indigo-Violet** (`#6481d9` / hsl(255, 60%, 62%)): The single accent. Used on primary CTAs, active nav states, focus rings, and key interactive affordances. Never used decoratively. Its rarity signals importance. Tonal ramp anchors: `#1a1e3a` (deep) → `#3a4ca8` (mid) → `#6481d9` (default) → `#9aaff0` (light) → `#d4dcfa` (wash).
- **Accent-Dim** (`#5e79ca` / hsl(255, 50%, 58%)): Hover state of the primary accent; also used as a softer version in ghost-button hover backgrounds (as a very low-opacity wash).

### Neutral
- **Void Background** (`#0a0a0f` / hsl(240, 15%, 4.5%)): The deepest surface. Used as `<body>` background. Never used on raised surfaces.
- **Surface** (`#111117` / hsl(240, 12%, 8%)): App shell cards, sidebar, chat message backgrounds. One step above void.
- **Elevated Surface** (`#1b1b24` / hsl(240, 10%, 14%)): Modal backdrops, hover states on surface-level items, sidebar item hover.
- **Muted Surface** (`#171720` / hsl(240, 10%, 12%)): Subtle fill for inputs, code blocks, inactive tabs.
- **Ink Primary** (`#e8eaed` / hsl(220, 10%, 92%)): All body text, headings in the app shell. Required ≥4.5:1 against all surfaces.
- **Ink Muted** (`#84848f` / hsl(220, 8%, 55%)): Supporting text, timestamps, secondary labels. Never used for body copy or interactive labels. Verify contrast: at 4.51:1 against Surface, it passes AA — but only barely. Use sparingly; bump toward ink-primary when in doubt.
- **Border** (`#202032` / hsl(240, 10%, 16%)): Dividers, input strokes, card outlines. Structural, not decorative.
- **Destructive** (`#df3a3a` / hsl(0, 72%, 55%)): Error states, destructive action buttons only.

### Named Rules
**The One Voice Rule.** The purple accent appears on ≤10% of any given screen. Every additional purple element dilutes every other. More purple = no purple.

**The Earned Dark Rule.** Dark backgrounds are not a style choice — they exist to reduce eye strain and improve text contrast for users in varied or low-light conditions. If a dark treatment doesn't improve readability, it's wrong.

---

## 3. Typography

**Display Font:** Playfair Display (Georgia, serif fallback)
**Body / UI Font:** Inter (system-ui, sans-serif fallback)
**Label:** Inter at 0.72rem, tracked wide

**Character:** The pairing is a deliberate tension: Playfair Display carries warmth, editorial authority, and human voice on brand surfaces (landing, about, headings). Inter handles functional UI — chat messages, settings labels, sidebar items — with clarity and no personality noise. They do not blur into each other. The serif is for moments of pause; the sans is for doing.

### Hierarchy
- **Display** (Playfair, 400, clamp(2rem → 3.6rem), line-height 1.12, −0.02em tracking): Hero headings on landing page and about page only. Two lines maximum. `text-wrap: balance` always applied.
- **Headline** (Playfair, 400, clamp(1.6rem → 2.6rem), line-height 1.2, −0.015em): Section headings on marketing pages. Gradient text treatment forbidden here — Playfair earns presence through weight and space, not color.
- **Title** (Inter, 500, 1rem, line-height 1.4): App-shell headings, sidebar section labels, modal titles. Uses the sans; Playfair does not appear in the product app shell.
- **Body** (Inter, 400, 0.95rem, line-height 1.75): Chat messages, settings descriptions, about page prose. Max line length 65–75ch on all reading surfaces.
- **Label** (Inter, 500, 0.72rem, letter-spacing 0.2em, uppercase): Section eyebrows on marketing pages only. Never applied as default scaffolding — each label instance must justify its presence.

### Named Rules
**The Register Boundary Rule.** Playfair Display lives on brand surfaces (landing, about, contact, headings above the fold). It does not appear in the product app shell (chat, settings, reader). Mixing the two registers on one screen signals loss of intent.

**The Anti-Eyebrow Rule.** Uppercase tracked labels above every section heading is the saturated AI scaffold. One deliberate eyebrow is voice. An eyebrow on every section is grammar. If the label adds no information the heading doesn't already carry, delete it.

---

## 4. Elevation

This system is flat by default. Surfaces are distinguished by tonal steps (void → surface → elevated-surface), not by shadows at rest. Shadows appear only as state feedback — hover glow on interactive elements, modal backdrop lift.

### Shadow Vocabulary
- **Interactive glow** (`box-shadow: 0 4px 16px rgba(100, 70, 220, 0.2), 0 0 0 1px rgba(140, 120, 255, 0.1)`): Hover state on the primary CTA (landing page). Purple-tinted ambient glow. Not used in the app shell.
- **Icon hover lift** (`box-shadow: 0 0 12px rgba(140, 120, 255, 0.2)`): Nav icon buttons on hover. Subtle, diffuse.
- **Focus ring** (`box-shadow: 0 0 0 2px hsl(var(--ring))`): Applied via Radix/shadcn `focus-visible:ring-1 focus-visible:ring-ring`. The purple ring is the primary focus signal — never remove or override without a contrast-safe replacement.
- **CTA depth** (landing only): `box-shadow: 0 0 0 1px rgba(140,100,255,0.15), 0 8px 32px rgba(60,40,180,0.15), 0 2px 8px rgba(0,0,0,0.3)`. Used on `.landing-cta-btn` only.

### Named Rules
**The Flat-By-Default Rule.** Shadows appear in response to state (hover, modal lift, active focus). A surface at rest is flat. Decorative shadows signal uncertainty about tonal depth; use a darker background step instead.

---

## 5. Components

### Buttons

Solid and confident. Clear visual weight. Nothing ambiguous about affordance.

- **Primary** (`button-primary`): Purple accent fill (`#6481d9`), white text, 6px radius (md), h-9 (36px), px-4 py-2. Hover: slightly dimmer accent (`#5e79ca`). Focus: purple ring via `focus-visible:ring-ring`. Shadow at rest: subtle ambient shadow from shadcn default (`shadow`).
- **Ghost** (`button-ghost`): No background, muted foreground text (`#84848f`). Hover: elevated-surface fill + ink-primary text. Used for nav links in app header.
- **Outline** (`button-outline`): Border input stroke, background background. Hover: accent fill. Used for "New Chat" in sidebar.
- **Landing CTA**: 6px radius, purple accent fill, stronger hover glow (purple ambient shadow). `!important` radius override exists in CSS — keep as-is; it overrides shadcn default.
- **Landing Sign-In**: Pill shape (100px radius), purple accent. Used in nav and header only. Not inside app shell.

### Inputs / Fields
- **Style**: Muted-surface fill (`#171720`), ink-primary text, border stroke at border color (`#202032`), 6px radius. Height 36px (h-9 equivalent).
- **Focus**: Purple ring via `focus-visible:ring-ring` + border shifts to ring color. No glow in app shell.
- **Contact form inputs**: Same base, but explicit `border: 1px solid rgba(255,255,255,0.1)` rest state; `border-color: rgba(140,100,255,0.6)` on focus.
- **Placeholder**: Must meet 4.5:1 contrast. Default `rgba(240,237,237,0.25)` used in contact form — this is approximately `#3c3b3b`, which fails against the muted-surface background. Bump to at least `rgba(240,237,237,0.45)` (#7a7978-equivalent) before shipping.

### Cards / Containers
- **Corner Style**: Gently curved (12px radius on larger cards; 8px on compact items).
- **Background**: Surface (`#111117`). Never elevated-surface as a default card background — that's for hover states.
- **Shadow Strategy**: None at rest. Flat against the void background. Hover may add subtle lift (elevated-surface background change, not a shadow).
- **Border**: Border color (`#202032`) as a 1px stroke where needed for structure. Not decorative.
- **Internal Padding**: 24px standard (spacing.lg); compact variant 12px.

### Navigation
- **App Header** (`app-header`): Sticky top-0, 64px tall, px-5. Logo left, actions right. Transparent or void-bg background. Bottom border at 0.5 opacity border color.
- **Sidebar** (`app-sidebar`): 256px wide, full height, surface background. "New Chat" button uses outline variant. Conversation list items: ghost hover with elevated-surface fill, 4px indent, 3.5px icon. Active item: accent-colored left treatment (NOT a side stripe — use background + font weight instead).
- **Landing Nav**: Position sticky in about/contact pages; relative on landing (hero takes full viewport). Height 72px. Frosted glass on sticky scroll (backdrop-filter blur, void-bg at 0.88 opacity).

### Chat Message Surface
The signature component. Two roles:
- **User message**: Right-aligned, elevated-surface background, 12px radius, max-width 70%.
- **Assistant message**: Left-aligned, muted-surface or transparent, full width. Body font at 0.95rem, line-height 1.75.
- **Loading indicator**: Animated typing dots or skeleton. Must announce to screen reader via `aria-live="polite"`.

### Accessibility Settings Panel
Multiple color profiles ship with the product (high-contrast, warm, cool, low-blue, custom). Each swaps CSS custom property values on `:root`. The design system governs the **default** profile only; other profiles are accessibility overrides and inherit these decisions unless a profile explicitly overrides a token.

---

## 6. Do's and Don'ts

### Do:
- **Do** maintain ≥4.5:1 contrast on all body text and interactive labels. The ink-muted color (#84848f) passes by the narrowest margin against Surface; verify on every new surface.
- **Do** use Playfair Display exclusively on brand/marketing surfaces (landing, about, contact). Keep it out of the app shell entirely.
- **Do** keep the purple accent to ≤10% of any given screen's visible area. One CTA, one active state, one focus ring — that's the ceiling for most screens.
- **Do** make every interactive element keyboard-navigable with a visible focus ring. The purple focus ring is the primary signal; never suppress `focus-visible` without an equivalent replacement.
- **Do** provide `prefers-reduced-motion` alternatives for every animated element. The grain texture, orb float, and transition effects all require non-motion fallbacks.
- **Do** use tonal surface steps (void → surface → elevated) for depth before reaching for shadows.
- **Do** announce dynamic content changes (chat responses, sidebar updates, error states) via `aria-live` regions.

### Don't:
- **Don't** use gradient text (`background-clip: text` with a gradient). Gradient headings are decorative, semantically neutral, and fail on high-contrast overrides. Use a single solid color; emphasis through weight or size.
- **Don't** use glassmorphism (blur + semi-transparent card fills) as decoration. The sticky nav blur is functional (signals scroll position); cards at rest are opaque.
- **Don't** add bouncy, elastic, or spring-based animations anywhere. Ease-out curves (ease-out-quart or expo) only. No bounce, no spring, no elastic — these register as playful consumer-app and conflict with the WCAG reduced-motion requirement.
- **Don't** apply the `.landing-orb` decorative gradient circles to the app shell. They exist on landing/about/contact only. The product shell is a workspace; ambient decoration has no place there.
- **Don't** apply neon accents, gradient glow borders, or cyberpunk color treatments. This is the hacker-aesthetic anti-reference the brand explicitly rejects.
- **Don't** make accessibility features visually prominent as a brand signal. High contrast mode, font-size controls, and reduced motion exist as settings — not as marketing copy on the screen. If the UI looks like it's "for accessibility," something went wrong.
- **Don't** use `border-left` wider than 1px as a colored accent stripe on sidebar items, cards, or list items. Active sidebar state is communicated through background tint + font weight, not a side stripe.
- **Don't** add uppercase tracked eyebrows above every section heading. One deliberate label where it adds information the heading doesn't carry. Every additional eyebrow is dilution.
- **Don't** use identical icon-heading-text card grids as the default layout pattern. The values section and team sections on the about page are borderline. Break the pattern with asymmetric layouts, mixed media, or typographic hierarchy before reaching for more cards.
