# Architecture

## System Overview

Tack is a single Next.js 14 application with no separate backend. All server-side logic runs in Next.js API routes, and InsForge BaaS provides authentication, database, and AI services.

```
User -> Next.js App -> InsForge BaaS
                         ├── Auth (hosted login)
                         ├── Database (PostgreSQL)
                         └── AI (OpenAI-compatible)
```

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 14 | App Router, Server Components, API routes |
| TypeScript 5 | Strict mode type safety |
| Tailwind CSS 3.4 | Utility-first styling |
| shadcn/ui | Accessible Radix-based UI components |
| InsForge SDK | Auth, database, AI integration |
| Zod | Runtime validation |
| Lucide React | Icon library |

## Directory Structure

```
src/
  app/
    (protected)/          # Auth-required routes
      chat/
        [id]/             # Individual conversation page
        page.tsx          # New chat page
      settings/
        page.tsx          # Accessibility preferences
      layout.tsx          # Protected layout with sidebar
    api/
      auth/route.ts       # InsForge auth handlers
      chat/route.ts       # AI chat endpoint
      conversations/
        [id]/messages/    # Message retrieval
    layout.tsx            # Root layout with provider
    page.tsx              # Public landing page
    providers.tsx         # InsForge browser provider
  components/
    a11y/                 # Accessibility primitives
      LiveRegion.tsx      # ARIA live region announcements
      FocusManager.tsx    # Route-change focus management
      ScreenReaderOnly.tsx # Visually hidden content
    chat/                 # Chat interface
      ChatMessage.tsx     # Individual message display
      ChatInput.tsx       # Message input with command palette
      ChatHistory.tsx     # Scrollable message list
      CommandPalette.tsx  # Slash command autocomplete
    layout/               # App shell
      Header.tsx          # Top navigation bar
      Sidebar.tsx         # Conversation history sidebar
    ui/                   # shadcn/ui primitives
  hooks/
    useChat.ts            # Chat state management hook
  lib/
    insforge.ts           # InsForge client singleton
    commands.ts           # Slash command parser
    utils.ts              # cn() utility
  types/
    index.ts              # Shared TypeScript interfaces
middleware.ts             # InsForge auth middleware (project root)
```

## Data Flow

1. User types message in `ChatInput`
2. `useChat` hook processes input (checks for slash commands)
3. POST request to `/api/chat` with message + conversation_id
4. API route authenticates via `auth()`, creates conversation if needed
5. User message saved to `messages` table
6. InsForge AI generates response (gpt-4o-mini)
7. Assistant message saved to `messages` table
8. Response returned to client, displayed in `ChatHistory`
9. `LiveRegion` announces response to screen readers

## Auth Flow

1. `middleware.ts` intercepts requests to protected routes
2. Unauthenticated users redirected to InsForge hosted login
3. After login, cookie is set and user redirected to `/chat`
4. API routes call `auth()` to get token and userId
5. Server-side InsForge client uses token for database operations

## Database Schema

### conversations
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| title | TEXT | First message excerpt |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Updated on new messages |

### messages
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| conversation_id | UUID | FK to conversations |
| role | TEXT | 'user', 'assistant', 'system' |
| content | TEXT | Message text |
| metadata | JSONB | Command info, source URLs |
| created_at | TIMESTAMPTZ | Auto-set |

### user_preferences
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID | Primary key |
| high_contrast | BOOLEAN | Default false |
| font_size | TEXT | small/medium/large/x-large |
| screen_reader_verbosity | TEXT | concise/normal/verbose |
| reduced_motion | BOOLEAN | Default false |

All tables have Row Level Security (RLS) enabled.
