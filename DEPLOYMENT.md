# Deployment — Production & Staging

See the full guide in the monorepo root: [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md)

Quick reference:

| Branch | Environment | URL |
|--------|-------------|-----|
| `master` | Production | Custom domain (you assign in Vercel) |
| `staging` | Preview | Auto `*.vercel.app` via `VERCEL_URL` |

**Required Vercel env (Production + Preview):** `ANTHROPIC_API_KEY`, `SUPABASE_SECRET_KEY`, Supabase URL + publishable key.

**Production only:** `NEXT_PUBLIC_APP_URL=https://your-domain.com`

Health: `GET /api/health`
