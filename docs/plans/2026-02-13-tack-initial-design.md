
# Tack Initial Design

> **Date:** 2026-02-13
> **Status:** Approved

## Summary

Tack is an AI-powered web assistant designed to make the internet accessible for blind and visually impaired users. It provides a hybrid chat interface (conversational + slash commands) where users can ask questions, summarize web pages, and interact with web content through an accessible, screen-reader-first UI.

## Architecture

**Approach:** Next.js 14 App Router + InsForge BaaS (single application, no separate backend)

```
┌─────────────────────────────────────────┐
│            Next.js 14 (App Router)      │
│  ┌───────────┐  ┌───────────────────┐   │
│  │  Pages     │  │  API Routes       │   │
│  │  (RSC +    │  │  /api/chat        │   │
│  │   Client)  │  │  /api/ingest      │   │
│  └───────────┘  └───────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│           InsForge (BaaS)               │
│  Auth │ PostgreSQL │ Storage │ AI       │
└─────────────────────────────────────────┘
```

## Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | Server Components reduce client JS, built-in API routes |
| Language | TypeScript 5 | Full type safety |
| Styling | Tailwind CSS 3.4 + shadcn/ui | Radix-based accessible components |
| Backend | InsForge | Auth, database, storage, AI all-in-one |
| Validation | Zod | Runtime schema validation |

## Interaction Model

**Hybrid:** Conversational chat by default with slash-commands for power users.

- Users type naturally or use commands like `/summarize <url>`, `/read <url>`, `/help`
- AI responds conversationally with accessible, well-structured content
- All interactions are keyboard and screen-reader navigable

## Pages

| Route | Purpose | Auth |
|-------|---------|------|
| `/` | Landing page | No |
| `/login` | Sign in / sign up | No |
| `/chat` | Main chat (new conversation) | Yes |
| `/chat/[id]` | Specific conversation | Yes |
| `/settings` | Accessibility prefs, account | Yes |

## Database Schema

### conversations
- `id` uuid PK
- `user_id` uuid FK -> auth.users
- `title` text
- `created_at` timestamptz
- `updated_at` timestamptz

### messages
- `id` uuid PK
- `conversation_id` uuid FK -> conversations
- `role` text ('user' | 'assistant' | 'system')
- `content` text
- `metadata` jsonb (command type, source URL, etc.)
- `created_at` timestamptz

### user_preferences
- `user_id` uuid PK FK -> auth.users
- `high_contrast` boolean (default false)
- `font_size` text (default 'medium')
- `screen_reader_verbosity` text (default 'normal')
- `reduced_motion` boolean (default false)

## Accessibility Requirements (WCAG 2.1 AA)

- Skip-to-content links on every page
- Proper ARIA labels, roles, and landmarks
- Keyboard navigation for all interactions
- aria-live regions for dynamic content updates
- Focus management on route changes
- High contrast mode support
- Reduced motion support
- Semantic HTML with correct heading hierarchy

## Auth Model

InsForge auth with email/password. Required from day one. Enables conversation persistence and personalized accessibility settings.

## AI Provider

InsForge AI (OpenAI-compatible). Used for chat responses, web content summarization, and accessibility-focused content processing.

## Documentation Structure

| File | Purpose |
|------|---------|
| `docs/ARCHITECTURE.md` | System overview, stack decisions, data flow |
| `docs/ACCESSIBILITY.md` | A11y standards, patterns, testing guide |
| `docs/API.md` | API routes, request/response formats |
| `docs/SETUP.md` | Local setup, env vars, InsForge config |
| `docs/plans/` | Design and implementation plans |
