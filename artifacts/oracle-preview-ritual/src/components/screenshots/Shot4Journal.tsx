import { ScreenshotShell } from './ScreenshotShell';

export function Shot4Journal() {
  return (
    <ScreenshotShell
      index={4}
      eyebrow="Daily Guidance & Journal"
      headline={<>Your daily advisor.<br />Saved, forever.</>}
      subhead={<>Every session kept.<br />Every insight remembered.</>}
    >
      <MockJournalScreen />
    </ScreenshotShell>
  );
}

function MockJournalScreen() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background:
          'radial-gradient(ellipse at 50% 0%, #14122a 0%, #0b0b1e 55%, #04040f 100%)',
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

      {/* header */}
      <div
        style={{
          marginTop: '32px',
          textAlign: 'center',
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: '34px',
          color: '#f0e6cc',
          letterSpacing: '0.06em',
        }}
      >
        Journal
      </div>

      {/* Daily Oracle hero card */}
      <div
        style={{
          marginTop: '32px',
          marginInline: '36px',
          padding: '28px 28px 26px',
          borderRadius: '20px',
          background:
            'linear-gradient(160deg, rgba(201,168,76,0.18) 0%, rgba(20,18,42,0.85) 100%)',
          border: '1.5px solid rgba(232,204,122,0.55)',
          boxShadow: '0 0 28px rgba(201,168,76,0.2)',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '13px',
            letterSpacing: '0.4em',
            color: '#e8cc7a',
            textTransform: 'uppercase',
          }}
        >
          <span>✦ Today's Oracle</span>
          <span style={{ opacity: 0.7 }}>April 21</span>
        </div>
        <div
          style={{
            marginTop: '18px',
            fontFamily: '"Cinzel Decorative", serif',
            fontSize: '26px',
            color: '#f0e6cc',
            letterSpacing: '0.04em',
            lineHeight: 1.2,
          }}
        >
          Trust the door that opens twice.
        </div>
        <div
          style={{
            marginTop: '14px',
            fontFamily: '"EB Garamond", serif',
            fontStyle: 'italic',
            fontSize: '20px',
            color: '#e0d4a8',
            opacity: 0.9,
            lineHeight: 1.5,
          }}
        >
          A small offer will repeat itself this week. The first time, you will
          almost say no. The second time, listen.
        </div>
      </div>

      {/* History list */}
      <div
        style={{
          marginTop: '34px',
          paddingInline: '36px',
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '13px',
          letterSpacing: '0.4em',
          color: '#c9a84c',
          opacity: 0.7,
          textTransform: 'uppercase',
        }}
      >
        Your Saved Sessions
      </div>

      <div style={{ marginTop: '18px', paddingInline: '36px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Entry
          tag="Full Session"
          tagColor="#c9a84c"
          icon="✦"
          title="The Patient Heart"
          preview="Your heart line carves a long, deliberate arc — beginning between Jupiter and…"
          date="Apr 18, 2026"
          starred
        />
        <Entry
          tag="Deep Dive"
          tagColor="#8b9fd4"
          icon="◇"
          title="Career — Your Unfinished Direction"
          preview="The fate line breaks twice before reaching the mount of Saturn. This is not failure…"
          date="Apr 12, 2026"
        />
        <Entry
          tag="Synastry"
          tagColor="#b87b7b"
          icon="♡"
          title="Mira & Theo"
          preview="Two heart lines converging at the same depth — a rare alignment. The friction…"
          date="Apr 03, 2026"
          starred
        />
      </div>
    </div>
  );
}

function Entry({
  tag,
  tagColor,
  icon,
  title,
  preview,
  date,
  starred,
}: {
  tag: string;
  tagColor: string;
  icon: string;
  title: string;
  preview: string;
  date: string;
  starred?: boolean;
}) {
  return (
    <div
      style={{
        padding: '20px 22px',
        borderRadius: '16px',
        background: 'rgba(20,18,42,0.7)',
        border: '1px solid rgba(201,168,76,0.18)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: '12px',
            background: 'rgba(201,168,76,0.08)',
            fontFamily: '"EB Garamond", serif',
            fontSize: '14px',
            letterSpacing: '0.08em',
            color: tagColor,
          }}
        >
          <span>{icon}</span>
          <span>{tag}</span>
        </div>
        <span
          style={{
            color: starred ? '#c9a84c' : 'rgba(201,168,76,0.35)',
            fontSize: '20px',
          }}
        >
          ★
        </span>
      </div>
      <div
        style={{
          marginTop: '10px',
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '20px',
          color: '#f0e6cc',
          letterSpacing: '0.03em',
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: '6px',
          fontFamily: '"EB Garamond", serif',
          fontSize: '17px',
          color: '#9b9bb5',
          lineHeight: 1.4,
        }}
      >
        {preview}
      </div>
      <div
        style={{
          marginTop: '10px',
          fontSize: '13px',
          color: '#7c7c95',
          letterSpacing: '0.06em',
        }}
      >
        {date}
      </div>
    </div>
  );
}
