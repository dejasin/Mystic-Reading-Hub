import { ScreenshotShell } from './ScreenshotShell';

export function Shot5Synastry() {
  return (
    <ScreenshotShell
      index={5}
      eyebrow="People & Synastry"
      headline={<>Two souls,<br />one reading.</>}
      subhead={<>See the threads<br />between you.</>}
    >
      <MockSynastryScreen />
    </ScreenshotShell>
  );
}

function MockSynastryScreen() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background:
          'radial-gradient(ellipse at 50% 25%, #14122a 0%, #0b0b1e 55%, #04040f 100%)',
        position: 'relative',
        color: '#f0e6cc',
        fontFamily: '"EB Garamond", serif',
        overflow: 'hidden',
      }}
    >
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
        }}
      >
        <span>9:41</span>
        <span style={{ fontSize: '14px', letterSpacing: '0.3em' }}>● ● ● ●</span>
      </div>

      <div
        style={{
          marginTop: '28px',
          textAlign: 'center',
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: '32px',
          color: '#f0e6cc',
          letterSpacing: '0.06em',
        }}
      >
        Synastry
      </div>
      <div
        style={{
          marginTop: '6px',
          textAlign: 'center',
          fontFamily: '"EB Garamond", serif',
          fontStyle: 'italic',
          fontSize: '20px',
          color: '#c9a84c',
          opacity: 0.8,
        }}
      >
        Combine two souls.
      </div>

      {/* Two profile cards joined by an infinity sigil */}
      <div
        style={{
          marginTop: '46px',
          marginInline: '36px',
          display: 'flex',
          alignItems: 'stretch',
          gap: '12px',
          position: 'relative',
        }}
      >
        <PersonCard name="Mira" sign="♎ Libra" dob="Born 1992-09-26" hue="#b87b7b" initial="M" />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e8cc7a',
            fontSize: '34px',
            letterSpacing: '0.1em',
            textShadow: '0 0 12px rgba(232,204,122,0.6)',
          }}
        >
          ✦✦
        </div>
        <PersonCard name="Theo" sign="♋ Cancer" dob="Born 1990-07-04" hue="#7bc4a0" initial="T" />
      </div>

      {/* Synastry preview block */}
      <div
        style={{
          marginTop: '36px',
          marginInline: '36px',
          padding: '24px 26px',
          borderRadius: '18px',
          background: 'rgba(20,18,42,0.75)',
          border: '1px solid rgba(201,168,76,0.25)',
        }}
      >
        <div
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '13px',
            letterSpacing: '0.4em',
            color: '#c9a84c',
            opacity: 0.85,
            textTransform: 'uppercase',
          }}
        >
          ✦ The Reading Begins
        </div>
        <div
          style={{
            marginTop: '18px',
            fontFamily: '"EB Garamond", serif',
            fontSize: '21px',
            lineHeight: 1.55,
            color: '#f0e6cc',
            opacity: 0.95,
          }}
        >
          Two heart lines converging at the same depth — a rare alignment. Mira's
          arc rises toward Jupiter; Theo's settles into the Mount of the Moon.
          Where one reaches outward, the other roots inward. The friction is the
          point.
        </div>
        <div
          style={{
            marginTop: '14px',
            fontFamily: '"EB Garamond", serif',
            fontStyle: 'italic',
            fontSize: '20px',
            color: '#e8cc7a',
            opacity: 0.9,
          }}
        >
          You did not meet by accident. You were assigned to teach each other
          patience.
        </div>
      </div>

      {/* Vault footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '94px',
          left: '36px',
          right: '36px',
          padding: '20px 24px',
          borderRadius: '14px',
          background:
            'linear-gradient(180deg, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.06) 100%)',
          border: '1px solid rgba(201,168,76,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '12px',
              letterSpacing: '0.4em',
              color: '#c9a84c',
              opacity: 0.85,
              textTransform: 'uppercase',
            }}
          >
            From The Vault
          </div>
          <div
            style={{
              marginTop: '6px',
              fontFamily: '"EB Garamond", serif',
              fontSize: '20px',
              color: '#f0e6cc',
            }}
          >
            7 profiles · 4 synastries
          </div>
        </div>
        <div
          style={{
            color: '#e8cc7a',
            fontSize: '28px',
          }}
        >
          →
        </div>
      </div>
    </div>
  );
}

function PersonCard({
  name,
  sign,
  dob,
  hue,
  initial,
}: {
  name: string;
  sign: string;
  dob: string;
  hue: string;
  initial: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: '22px 18px',
        borderRadius: '18px',
        background: 'rgba(20,18,42,0.85)',
        border: '1px solid rgba(201,168,76,0.3)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '88px',
          height: '88px',
          borderRadius: '44px',
          margin: '0 auto',
          background: `radial-gradient(circle, ${hue}55 0%, ${hue}22 70%)`,
          border: `1.5px solid ${hue}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: '36px',
          color: '#f0e6cc',
        }}
      >
        {initial}
      </div>
      <div
        style={{
          marginTop: '14px',
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '24px',
          color: '#f0e6cc',
          letterSpacing: '0.05em',
        }}
      >
        {name}
      </div>
      <div
        style={{
          marginTop: '4px',
          fontFamily: '"EB Garamond", serif',
          fontSize: '17px',
          color: '#c9a84c',
          opacity: 0.9,
        }}
      >
        {sign}
      </div>
      <div
        style={{
          marginTop: '4px',
          fontFamily: '"EB Garamond", serif',
          fontSize: '14px',
          color: '#7c7c95',
        }}
      >
        {dob}
      </div>
    </div>
  );
}
