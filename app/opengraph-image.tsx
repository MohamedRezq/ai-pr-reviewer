import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'AI PR Reviewer — Instant code review powered by Claude, GPT-4, and Gemini'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #1e1b4b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '100px',
            padding: '8px 20px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '100%',
              background: '#818cf8',
            }}
          />
          <span style={{ color: '#818cf8', fontSize: '18px', fontWeight: 600 }}>
            Free · No signup required
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 800,
            color: '#f4f4f5',
            lineHeight: 1.1,
            letterSpacing: '-2px',
            marginBottom: '24px',
            maxWidth: '900px',
          }}
        >
          AI Code Review
          <br />
          <span
            style={{
              background: 'linear-gradient(90deg, #818cf8, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            in seconds
          </span>
        </div>

        {/* Subline */}
        <p
          style={{
            fontSize: '28px',
            color: '#71717a',
            marginBottom: '48px',
            maxWidth: '700px',
            lineHeight: 1.4,
          }}
        >
          Streaming review by Claude 3.5, GPT-4.1 + Gemini consensus. Bugs, security, performance.
        </p>

        {/* Model badges */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { label: 'Claude 3.5', color: '#f97316' },
            { label: 'GPT-4.1', color: '#10b981' },
            { label: 'Gemini 2.0', color: '#3b82f6' },
          ].map(({ label, color }) => (
            <div
              key={label}
              style={{
                padding: '10px 24px',
                borderRadius: '100px',
                border: `1px solid ${color}40`,
                background: `${color}15`,
                color: color,
                fontSize: '20px',
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Logo mark */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '80px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              fontWeight: 800,
            }}
          >
            P
          </div>
          <span style={{ color: '#a1a1aa', fontSize: '22px', fontWeight: 600 }}>
            getprova.dev
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
