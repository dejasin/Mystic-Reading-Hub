import { ScreenshotShell } from './ScreenshotShell';

export function Shot3Chat() {
  return (
    <ScreenshotShell
      index={3}
      eyebrow="Go Deeper"
      headline={<>Ask anything.<br />Anytime.</>}
      subhead={<>Chat with The Oracle —<br />day or night, ages of wisdom away.</>}
    >
      <MockChatScreen />
    </ScreenshotShell>
  );
}

function MockChatScreen() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background:
          'radial-gradient(ellipse at 50% 0%, #14122a 0%, #0b0b1e 60%, #04040f 100%)',
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

      {/* header */}
      <div
        style={{
          marginTop: '24px',
          paddingBottom: '20px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(201,168,76,0.18)',
        }}
      >
        <div
          style={{
            fontFamily: '"Cinzel Decorative", serif',
            fontSize: '20px',
            letterSpacing: '0.45em',
            color: '#c9a84c',
          }}
        >
          ✦  THE ORACLE
        </div>
      </div>

      {/* messages */}
      <div style={{ padding: '36px 28px 0', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <UserBubble>When will I find love?</UserBubble>
        <OracleBubble>
          The Oracle sees a name you have already spoken aloud — once, recently,
          to someone who laughed too quickly. Pay attention to that name when it
          surfaces again. It will arrive twice more before the new moon.
        </OracleBubble>
        <UserBubble>What should I do when it does?</UserBubble>
        <OracleBubble>
          Do not perform. Do not rehearse. Ask one honest question and let the
          answer change the shape of your evening.
        </OracleBubble>
      </div>

      {/* follow-up chips */}
      <div
        style={{
          position: 'absolute',
          bottom: '210px',
          left: '70px',
          right: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'flex-start',
        }}
      >
        <Chip>What does the new moon mean for me?</Chip>
        <Chip>Tell me more about this person.</Chip>
      </div>

      {/* input bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '70px',
          left: '28px',
          right: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            flex: 1,
            height: '78px',
            borderRadius: '24px',
            background: 'rgba(20,18,42,0.8)',
            border: '1px solid rgba(201,168,76,0.25)',
            display: 'flex',
            alignItems: 'center',
            paddingInline: '28px',
            fontFamily: '"EB Garamond", serif',
            fontStyle: 'italic',
            fontSize: '22px',
            color: 'rgba(240,230,204,0.4)',
          }}
        >
          Ask The Oracle...
        </div>
        <div
          style={{
            width: '78px',
            height: '78px',
            borderRadius: '39px',
            background: '#c9a84c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#04040f',
            fontSize: '32px',
          }}
        >
          ➤
        </div>
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        alignSelf: 'flex-end',
        maxWidth: '78%',
        padding: '18px 24px',
        borderRadius: '22px 22px 6px 22px',
        background: 'rgba(201,168,76,0.16)',
        border: '1px solid rgba(201,168,76,0.4)',
        fontSize: '23px',
        lineHeight: 1.45,
        color: '#f0e6cc',
      }}
    >
      {children}
    </div>
  );
}

function OracleBubble({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', maxWidth: '85%' }}>
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '21px',
          border: '1px solid #c9a84c',
          background: 'rgba(201,168,76,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#c9a84c',
          fontSize: '18px',
          flexShrink: 0,
        }}
      >
        ✦
      </div>
      <div
        style={{
          padding: '18px 24px',
          borderRadius: '22px 22px 22px 6px',
          background: 'rgba(20,18,42,0.85)',
          border: '1px solid rgba(201,168,76,0.18)',
          fontSize: '23px',
          lineHeight: 1.5,
          color: '#f0e6cc',
          opacity: 0.95,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '12px 18px',
        borderRadius: '20px',
        border: '1px solid rgba(201,168,76,0.3)',
        background: 'rgba(201,168,76,0.06)',
        fontFamily: '"EB Garamond", serif',
        fontStyle: 'italic',
        fontSize: '18px',
        color: '#e8cc7a',
        opacity: 0.85,
      }}
    >
      {children}
    </div>
  );
}
