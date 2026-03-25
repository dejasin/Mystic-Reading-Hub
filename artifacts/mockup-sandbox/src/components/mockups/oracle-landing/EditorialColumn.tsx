import { useEffect, useRef } from "react";

const C = {
  bg: "#04040f",
  gold: "#c9a84c",
  goldLight: "#e8cc7a",
  cream: "#f0e6cc",
  muted: "#6b6b8a",
  surface: "#0b0b1e",
  border: "rgba(201,168,76,0.15)",
};

function Sigil({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 110 110" fill="none">
      <circle cx="55" cy="55" r="52" stroke={C.gold} strokeWidth="1" opacity="0.35" />
      <circle cx="55" cy="55" r="36" stroke={C.gold} strokeWidth="0.8" opacity="0.55" />
      <polygon points="55,12 75,46 35,46" fill="none" stroke={C.gold} strokeWidth="1.3" opacity="0.9" />
      <polygon points="55,98 75,64 35,64" fill="none" stroke={C.gold} strokeWidth="1.3" opacity="0.9" />
      <circle cx="55" cy="55" r="7" fill={C.gold} opacity="0.55" />
      <circle cx="55" cy="55" r="3.5" fill={C.goldLight} opacity="0.9" />
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
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = Math.random() * 1 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240,230,204,${Math.random() * 0.4 + 0.05})`;
      ctx.fill();
    }
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

export function EditorialColumn() {
  return (
    <div style={{
      width: "100%", height: "100vh", background: C.bg,
      fontFamily: "'EB Garamond', Georgia, serif",
      display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden"
    }}>
      <StarCanvas />

      {/* Vertical gold rule on far left */}
      <div style={{
        position: "absolute", left: 22, top: 0, bottom: 0, width: 1,
        background: `linear-gradient(180deg, transparent 0%, ${C.gold} 20%, ${C.gold} 80%, transparent 100%)`,
        opacity: 0.22, zIndex: 1
      }} />

      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column",
        height: "100%", padding: "48px 24px 32px 40px"
      }}>

        {/* ── Eyebrow label ── */}
        <div style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 9, letterSpacing: 5,
          color: C.gold, opacity: 0.65,
          textTransform: "uppercase", marginBottom: 28
        }}>
          ✦ &nbsp; A Mystical Reading App &nbsp; ✦
        </div>

        {/* ── Headline + Sigil row ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 38, fontWeight: 700,
              color: C.gold, lineHeight: 1.0,
              letterSpacing: 2
            }}>THE</div>
            <div style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 38, fontWeight: 700,
              color: C.gold, lineHeight: 1.0,
              letterSpacing: 2, marginBottom: 14
            }}>ORACLE</div>
            <div style={{
              fontSize: 17, color: C.cream,
              fontStyle: "italic", lineHeight: 1.7,
              opacity: 0.88, maxWidth: 200
            }}>
              Your palm.<br />Your iris.<br />Your face.<br />Your truth.
            </div>
          </div>
          <div style={{ flexShrink: 0, paddingTop: 4 }}>
            <Sigil size={80} />
          </div>
        </div>

        {/* ── Gold divider ── */}
        <div style={{
          height: 1, marginBottom: 28,
          background: `linear-gradient(90deg, ${C.gold} 0%, transparent 100%)`,
          opacity: 0.3
        }} />

        {/* ── Trust lines: editorial dashes ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 }}>
          {[
            ["Vision Analysis", "Real palm & iris photos read by AI"],
            ["15+ Systems", "Astrology · Numerology · Palmistry"],
            ["10,000+ Seekers", "Trusted worldwide"],
          ].map(([title, sub], i) => (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <div style={{
                width: 20, height: 1, background: C.gold,
                opacity: 0.6, flexShrink: 0, marginBottom: 2, alignSelf: "center"
              }} />
              <div>
                <span style={{ fontSize: 15, color: C.cream, opacity: 0.9 }}>{title}</span>
                <span style={{ fontSize: 13, color: C.muted, marginLeft: 8, fontStyle: "italic" }}>{sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* ── CTA ── */}
        <div style={{
          background: C.gold, borderRadius: 10,
          padding: "16px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", marginBottom: 12,
          boxShadow: `0 0 24px rgba(201,168,76,0.3)`
        }}>
          <span style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 13, color: C.bg, letterSpacing: 1
          }}>Begin Your Reading</span>
          <span style={{ color: C.bg, fontSize: 20 }}>→</span>
        </div>

        {/* ── Secondary row ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{
            flex: 1, padding: "10px 0",
            display: "flex", alignItems: "center", gap: 8,
            cursor: "pointer"
          }}>
            <div style={{ width: 1, height: 16, background: C.gold, opacity: 0.4 }} />
            <span style={{ fontSize: 14, color: C.gold }}>The Vault</span>
          </div>
          <div style={{ width: 1, height: 16, background: C.muted, opacity: 0.3 }} />
          <div style={{
            flex: 1, padding: "10px 0",
            display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8,
            cursor: "pointer"
          }}>
            <span style={{ fontSize: 14, color: C.gold }}>Synastry</span>
            <div style={{ width: 1, height: 16, background: C.gold, opacity: 0.4 }} />
          </div>
        </div>

        <div style={{ fontSize: 11, color: C.muted, fontStyle: "italic", paddingLeft: 0 }}>
          ✦&ensp;Your images are never stored or shared.
        </div>
      </div>
    </div>
  );
}
