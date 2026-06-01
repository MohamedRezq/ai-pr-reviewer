# Deploy to production Vercel project (live / master).
# Usage: .\scripts\deploy-production.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$vercelDir = Join-Path $Root ".vercel"
$prod = Join-Path $Root ".vercel-production\project.json"
if (-not (Test-Path $prod)) { throw "Missing .vercel-production/project.json" }

New-Item -ItemType Directory -Force -Path $vercelDir | Out-Null
Copy-Item $prod (Join-Path $vercelDir "project.json") -Force

Write-Host "Deploying to ai-pr-reviewer (production)..." -ForegroundColor Cyan
vercel deploy --prod --yes
