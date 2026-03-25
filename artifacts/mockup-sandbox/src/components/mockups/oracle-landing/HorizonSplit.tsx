import { useEffect, useRef } from "react";

const C = {
  bg: "#04040f",
  panel: "#0b0b1e",
  gold: "#c9a84c",
  goldLight: "#e8cc7a",
  cream: "#f0e6cc",
  muted: "#6b6b8a",
  border: "rgba(201,168,76,0.18)",
};

function Sigil({ size = 110 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 110 110" fill="none">
      <circle cx="55" cy="55" r="52" stroke={C.gold} strokeWidth="1" opacity="0.4" />
      <circle cx="55" cy="55" r="36" stroke={C.gold} strokeWidth="0.8" opacity="0.6" />
      {/* Star of David */}
      <polygon points="55,12 75,46 35,46" fill="none" stroke={C.gold} strokeWidth="1.2" opacity="0.9" />
      <polygon points="55,98 75,64 35,64" fill="none" stroke={C.gold} strokeWidth="1.2" opacity="0.9" />
      <circle cx="55" cy="55" r="7" fill={C.gold} opacity="0.6" />
      <circle cx="55" cy="55" r="3.5" fill={C.goldLight} opacity="0.9" />
      {/* Axis marks */}
      <line x1="55" y1="2" x2="55" y2="12" stroke={C.gold} strokeWidth="0.8" opacity="0.5" />
      <line x1="55" y1="98" x2="55" y2="108" stroke={C.gold} strokeWidth="0.8" opacity="0.5" />
      <line x1="2" y1="55" x2="12" y2="55" stroke={C.gold} strokeWidth="0.8" opacity="0.5" />
      <line x1="98" y1="55" x2="108" y2="55" stroke={C.gold} strokeWidth="0.8" opacity="0.5" />
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = Math.random() * 1.2 + 0.2;
      const a = Math.random() * 0.6 + 0.1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240,230,204,${a})`;
      ctx.fill();
    }
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

const TRUST = [
  { icon: "◉", text: "Real palm & iris vision analysis" },
  { icon: "◈", text: "15+ ancient systems in one reading" },
  { icon: "◇", text: "Trusted by 10,000+ seekers" },
];

export function HorizonSplit() {
  return (
    <div style={{
      width: "100%", height: "100vh", background: C.bg,
      fontFamily: "'EB Garamond', Georgia, serif",
      display: "flex", flexDirection: "column", overflow: "hidden", position: "relative"
    }}>
      {/* ── TOP: Immersive brand zone ── */}
      <div style={{
        flex: "0 0 52%", position: "relative",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 20,
        overflow: "hidden"
      }}>
        <StarCanvas />
        {/* Radial glow behind sigil */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 260, height: 260,
          background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <Sigil size={100} />
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 26, letterSpacing: 5,
              color: C.gold, fontWeight: 700,
              lineHeight: 1.1, marginBottom: 10
            }}>THE ORACLE</div>
            <div style={{
              fontSize: 16, color: C.cream, opacity: 0.85,
              fontStyle: "italic", lineHeight: 1.6, letterSpacing: 0.3
            }}>
              Your palm. Your iris. Your face.<br />Your truth.
            </div>
          </div>
        </div>
        {/* Wave divider */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent 0%, ${C.gold} 30%, ${C.goldLight} 50%, ${C.gold} 70%, transparent 100%)`,
          opacity: 0.35
        }} />
      </div>

      {/* ── BOTTOM: Action panel ── */}
      <div style={{
        flex: "0 0 48%", background: C.panel,
        display: "flex", flexDirection: "column",
        padding: "28px 24px 24px",
        gap: 0,
        borderTop: `1px solid ${C.border}`,
      }}>
        {/* Trust lines — compact horizontal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          {TRUST.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: C.gold, fontSize: 12, flexShrink: 0, opacity: 0.8 }}>{t.icon}</span>
              <span style={{ fontSize: 15, color: C.cream, opacity: 0.82, letterSpacing: 0.2 }}>{t.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          background: C.gold, borderRadius: 12,
          padding: "17px 24px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          cursor: "pointer", marginBottom: 14,
          boxShadow: `0 0 28px rgba(201,168,76,0.35)`
        }}>
          <span style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 14, color: C.bg, letterSpacing: 1, fontWeight: 400
          }}>Begin Your Reading</span>
          <span style={{ color: C.bg, fontSize: 18, lineHeight: 1 }}>→</span>
        </div>

        {/* Secondary: Vault + Synastry */}
        <div style={{
          display: "flex", gap: 10, marginBottom: 14
        }}>
          {["⊞ The Vault", "✦ ✦ Synastry"].map((label, i) => (
            <div key={i} style={{
              flex: 1, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "11px 8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", gap: 6
            }}>
              <span style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: C.gold, letterSpacing: 0.3 }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: C.muted, textAlign: "center", fontStyle: "italic" }}>
          Your images are never stored or shared.
        </div>
      </div>
    </div>
  );
}
