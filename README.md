# Tack - Accessible AI Web Assistant

Tack is an AI-powered web assistant designed for blind and visually impaired users. It provides a chat interface optimized for screen readers, with slash commands for power users.

## Features

- **Accessible Chat Interface** — Fully keyboard-navigable with ARIA live regions, semantic landmarks, and screen reader announcements
- **AI-Powered Responses** — Powered by GPT-4o-mini via InsForge AI, with responses structured for clarity
- **Slash Commands** — `/help`, `/summarize <url>`, `/read <url>`, `/clear` for quick actions
- **Accessibility Settings** — High contrast, font size, reduced motion, and screen reader verbosity controls
- **Conversation History** — Persistent conversations with sidebar navigation

## Quick Start

```bash
# Clone and install
git clone https://github.com/your-org/tack-webapp.git
cd tack-webapp
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your InsForge credentials

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 14 | App Router, Server Components |
| TypeScript 5 | Type safety |
| Tailwind CSS 3.4 | Utility-first styling |
| shadcn/ui | Accessible Radix-based components |
| InsForge | Auth, database, AI |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — System design and data flow
- [Accessibility](docs/ACCESSIBILITY.md) — WCAG compliance and patterns
- [API Reference](docs/API.md) — Endpoint documentation
- [Setup Guide](docs/SETUP.md) — Development environment setup

## Accessibility

Tack targets WCAG 2.1 AA compliance. Key features:
- Skip navigation link
- ARIA live regions for dynamic content
- Full keyboard navigation
- Screen reader optimized markup
- Configurable high contrast, font size, and motion preferences

## License

MIT
