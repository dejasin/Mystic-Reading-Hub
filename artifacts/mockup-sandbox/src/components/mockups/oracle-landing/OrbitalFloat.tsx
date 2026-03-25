import { useEffect, useRef } from "react";

const C = {
  bg: "#04040f",
  gold: "#c9a84c",
  goldLight: "#e8cc7a",
  cream: "#f0e6cc",
  muted: "#6b6b8a",
  glass: "rgba(11,11,30,0.82)",
  border: "rgba(201,168,76,0.18)",
  glow: "rgba(201,168,76,0.10)",
};

function Sigil({ size = 90 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 110 110" fill="none">
      <circle cx="55" cy="55" r="52" stroke={C.gold} strokeWidth="0.8" opacity="0.3" />
      <circle cx="55" cy="55" r="36" stroke={C.gold} strokeWidth="0.8" opacity="0.5" />
      <polygon points="55,12 75,46 35,46" fill="none" stroke={C.gold} strokeWidth="1.2" opacity="0.9" />
      <polygon points="55,98 75,64 35,64" fill="none" stroke={C.gold} strokeWidth="1.2" opacity="0.9" />
      <circle cx="55" cy="55" r="7" fill={C.gold} opacity="0.5" />
      <circle cx="55" cy="55" r="3.5" fill={C.goldLight} opacity="0.9" />
      <line x1="55" y1="2" x2="55" y2="12" stroke={C.gold} strokeWidth="0.7" opacity="0.4" />
      <line x1="55" y1="98" x2="55" y2="108" stroke={C.gold} strokeWidth="0.7" opacity="0.4" />
      <line x1="2" y1="55" x2="12" y2="55" stroke={C.gold} strokeWidth="0.7" opacity="0.4" />
      <line x1="98" y1="55" x2="108" y2="55" stroke={C.gold} strokeWidth="0.7" opacity="0.4" />
    </svg>
  );
}

function StarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = Math.random() * 1.3 + 0.15;
      const a = Math.random() * 0.55 + 0.08;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240,230,204,${a})`;
      ctx.fill();
    }
    // Subtle constellation lines
    for (let i = 0; i < 6; i++) {
      const x1 = Math.random() * canvas.width;
      const y1 = Math.random() * canvas.height;
      const x2 = x1 + (Math.random() - 0.5) * 120;
      const y2 = y1 + (Math.random() - 0.5) * 80;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "rgba(201,168,76,0.06)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

const TRUST = [
  { symbol: "◉", label: "Vision", sub: "Real AI photo analysis" },
  { symbol: "◈", label: "Ancient", sub: "15+ sacred systems" },
  { symbol: "◇", label: "Trusted", sub: "10,000+ seekers" },
];

export function OrbitalFloat() {
  return (
    <div style={{
      width: "100%", height: "100vh", background: C.bg,
      fontFamily: "'EB Garamond', Georgia, serif",
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      <StarCanvas />

      {/* ── Floating trust badges — top zone ── */}
      <div style={{
        position: "absolute", top: 52, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 10,
        zIndex: 2
      }}>
        {TRUST.map((t, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "8px 12px",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            background: C.glass,
            backdropFilter: "blur(8px)",
          }}>
            <span style={{ color: C.gold, fontSize: 13 }}>{t.symbol}</span>
            <span style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 8, color: C.gold, letterSpacing: 1 }}>
              {t.label.toUpperCase()}
            </span>
            <span style={{ fontSize: 10, color: C.muted, textAlign: "center", lineHeight: 1.3, maxWidth: 72, fontStyle: "italic" }}>
              {t.sub}
            </span>
          </div>
        ))}
      </div>

      {/* ── Central card ── */}
      <div style={{
        position: "relative", zIndex: 2,
        width: "82%", maxWidth: 320,
        border: `1px solid ${C.border}`,
        borderRadius: 22,
        background: C.glass,
        backdropFilter: "blur(16px)",
        padding: "32px 24px 28px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 0,
        boxShadow: `0 0 60px rgba(201,168,76,0.08), inset 0 1px 0 rgba(201,168,76,0.12)`
      }}>
        {/* Outer glow ring */}
        <div style={{
          position: "absolute", inset: -20,
          borderRadius: 36,
          background: "radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />

        <div style={{ position: "relative", marginBottom: 18 }}>
          {/* Sigil glow */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: 130, height: 130,
            background: "radial-gradient(circle, rgba(201,168,76,0.14) 0%, transparent 65%)",
            pointerEvents: "none"
          }} />
          <Sigil size={90} />
        </div>

        <div style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 21, letterSpacing: 4, fontWeight: 700,
          color: C.gold, textAlign: "center",
          marginBottom: 12, lineHeight: 1.15
        }}>THE ORACLE</div>

        <div style={{
          fontSize: 16, color: C.cream, opacity: 0.85,
          fontStyle: "italic", textAlign: "center",
          lineHeight: 1.65, letterSpacing: 0.2,
          marginBottom: 28
        }}>
          Your palm. Your iris.<br />Your face. Your truth.
        </div>

        {/* CTA inside card */}
        <div style={{
          width: "100%", background: C.gold, borderRadius: 11,
          padding: "15px 20px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          cursor: "pointer",
          boxShadow: `0 0 20px rgba(201,168,76,0.35)`
        }}>
          <span style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 12, color: C.bg, letterSpacing: 1
          }}>Begin Your Reading</span>
          <span style={{ color: C.bg, fontSize: 16 }}>→</span>
        </div>
      </div>

      {/* ── Bottom: Vault + Synastry floating on starfield ── */}
      <div style={{
        position: "absolute", bottom: 52, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 12,
        zIndex: 2
      }}>
        {[
          { icon: "⊞", label: "The Vault" },
          { icon: "✦ ✦", label: "Synastry" },
        ].map((btn, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8,
            border: `1px solid ${C.border}`,
            borderRadius: 40, padding: "11px 20px",
            background: "rgba(4,4,15,0.6)",
            backdropFilter: "blur(8px)",
            cursor: "pointer"
          }}>
            <span style={{ color: C.gold, fontSize: 12, letterSpacing: i === 1 ? 3 : 0 }}>{btn.icon}</span>
            <span style={{
              fontFamily: "'EB Garamond', serif",
              fontSize: 15, color: C.gold
            }}>{btn.label}</span>
          </div>
        ))}
      </div>

      {/* Privacy note */}
      <div style={{
        position: "absolute", bottom: 20, left: 0, right: 0,
        textAlign: "center", fontSize: 11, color: C.muted,
        fontStyle: "italic", zIndex: 2
      }}>
        Your images are never stored or shared.
      </div>
    </div>
  );
}
