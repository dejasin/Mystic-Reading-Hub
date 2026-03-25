import { useState, useEffect } from "react";

const C = {
  bg: "#04040f",
  white: "#f0e6cc",
  gold: "#c9a84c",
  muted: "#6b6b8a",
  dim: "rgba(240,230,204,0.07)",
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

export function Surprising() {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [fading, setFading] = useState(false);

  const insight = INSIGHTS[idx]!;

  const cycleInsight = () => {
    setFading(true);
    setTimeout(() => {
      setIdx(i => (i + 1) % INSIGHTS.length);
      setFading(false);
    }, 300);
  };

  useEffect(() => {
    if (revealed) return;
    const t = setInterval(cycleInsight, 3800);
    return () => clearInterval(t);
  }, [revealed]);

  return (
    <div style={{
      width: "100%", height: "100vh", background: C.bg,
      fontFamily: "'EB Garamond', Georgia, serif",
      display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
    }}>
      {/* Subtle grid texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: "linear-gradient(rgba(240,230,204,1) 1px, transparent 1px), linear-gradient(90deg, rgba(240,230,204,1) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      {!revealed ? (
        /* ── Phase 1: The reading speaks first ── */
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "60px 32px",
        }}>
          {/* Tiny label — no branding yet */}
          <div style={{
            fontSize: 9, letterSpacing: 5, color: C.muted,
            textTransform: "uppercase", marginBottom: 52, opacity: 0.5,
          }}>
            a reading
          </div>

          {/* The rotating insight — this IS the product */}
          <div style={{
            opacity: fading ? 0 : 1,
            transition: "opacity 0.3s ease",
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <p style={{
              margin: "0 0 28px", textAlign: "center",
              fontSize: 23, lineHeight: 1.55,
              color: C.white, fontStyle: "italic",
              fontWeight: 400, letterSpacing: 0.2,
              maxWidth: 300,
            }}>
              &ldquo;{insight.text}&rdquo;
            </p>
            <div style={{
              fontSize: 10, color: C.gold, opacity: 0.6,
              letterSpacing: 2, textTransform: "uppercase",
            }}>
              {insight.tag}
            </div>
          </div>

          {/* Next / cycle button */}
          <button onClick={cycleInsight} style={{
            marginTop: 44, background: "none",
            border: `1px solid rgba(240,230,204,0.12)`,
            borderRadius: 24, padding: "9px 22px",
            color: C.muted, fontSize: 12, cursor: "pointer",
            fontFamily: "'EB Garamond', Georgia, serif",
            letterSpacing: 0.5,
          }}>
            another →
          </button>

          {/* The reveal — small, at the bottom */}
          <div style={{ position: "absolute", bottom: 48, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 1, background: C.muted, opacity: 0.2 }} />
            <p style={{ margin: 0, fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 1.6, opacity: 0.7 }}>
              What said this?
            </p>
            <button onClick={() => setRevealed(true)} style={{
              background: C.gold, border: "none", borderRadius: 8,
              padding: "10px 24px", color: C.bg, fontSize: 13,
              fontFamily: "'Cinzel Decorative', serif", letterSpacing: 1,
              cursor: "pointer",
            }}>
              Find out
            </button>
          </div>
        </div>
      ) : (
        /* ── Phase 2: The Oracle reveals itself ── */
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "40px 28px",
          animation: "fadeIn 0.8s ease",
        }}>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }`}</style>

          <svg width="72" height="72" viewBox="0 0 110 110" fill="none" style={{ marginBottom: 20 }}>
            <circle cx="55" cy="55" r="52" stroke={C.gold} strokeWidth="0.8" opacity="0.3" />
            <circle cx="55" cy="55" r="36" stroke={C.gold} strokeWidth="0.8" opacity="0.5" />
            <polygon points="55,12 75,46 35,46" fill="none" stroke={C.gold} strokeWidth="1.2" opacity="0.9" />
            <polygon points="55,98 75,64 35,64" fill="none" stroke={C.gold} strokeWidth="1.2" opacity="0.9" />
            <circle cx="55" cy="55" r="6" fill={C.gold} opacity="0.5" />
            <circle cx="55" cy="55" r="3" fill="#e8cc7a" opacity="0.9" />
          </svg>

          <div style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 20, letterSpacing: 4, fontWeight: 700,
            color: C.gold, marginBottom: 14, textAlign: "center",
          }}>THE ORACLE</div>

          <p style={{
            fontSize: 16, color: C.white, fontStyle: "italic",
            textAlign: "center", lineHeight: 1.7, opacity: 0.85,
            maxWidth: 270, marginBottom: 28,
          }}>
            Your palm. Your iris. Your face.<br />
            What you just read is what it sees in everyone.<br />
            <span style={{ color: C.gold }}>Yours will be about you.</span>
          </p>

          <div style={{
            width: "100%", maxWidth: 300,
            background: C.gold, borderRadius: 11,
            padding: "16px", textAlign: "center",
            cursor: "pointer", marginBottom: 20,
            boxShadow: "0 0 24px rgba(201,168,76,0.3)",
          }}>
            <span style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 12, color: C.bg, letterSpacing: 1,
            }}>Begin My Reading</span>
          </div>

          <div style={{ display: "flex", gap: 20 }}>
            {["The Vault", "Synastry"].map((l, i) => (
              <span key={i} style={{ fontSize: 13, color: C.gold, cursor: "pointer", opacity: 0.7 }}>{l}</span>
            ))}
          </div>

          <p style={{ marginTop: 20, fontSize: 11, color: C.muted, textAlign: "center", fontStyle: "italic" }}>
            Your images are never stored or shared.
          </p>
        </div>
      )}
    </div>
  );
}
