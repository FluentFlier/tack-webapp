# Setup Guide

## Prerequisites

- Node.js 18 or later
- npm

## Installation

```bash
git clone https://github.com/your-org/tack-webapp.git
cd tack-webapp
npm install
```

## Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_INSFORGE_BASE_URL=https://your-app.region.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key-here
```

## InsForge Setup

1. Create an account at [insforge.app](https://insforge.app)
2. Create a new project
3. Copy the Base URL and Anon Key from your project dashboard
4. The database tables (`conversations`, `messages`, `user_preferences`) are created via the InsForge SQL console

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Production Build

```bash
npm run build
npm start
```

## Project Structure

See [Architecture](ARCHITECTURE.md) for the full directory structure and system design.
