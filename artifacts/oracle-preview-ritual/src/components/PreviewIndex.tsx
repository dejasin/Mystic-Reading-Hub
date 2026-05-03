import { useEffect } from 'react';
import { PREVIEW_SIZE_KEYS, PREVIEW_SIZES } from '@/lib/previewSizes';

const previews = [
  {
    slug: 'ritual',
    number: 'I',
    title: 'The Ritual',
    blurb:
      'The biometric intake — palm-capture ceremony with sigil, framing reticle, and line tracing.',
    duration: '~20s',
  },
  {
    slug: 'reading',
    number: 'II',
    title: 'The Session Reveal',
    blurb:
      'The streaming, section-by-section session flow culminating in the Archetype card reveal.',
    duration: '~26s',
  },
  {
    slug: 'beyond',
    number: 'III',
    title: 'Beyond the Session',
    blurb:
      'Advisor Chat, Deep Dives, Synastry, and the Vault — the ongoing AI life advisor.',
    duration: '~25s',
  },
] as const;

const screenshots = [
  { slug: 'shot-1', number: '01', title: 'The Ritual', blurb: 'Your session starts with your palm.' },
  { slug: 'shot-2', number: '02', title: 'Your Session', blurb: 'Personally written, five chapters deep.' },
  { slug: 'shot-3', number: '03', title: 'Go Deeper', blurb: 'Chat with your AI advisor anytime.' },
  { slug: 'shot-4', number: '04', title: 'Daily & Journal', blurb: 'Every session kept and remembered.' },
  { slug: 'shot-5', number: '05', title: 'People & Synastry', blurb: 'Two lives, one session.' },
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
          Oracle: AI Life Advisor — App Store Previews
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
          Each composition renders inside a fixed portrait stage and adapts to
          three Apple-supported canvases — 6.5" iPhone, 6.7" iPhone, and iPad.
          Open one and the player auto-records one full pass, then loops for
          review.
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
            <div
              key={p.slug}
              style={{
                display: 'block',
                padding: '1.8rem 1.6rem',
                borderRadius: '6px',
                background:
                  'linear-gradient(160deg, rgba(20,18,42,0.85) 0%, rgba(11,11,30,0.95) 100%)',
                border: '1px solid rgba(201,168,76,0.35)',
                color: 'inherit',
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
                  marginTop: '1.4rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                {PREVIEW_SIZE_KEYS.map((sizeKey) => {
                  const s = PREVIEW_SIZES[sizeKey];
                  return (
                    <a
                      key={sizeKey}
                      href={`?size=${sizeKey}#${p.slug}`}
                      style={{
                        display: 'inline-block',
                        padding: '0.55rem 0.9rem',
                        borderRadius: '999px',
                        border: '1px solid rgba(232,204,122,0.45)',
                        color: '#e8cc7a',
                        textDecoration: 'none',
                        fontSize: '12px',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        background: 'rgba(11,11,30,0.6)',
                      }}
                      title={`${s.width} × ${s.height} · ${s.appleSlot}`}
                    >
                      {s.label}
                      <span
                        style={{
                          marginLeft: '0.5rem',
                          color: '#c9a84c',
                          opacity: 0.7,
                          fontSize: '11px',
                        }}
                      >
                        {s.width}×{s.height}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div
          className="font-display"
          style={{
            marginTop: '4rem',
            fontSize: 'clamp(11px, 1.2vw, 14px)',
            letterSpacing: '0.55em',
            color: '#c9a84c',
            opacity: 0.7,
            textTransform: 'uppercase',
            marginBottom: '1.2rem',
          }}
        >
          App Store Screenshots — 6.5" iPhone
        </div>
        <p
          className="font-serif italic"
          style={{
            fontSize: 'clamp(15px, 1.5vw, 19px)',
            lineHeight: 1.6,
            color: '#e8cc7a',
            opacity: 0.85,
            maxWidth: '720px',
          }}
        >
          Five marketing compositions rendered at exact 1242 × 2688. Open one and
          append <code style={{ color: '#e8cc7a' }}>?capture=1</code> for the
          unscaled capture frame.
        </p>
        <div
          style={{
            marginTop: '1.6rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {screenshots.map((s) => (
            <a
              key={s.slug}
              href={`#${s.slug}`}
              style={{
                display: 'block',
                padding: '1.2rem 1.2rem',
                borderRadius: '6px',
                background:
                  'linear-gradient(160deg, rgba(20,18,42,0.7) 0%, rgba(11,11,30,0.9) 100%)',
                border: '1px solid rgba(201,168,76,0.3)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.45em',
                  color: '#c9a84c',
                  opacity: 0.75,
                }}
              >
                {s.number}
              </div>
              <div
                className="font-display"
                style={{
                  marginTop: '0.4rem',
                  fontSize: '20px',
                  letterSpacing: '0.06em',
                  color: '#f0e6cc',
                }}
              >
                {s.title}
              </div>
              <div
                className="font-serif italic"
                style={{
                  marginTop: '0.4rem',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  color: '#c9a84c',
                  opacity: 0.85,
                }}
              >
                {s.blurb}
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
          preview URL to render the stage at exact pixel dimensions with no
          scaling for screen-recording. Combine with{' '}
          <code style={{ color: '#e8cc7a' }}>&amp;size=6.5</code>,{' '}
          <code style={{ color: '#e8cc7a' }}>&amp;size=6.7</code>, or{' '}
          <code style={{ color: '#e8cc7a' }}>&amp;size=ipad</code> to target a
          specific Apple device group. See{' '}
          <code style={{ color: '#e8cc7a' }}>CAPTURE.md</code> in this artifact
          for full export instructions.
        </div>
      </div>
    </div>
  );
}
