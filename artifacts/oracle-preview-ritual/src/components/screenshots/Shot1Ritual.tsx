import { ScreenshotShell } from './ScreenshotShell';

interface ReticleCorner {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export function Shot1Ritual() {
  const palmUrl = `${import.meta.env.BASE_URL}images/palm.png`;
  return (
    <ScreenshotShell
      index={1}
      eyebrow="The Ritual"
      headline={<>Read your palm<br />in seconds.</>}
      subhead={<>Your hands hold the story.<br />The Oracle reveals it.</>}
    >
      <MockRitualScreen palmUrl={palmUrl} />
    </ScreenshotShell>
  );
}

function MockRitualScreen({ palmUrl }: { palmUrl: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background:
          'radial-gradient(ellipse at 50% 35%, #14122a 0%, #0b0b1e 55%, #04040f 100%)',
        position: 'relative',
        color: '#f0e6cc',
        fontFamily: '"EB Garamond", serif',
      }}
    >
      {/* status bar */}
      <div
        style={{
          paddingTop: '46px',
          paddingLeft: '38px',
          paddingRight: '38px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '20px',
          fontWeight: 600,
          color: '#f0e6cc',
        }}
      >
        <span>9:41</span>
        <span style={{ fontSize: '14px', letterSpacing: '0.3em' }}>● ● ● ●</span>
      </div>

      {/* step indicator */}
      <div
        style={{
          marginTop: '36px',
          textAlign: 'center',
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '14px',
          letterSpacing: '0.4em',
          color: '#c9a84c',
          opacity: 0.85,
          textTransform: 'uppercase',
        }}
      >
        Step 1 of 2
      </div>

      <div
        style={{
          marginTop: '8px',
          textAlign: 'center',
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: '34px',
          color: '#f0e6cc',
          letterSpacing: '0.04em',
        }}
      >
        Your Dominant Palm
      </div>

      {/* palm photo + reticle */}
      <div
        style={{
          marginTop: '52px',
          marginInline: '46px',
          aspectRatio: '1 / 1.1',
          borderRadius: '24px',
          background:
            'linear-gradient(180deg, rgba(20,18,42,0.6), rgba(11,11,30,0.9))',
          border: '1.5px solid rgba(201,168,76,0.45)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow:
            'inset 0 0 50px rgba(201,168,76,0.12), 0 0 32px rgba(201,168,76,0.18)',
        }}
      >
        <img
          src={palmUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.95,
          }}
        />
        {/* reticle corners */}
        {(
          [
            { top: 28, left: 28 },
            { top: 28, right: 28 },
            { bottom: 28, left: 28 },
            { bottom: 28, right: 28 },
          ] satisfies ReticleCorner[]
        ).map((c, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: c.top,
              left: c.left,
              right: c.right,
              bottom: c.bottom,
              width: '46px',
              height: '46px',
              borderTop: c.top != null ? '2.5px solid #e8cc7a' : undefined,
              borderBottom: c.bottom != null ? '2.5px solid #e8cc7a' : undefined,
              borderLeft: c.left != null ? '2.5px solid #e8cc7a' : undefined,
              borderRight: c.right != null ? '2.5px solid #e8cc7a' : undefined,
            }}
          />
        ))}
        {/* center label */}
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: '"EB Garamond", serif',
            fontStyle: 'italic',
            color: '#e8cc7a',
            fontSize: '20px',
            letterSpacing: '0.06em',
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
          }}
        >
          Hold steady — the lines reveal themselves
        </div>
      </div>

      <div
        style={{
          marginTop: '40px',
          marginInline: '46px',
          fontFamily: '"EB Garamond", serif',
          color: '#e0d4a8',
          fontSize: '21px',
          lineHeight: 1.6,
          opacity: 0.85,
        }}
      >
        <Bullet>Find soft, natural light — never direct sun.</Bullet>
        <Bullet>Hold your palm flat, fingers slightly spread.</Bullet>
        <Bullet>All four major lines should be visible.</Bullet>
      </div>

      {/* CTA */}
      <div
        style={{
          position: 'absolute',
          bottom: '94px',
          left: '46px',
          right: '46px',
          height: '78px',
          borderRadius: '14px',
          background: 'linear-gradient(180deg, #e8cc7a 0%, #c9a84c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          color: '#04040f',
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: '20px',
          letterSpacing: '0.18em',
          boxShadow: '0 8px 28px rgba(201,168,76,0.45)',
        }}
      >
        ✦  CAPTURE PALM
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
      <span style={{ color: '#c9a84c', fontSize: '16px', lineHeight: '32px' }}>✦</span>
      <span>{children}</span>
    </div>
  );
}
