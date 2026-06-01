# Deployment

**Production** → Vercel project `ai-pr-reviewer` · branch `master`  
**Staging** → Vercel project `ai-pr-reviewer-staging` · branch `staging`

Full guide: [../../DEPLOYMENT.md](../../DEPLOYMENT.md)

```powershell
.\scripts\deploy-production.ps1
.\scripts\deploy-staging.ps1
```

GitHub: add `VERCEL_TOKEN` secret for auto-deploy workflows.
