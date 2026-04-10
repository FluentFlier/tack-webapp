# PDF Reader Fix & UI Restyle

**Date:** 2026-04-10  
**Scope:** Fix infinite re-render loop in the PDF reader and restyle both the reader and settings pages to match the app's dark cinematic design system.

---

## Problem

1. **Flashing/infinite re-render loop:** In `src/components/pdf-reading/pdf-reader.tsx`, `settings` is computed as a plain object at the top of the component function body. Because every render produces a new object reference, the `useEffect([file, settings])` dependency treats `settings` as always changed and fires `processPdf()` on every render — causing a flash loop.

2. **UI mismatch:** Both the PDF reader and its settings page use hardcoded inline styles (`backgroundColor: #FFFFFF`, `color: #000000`) that produce a bright white page inside the app's dark cinematic theme. The settings page uses completely unstyled plain HTML elements (`<button>`, `<ul>`, `<li>`) with no design system components.

---

## Approach: Option A — Targeted fix + UI restyle

Stabilize the `settings` reference with `useMemo` (minimal logic change), then restyle both pages using existing design system components. All AI summarization and text-extraction logic is preserved as-is.

---

## Changes

### 1. Bug Fix — `src/components/pdf-reading/pdf-reader.tsx`

- Change `let settings = getsettings()` to `const settings = useMemo(() => getsettings(), [])`.
- This gives `settings` a stable reference across renders so the `useEffect([file, settings])` only fires when `file` changes.
- No other logic changes.

### 2. PDF Reader UI — `src/components/pdf-reading/pdf-reader.tsx`

- Remove `styleDictBackground` and `styleDictTextColor` inline style objects and all their usages.
- `<main>`: use `bg-background text-foreground min-h-screen`.
- Layout: `max-w-3xl mx-auto p-6 space-y-6` (matches the rest of the site).
- Upload area: wrapped in a `Card` with `CardHeader` / `CardContent`.
- File input: styled with `mt-2 text-sm` and a visible label using the `Label` component.
- "PDF Reader Settings" link: `Button variant="ghost"` with a `Settings` icon, matching header nav style.
- Output container: `border border-border rounded-lg p-4` (replaces hardcoded `bg-white`).
- Full-document summary box: `bg-muted rounded-lg border border-border p-3`.
- Loading/error states: `text-muted-foreground` / `text-destructive`.
- Drop support for custom background/text color (these were reader-specific overrides; the app theme handles colors now).

### 3. PDF Reader Settings UI — `src/components/pdf-reading/pdf-reader-settings.tsx`

- Remove `styleBackgroundColorDict` / `styleTextColorDict` inline styles and all usages.
- Layout: `max-w-2xl mx-auto p-6 space-y-6` (matches settings page).
- "Back to PDF Reading" nav: `Button variant="ghost" size="sm"` with `ArrowLeft` icon.
- Group related settings in `Card` / `CardHeader` / `CardTitle` / `CardContent`.
- Replace plain `<button>` toggles with `Button variant="outline"` showing current state inline.
- Replace `<span>` + raw `<input type="number">` with `Label` + styled input (`border bg-background rounded-md px-3 py-2 text-sm`).
- Remove the background color and text color pickers entirely (no longer needed).

---

## Out of Scope

- Refactoring settings to use React controlled state (DOM manipulation in settings page is preserved).
- Moving the PDF pages into the `(protected)` route group.
- Changes to `PdfViewer.tsx`, AI summarization logic, or API routes.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/pdf-reading/pdf-reader.tsx` | Bug fix (`useMemo`) + UI restyle |
| `src/components/pdf-reading/pdf-reader-settings.tsx` | UI restyle, remove color pickers |
| `src/components/pdf-reading/PdfReadableLine.tsx` | Remove hardcoded `textColor` inline style (use `text-foreground` via CSS) |
