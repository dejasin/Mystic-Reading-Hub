import { useEffect } from 'react';

const previews = [
  {
    slug: 'ritual',
    number: 'I',
    title: 'The Ritual',
    blurb:
      'The mystical onboarding and palm-capture ceremony. Sigil, framing reticle, line tracing.',
    duration: '~20s',
  },
  {
    slug: 'reading',
    number: 'II',
    title: 'The Reading Reveal',
    blurb:
      'The streaming, section-by-section reading flow culminating in the Archetype card reveal.',
    duration: '~26s',
  },
  {
    slug: 'beyond',
    number: 'III',
    title: 'Beyond the Reading',
    blurb:
      'Oracle Chat, Deep Dives, Synastry, and the Vault — the ongoing companion.',
    duration: '~25s',
  },
] as const;

export function PreviewIndex() {
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg, #04040f)',
        color: 'var(--color-cream, #f0e6cc)',
        padding: 'clamp(32px, 6vw, 96px) clamp(20px, 5vw, 80px)',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div
          className="font-display"
          style={{
            fontSize: 'clamp(11px, 1.2vw, 14px)',
            letterSpacing: '0.55em',
            color: '#c9a84c',
            opacity: 0.7,
            textTransform: 'uppercase',
            marginBottom: '1.2rem',
          }}
        >
          The Oracle — App Store Previews
        </div>
        <h1
          className="font-display"
          style={{
            fontSize: 'clamp(36px, 5.5vw, 72px)',
            letterSpacing: '0.06em',
            lineHeight: 1.05,
            margin: 0,
            color: '#f0e6cc',
            textShadow: '0 0 24px rgba(201,168,76,0.25)',
          }}
        >
          Three previews, one promise.
        </h1>
        <p
          className="font-serif italic"
          style={{
            marginTop: '1.2rem',
            fontSize: 'clamp(15px, 1.5vw, 21px)',
            lineHeight: 1.6,
            color: '#e8cc7a',
            opacity: 0.85,
            maxWidth: '720px',
          }}
        >
          Each composition renders inside a fixed 886 × 1920 stage — the 6.5"
          iPhone App Store preview spec. Open one and the player auto-records
          one full pass, then loops for review.
        </p>

        <div
          style={{
            marginTop: '3.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {previews.map((p) => (
            <a
              key={p.slug}
              href={`#${p.slug}`}
              style={{
                display: 'block',
                padding: '1.8rem 1.6rem',
                borderRadius: '6px',
                background:
                  'linear-gradient(160deg, rgba(20,18,42,0.85) 0%, rgba(11,11,30,0.95) 100%)',
                border: '1px solid rgba(201,168,76,0.35)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = 'rgba(232,204,122,0.7)';
                e.currentTarget.style.boxShadow =
                  '0 16px 36px -16px rgba(201,168,76,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: 'clamp(11px, 1vw, 13px)',
                  letterSpacing: '0.45em',
                  color: '#c9a84c',
                  opacity: 0.7,
                }}
              >
                {p.number} · {p.duration}
              </div>
              <div
                className="font-display"
                style={{
                  marginTop: '0.6rem',
                  fontSize: 'clamp(22px, 2.4vw, 30px)',
                  letterSpacing: '0.08em',
                  color: '#f0e6cc',
                }}
              >
                {p.title}
              </div>
              <div
                className="font-serif italic"
                style={{
                  marginTop: '0.7rem',
                  fontSize: 'clamp(14px, 1.1vw, 16px)',
                  lineHeight: 1.55,
                  color: '#c9a84c',
                  opacity: 0.85,
                }}
              >
                {p.blurb}
              </div>
              <div
                style={{
                  marginTop: '1.2rem',
                  fontSize: '12px',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: '#e8cc7a',
                }}
              >
                Open →
              </div>
            </a>
          ))}
        </div>

        <div
          style={{
            marginTop: '3.5rem',
            padding: '1.6rem 1.8rem',
            borderTop: '1px solid rgba(201,168,76,0.25)',
            color: '#6b6b8a',
            fontSize: '13px',
            lineHeight: 1.7,
          }}
        >
          <div
            className="font-display"
            style={{
              fontSize: '12px',
              letterSpacing: '0.4em',
              color: '#c9a84c',
              opacity: 0.7,
              textTransform: 'uppercase',
              marginBottom: '0.6rem',
            }}
          >
            Capture Mode
          </div>
          Append <code style={{ color: '#e8cc7a' }}>?capture=1</code> to any
          preview URL to render the stage at exact 886 × 1920 with no scaling
          for screen-recording. See <code style={{ color: '#e8cc7a' }}>CAPTURE.md</code>{' '}
          in this artifact for full export instructions.
        </div>
      </div>
    </div>
  );
}
