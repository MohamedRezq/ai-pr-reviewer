# AI PR Reviewer

Paste any git diff and get an instant, structured code review powered by Claude 3.5 Sonnet.

## Features (Phase 1 — MVP)

- Paste raw `git diff` output → streaming, per-file review
- Issues ranked by severity: critical / warning / suggestion / info
- Categories: bug, security, performance, maintainability, style
- Parallel file processing — results stream in as they complete
- Copy full review as markdown
- Lock files, binaries, and generated code automatically skipped

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get a key at [console.anthropic.com](https://console.anthropic.com/).

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How to get a diff to paste

```bash
# Compare your branch to main
git diff main

# Review the last commit
git diff HEAD~1

# Review staged changes
git diff --staged
```

Or open any GitHub PR → **Files changed** tab → copy the raw diff.

## Project Structure

```
app/
  page.tsx               ← Home page
  layout.tsx             ← Root layout + metadata
  api/
    review/route.ts      ← Core: diff → Claude → SSE stream
    health/route.ts      ← Health check endpoint
components/
  ReviewStream.tsx        ← SSE consumer + state machine
  DiffInput.tsx           ← Diff textarea with paste helpers
  FileReviewCard.tsx      ← Per-file review card
  IssueItem.tsx           ← Individual issue display
lib/
  anthropic.ts            ← Claude API wrapper
  diff-parser.ts          ← Unified diff parser
  language-detector.ts    ← File extension → language name
  file-filters.ts         ← Skip lock files, binaries, etc.
  types.ts                ← Shared TypeScript types
  utils.ts                ← cn() and helpers
```

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set production env vars
vercel env add ANTHROPIC_API_KEY production
```

## Roadmap

| Phase | Status | Description |
|---|---|---|
| 1 — MVP | ✅ Done | Paste diff, get streaming review |
| 2 — GitHub | Planned | PR URL input, OAuth, post review to GitHub |
| 3 — Persistence | Planned | Review history, usage limits, Pro plan |
| 4 — Automation | Planned | GitHub App, webhooks, REST API |

See [full app plan](../../docs/planning/app-plan.md) for the complete feature roadmap.
