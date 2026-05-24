export const runtime = 'nodejs'

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {}

  checks.anthropic_key_configured = process.env.ANTHROPIC_API_KEY ? 'ok' : 'error'

  const allOk = Object.values(checks).every((v) => v === 'ok')

  return Response.json(
    {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
      checks,
    },
    { status: allOk ? 200 : 503 },
  )
}
