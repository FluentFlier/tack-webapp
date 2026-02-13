# Accessibility

Tack targets **WCAG 2.1 AA** compliance, with particular focus on screen reader users.

## Patterns

### Skip Navigation
- Skip-to-content link at the top of every page
- Becomes visible on focus for keyboard users
- Targets `#main-content` container

### ARIA Live Regions
- `LiveRegion` component wraps `aria-live` announcements
- AI responses announced automatically to screen readers
- Loading states use `role="status"` for non-intrusive updates
- Error messages use `role="alert"` for immediate announcement

### Focus Management
- `FocusManager` component moves focus to main content on route changes
- Chat input auto-focuses after sending a message
- All interactive elements have visible focus indicators (ring-2)

### Semantic Landmarks
- `<header role="banner">` — Top navigation
- `<main role="main">` — Primary content area
- `<aside role="complementary">` — Conversation sidebar
- `<nav aria-label="...">` — Navigation sections with descriptive labels

### Keyboard Navigation
- **Enter** — Send message
- **Shift+Enter** — New line in message
- **/** — Opens command palette
- All buttons and links are keyboard accessible
- Minimum 44x44px touch/click targets

### Screen Reader Optimization
- `aria-label` on all interactive elements
- `role="log"` on chat history (announces new messages)
- `role="article"` on individual messages with content preview
- `role="status"` on loading indicators
- `aria-hidden="true"` on decorative icons
- `aria-current="page"` on active conversation link

## Component Accessibility

| Component | Key Features |
|-----------|-------------|
| Header | Banner landmark, labeled navigation |
| Sidebar | Complementary landmark, list role on conversations |
| ChatInput | Labeled textarea, described by hint text |
| ChatMessage | Article role with content preview label |
| ChatHistory | Log role with polite live region |
| CommandPalette | Listbox role with option roles |
| LiveRegion | Polite/assertive announcements, auto-clear |
| FocusManager | Automatic focus on navigation |
| Settings | Labeled form controls, save confirmation |

## User Preferences

- **High Contrast** — Increases color contrast ratios
- **Font Size** — Small, Medium, Large, Extra Large options
- **Reduced Motion** — Respects `prefers-reduced-motion`
- **Verbosity** — Controls AI response detail level

## Testing Guide

### Screen Reader Testing
1. **VoiceOver (macOS)**: Cmd+F5 to enable, navigate with VO+arrows
2. **NVDA (Windows)**: Free download, Insert key as modifier
3. Verify: All content is read, landmarks are announced, live regions work

### Keyboard Testing
1. Tab through all interactive elements
2. Verify visible focus indicators
3. Test Enter/Shift+Enter in chat input
4. Test slash command palette navigation

### Automated Testing
- Run Lighthouse accessibility audit (target: 90+)
- Check color contrast ratios (minimum 4.5:1 for text)
