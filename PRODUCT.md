# Product

## Register

product

## Users

Blind and visually impaired people who want to navigate, read, and understand web content independently. They use screen readers, keyboard navigation, and accessibility tooling as daily instruments — not assistive exceptions. They are competent users who have been underserved by web design, not edge cases to accommodate.

Context: home, work, mobile. Often using headphones and a screen reader simultaneously. Task-focused; they came to get something done.

## Product Purpose

Tack is an AI web assistant that removes the friction between visually impaired users and internet content. It reads pages, summarizes URLs, answers questions about web content, and provides a keyboard- and voice-first chat interface that works with — not against — screen readers.

Success: a blind user can complete in 30 seconds what previously required 5 minutes of fighting with a broken DOM. The app disappears into the workflow.

## Brand Personality

Empowering, clear, human.

Emotionally: the user feels capable and respected, not accommodated. The interface is confident without being cold.

## References

Apple's accessibility pages — dignified, uncluttered. Confident design that treats users as intelligent adults, never as recipients of charity. Generous whitespace, clear hierarchy, no visual noise.

## Anti-references

- **Overly playful / consumer app**: gradient soup, rounded bubbles, emoji-heavy, bouncy — optimized for delight performance, not actual use.
- **Dark mode showoff (hacker aesthetic)**: neon accents, terminal aesthetics, glowing gradients — form used as identity signal, not as functional choice.
- **Healthcare / accessibility clichés**: clinical blue, sterile forms, "accessible" as a visual style rather than a technical commitment. Accessibility is a core feature, not a brand note.

## Design Principles

1. **Dignity by default** — every design decision should make the user feel capable, not assisted. Never condescending copy, never a "special needs" visual register.
2. **Earn the dark** — the dark theme reduces eye strain and aids focus for users in varied lighting; it must not look like a style choice. Contrast ratios come before aesthetics.
3. **Signal, not decoration** — every visual element earns its place through function. Nothing added for aesthetic novelty. Motion, color, and typography serve clarity.
4. **Radically readable** — hierarchy, contrast, and spacing are non-negotiable. WCAG AA is the floor; the ceiling is "a screen reader user can navigate this without visual reference and lose nothing."
5. **The interface disappears** — the best UI moment is when the user forgets Tack exists and is just doing their task. Speed, focus, and zero friction are design goals.

## Accessibility & Inclusion

- WCAG 2.1 AA compliance (target; WCAG AAA on core interaction surfaces)
- Screen reader first: ARIA live regions, semantic landmarks, logical focus order, full keyboard navigation
- Configurable: high contrast mode, font size (sm/md/lg/xl), reduced motion toggle, screen reader verbosity
- Color blindness: no information conveyed by color alone
- Reduced motion: all animations have non-motion fallbacks; `prefers-reduced-motion` respected
