import { useState, useEffect } from "react";

const C = {
  bg: "#04040f",
  white: "#f0e6cc",
  gold: "#c9a84c",
  goldLight: "#e8cc7a",
  muted: "#6b6b8a",
  border: "rgba(201,168,76,0.12)",
};

const INSIGHTS = [
  {
    text: "You explain yourself too much. To people who have already decided.",
    tag: "Life Path 7 · Scorpio Rising",
  },
  {
    text: "The thing you keep almost doing? That's the one.",
    tag: "Fate Line Pattern · Expression 3",
  },
  {
    text: "You're not indecisive. You've been waiting for permission you'll never get.",
    tag: "Head Line Break · Life Path 11",
  },
  {
    text: "The people who drained you weren't accidents. Your left iris says you chose them.",
    tag: "Iridology · Soul Urge 2",
  },
  {
    text: "Your gift looks like a problem from the outside. That's exactly how you know it's real.",
    tag: "Mercury Mount · Life Path 33",
  },
];

function Sigil({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 110 110" fill="none">
      <circle cx="55" cy="55" r="52" stroke={C.gold} strokeWidth="1" opacity="0.3" />
      <circle cx="55" cy="55" r="36" stroke={C.gold} strokeWidth="0.8" opacity="0.5" />
      <polygon points="55,12 75,46 35,46" fill="none" stroke={C.gold} strokeWidth="1.4" opacity="0.9" />
      <polygon points="55,98 75,64 35,64" fill="none" stroke={C.gold} strokeWidth="1.4" opacity="0.9" />
      <circle cx="55" cy="55" r="7" fill={C.gold} opacity="0.45" />
      <circle cx="55" cy="55" r="3.5" fill={C.goldLight} opacity="0.9" />
    </svg>
  );
}

export function Surprising() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  const insight = INSIGHTS[idx]!;

  const cycleInsight = () => {
    setFading(true);
    setTimeout(() => {
      setIdx(i => (i + 1) % INSIGHTS.length);
      setFading(false);
    }, 280);
  };

  useEffect(() => {
    const t = setInterval(cycleInsight, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      width: "100%", height: "100vh", background: C.bg,
      fontFamily: "'EB Garamond', Georgia, serif",
      display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
    }}>
      {/* Grid texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.025,
        backgroundImage: "linear-gradient(rgba(240,230,204,1) 1px, transparent 1px), linear-gradient(90deg, rgba(240,230,204,1) 1px, transparent 1px)",
        backgroundSize: "40px 40px", pointerEvents: "none",
      }} />

      {/* ── Header: Oracle branding ── */}
      <div style={{
        position: "relative", zIndex: 2,
        borderBottom: `1px solid ${C.border}`,
        padding: "18px 24px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Left: sigil + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Sigil size={38} />
          <div>
            <div style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 13, fontWeight: 700,
              color: C.gold, letterSpacing: 2, lineHeight: 1,
            }}>THE ORACLE</div>
            <div style={{
              fontSize: 9, color: C.muted,
              letterSpacing: 3, textTransform: "uppercase",
              marginTop: 3,
            }}>AI Mystical Readings</div>
          </div>
        </div>

        {/* Right: pill CTA */}
        <div style={{
          border: `1px solid rgba(201,168,76,0.3)`,
          borderRadius: 20, padding: "6px 14px",
          cursor: "pointer",
        }}>
          <span style={{ fontSize: 11, color: C.gold, letterSpacing: 0.5 }}>Begin →</span>
        </div>
      </div>

      {/* ── Main: rotating insight ── */}
      <div style={{
        position: "relative", zIndex: 2,
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 32px 20px",
      }}>
        {/* Label */}
        <div style={{
          fontSize: 9, letterSpacing: 5, color: C.muted,
          textTransform: "uppercase", marginBottom: 36, opacity: 0.55,
        }}>
          a reading, from your palm
        </div>

        {/* Insight block */}
        <div style={{
          opacity: fading ? 0 : 1,
          transition: "opacity 0.28s ease",
          display: "flex", flexDirection: "column", alignItems: "center",
          minHeight: 180,
        }}>
          {/* Opening quote glyph */}
          <div style={{
            fontFamily: "Georgia, serif", fontSize: 64,
            color: C.gold, opacity: 0.18, lineHeight: 0.6,
            alignSelf: "flex-start", marginLeft: 8, marginBottom: 12,
          }}>&ldquo;</div>

          <p style={{
            margin: "0 0 24px", textAlign: "center",
            fontSize: 22, lineHeight: 1.6,
            color: C.white, fontStyle: "italic",
            letterSpacing: 0.1, maxWidth: 290,
          }}>
            {insight.text}
          </p>
          <div style={{
            fontSize: 10, color: C.gold, opacity: 0.6,
            letterSpacing: 2, textTransform: "uppercase",
          }}>
            {insight.tag}
          </div>
        </div>

        {/* Cycle button */}
        <button onClick={cycleInsight} style={{
          marginTop: 40, background: "none",
          border: `1px solid rgba(240,230,204,0.1)`,
          borderRadius: 24, padding: "9px 24px",
          color: C.muted, fontSize: 12.5, cursor: "pointer",
          fontFamily: "'EB Garamond', Georgia, serif",
          letterSpacing: 0.3, transition: "border-color 0.2s",
        }}>
          another →
        </button>
      </div>

      {/* ── Footer: CTA ── */}
      <div style={{
        position: "relative", zIndex: 2,
        padding: "0 24px 28px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}>
        {/* Thin gold line divider */}
        <div style={{
          width: "100%", height: 1, marginBottom: 8,
          background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
          opacity: 0.15,
        }} />

        <p style={{
          margin: 0, fontSize: 13.5, color: C.muted,
          fontStyle: "italic", textAlign: "center",
        }}>
          Yours will be about you — not a type.
        </p>

        <div style={{
          width: "100%", background: C.gold, borderRadius: 11,
          padding: "15px", textAlign: "center", cursor: "pointer",
          boxShadow: "0 0 22px rgba(201,168,76,0.28)",
        }}>
          <span style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 12, color: C.bg, letterSpacing: 1,
          }}>Begin My Reading</span>
        </div>

        <div style={{ display: "flex", gap: 20, marginTop: 2 }}>
          {["The Vault", "Synastry"].map((l, i) => (
            <span key={i} style={{ fontSize: 12.5, color: C.gold, cursor: "pointer", opacity: 0.65 }}>{l}</span>
          ))}
        </div>

        <p style={{ margin: 0, fontSize: 10.5, color: C.muted, fontStyle: "italic" }}>
          ✦ Your images are never stored or shared.
        </p>
      </div>
    </div>
  );
}
