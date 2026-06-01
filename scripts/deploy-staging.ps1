# Deploy to dedicated staging Vercel project (stable staging URL).
# Usage: .\scripts\deploy-staging.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$vercelDir = Join-Path $Root ".vercel"
$staging = Join-Path $Root ".vercel-staging\project.json"
if (-not (Test-Path $staging)) { throw "Missing .vercel-staging/project.json" }

New-Item -ItemType Directory -Force -Path $vercelDir | Out-Null
Copy-Item $staging (Join-Path $vercelDir "project.json") -Force

Write-Host "Deploying branch to ai-pr-reviewer-staging..." -ForegroundColor Cyan
vercel deploy --prod --yes
