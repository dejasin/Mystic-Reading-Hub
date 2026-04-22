import { ScreenshotShell } from './ScreenshotShell';

export function Shot2Reading() {
  return (
    <ScreenshotShell
      index={2}
      eyebrow="Your Reading"
      headline={<>Written for you,<br />line by line.</>}
      subhead={<>Five chapters, woven from<br />the lines of your hands.</>}
    >
      <MockReadingScreen />
    </ScreenshotShell>
  );
}

function MockReadingScreen() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background:
          'radial-gradient(ellipse at 50% 20%, #14122a 0%, #0b0b1e 50%, #04040f 100%)',
        position: 'relative',
        color: '#f0e6cc',
        fontFamily: '"EB Garamond", serif',
        overflow: 'hidden',
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

      {/* eyebrow */}
      <div
        style={{
          marginTop: '40px',
          textAlign: 'center',
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '14px',
          letterSpacing: '0.45em',
          color: '#c9a84c',
          opacity: 0.85,
          textTransform: 'uppercase',
        }}
      >
        Your Mystic Oracle Reading
      </div>

      {/* section heading */}
      <div
        style={{
          marginTop: '12px',
          textAlign: 'center',
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: '38px',
          color: '#f0e6cc',
          letterSpacing: '0.04em',
        }}
      >
        ✦  The Heart Line
      </div>
      <div
        style={{
          marginTop: '14px',
          textAlign: 'center',
          color: '#c9a84c',
          letterSpacing: '0.3em',
          fontSize: '16px',
          opacity: 0.55,
        }}
      >
        ─── ✦ ───
      </div>

      {/* body copy */}
      <div
        style={{
          marginTop: '28px',
          marginInline: '46px',
          fontFamily: '"EB Garamond", serif',
          fontSize: '23px',
          lineHeight: 1.65,
          color: '#f0e6cc',
          opacity: 0.95,
        }}
      >
        <p style={{ margin: '0 0 22px' }}>
          Your heart line carves a long, deliberate arc — beginning between Jupiter
          and Saturn, climbing toward the index finger before settling into a soft
          crescendo. This is the mark of a love that arrives slowly, but anchors
          deeply.
        </p>
        <p style={{ margin: '0 0 22px' }}>
          The minor branches near its origin reveal a season of guarded hope:
          you are not closed, but you are choosing carefully. Mystic Oracle sees
          someone you have already met — not yet recognised — circling back into
          your awareness within the next three lunar cycles.
        </p>
        <p style={{ margin: 0, fontStyle: 'italic', color: '#e8cc7a' }}>
          When they return, ask the question you did not ask the first time.
        </p>
      </div>

      {/* progress dots */}
      <div
        style={{
          position: 'absolute',
          bottom: '180px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        {[true, true, false, false, false].map((done, i) => (
          <span
            key={i}
            style={{
              width: i === 1 ? '32px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: done ? '#c9a84c' : 'rgba(201,168,76,0.3)',
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '94px',
          left: '46px',
          right: '46px',
          height: '78px',
          borderRadius: '14px',
          background: 'transparent',
          border: '1.5px solid rgba(201,168,76,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          color: '#e8cc7a',
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: '18px',
          letterSpacing: '0.18em',
        }}
      >
        CONTINUE TO THE HEAD LINE  →
      </div>
    </div>
  );
}
