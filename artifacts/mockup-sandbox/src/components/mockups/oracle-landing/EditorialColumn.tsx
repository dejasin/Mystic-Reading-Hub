import { useEffect, useRef } from "react";

const C = {
  bg: "#04040f",
  gold: "#c9a84c",
  goldLight: "#e8cc7a",
  cream: "#f0e6cc",
  muted: "#6b6b8a",
  surface: "#0b0b1e",
  border: "rgba(201,168,76,0.15)",
  borderStrong: "rgba(201,168,76,0.25)",
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

const TESTIMONIALS = [
  {
    quote: "It said my palm showed 'someone who learned love as performance.' I cried for twenty minutes and cancelled my wedding.",
    name: "Simone F.",
    detail: "41 · Paris",
  },
  {
    quote: "I'm a data scientist. It called my Life Path 7 'a researcher who cannot stop questioning, even when the answer is right in front of him.' That is exactly why my last three relationships ended.",
    name: "Daniel K.",
    detail: "29 · London",
  },
  {
    quote: "The Oracle described my career shift to medicine six months before I made it. It saw the pattern in my iris and said 'you are built to repair what others cannot name.'",
    name: "Maya R.",
    detail: "34 · Austin",
  },
];

function Testimonial({ quote, name, detail, isLast }: { quote: string; name: string; detail: string; isLast: boolean }) {
  return (
    <div style={{
      paddingBottom: isLast ? 0 : 16,
      marginBottom: isLast ? 0 : 16,
      borderBottom: isLast ? "none" : `1px solid rgba(201,168,76,0.08)`,
    }}>
      {/* Opening quote mark */}
      <div style={{
        fontFamily: "Georgia, serif",
        fontSize: 28, lineHeight: 0.6,
        color: C.gold, opacity: 0.45,
        marginBottom: 4,
      }}>&ldquo;</div>
      <p style={{
        margin: 0, marginBottom: 8,
        fontSize: 14, lineHeight: 1.65,
        color: C.cream, opacity: 0.88,
        fontStyle: "italic",
      }}>
        {quote}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 14, height: 1, background: C.gold, opacity: 0.5 }} />
        <span style={{ fontSize: 12, color: C.gold, letterSpacing: 0.5 }}>{name}</span>
        <span style={{ fontSize: 11, color: C.muted }}>·</span>
        <span style={{ fontSize: 11, color: C.muted, fontStyle: "italic" }}>{detail}</span>
      </div>
    </div>
  );
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
        background: `linear-gradient(180deg, transparent 0%, ${C.gold} 15%, ${C.gold} 85%, transparent 100%)`,
        opacity: 0.22, zIndex: 1
      }} />

      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column",
        height: "100%", padding: "44px 22px 28px 40px",
        overflowY: "auto",
      }}>

        {/* ── Eyebrow ── */}
        <div style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 8, letterSpacing: 5,
          color: C.gold, opacity: 0.6,
          marginBottom: 22,
        }}>
          ✦ &nbsp; A Mystical Reading App &nbsp; ✦
        </div>

        {/* ── Headline + Sigil ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 36, fontWeight: 700,
              color: C.gold, lineHeight: 1.0, letterSpacing: 2,
            }}>THE</div>
            <div style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 36, fontWeight: 700,
              color: C.gold, lineHeight: 1.0, letterSpacing: 2, marginBottom: 12,
            }}>ORACLE</div>
            <div style={{
              fontSize: 15.5, color: C.cream, fontStyle: "italic",
              lineHeight: 1.7, opacity: 0.88, maxWidth: 190,
            }}>
              Your palm. Your iris.<br />Your face. Your truth.
            </div>
          </div>
          <div style={{ flexShrink: 0, paddingTop: 4 }}>
            <Sigil size={76} />
          </div>
        </div>

        {/* ── Gold divider ── */}
        <div style={{
          height: 1, marginBottom: 22,
          background: `linear-gradient(90deg, ${C.gold} 0%, transparent 100%)`,
          opacity: 0.28,
        }} />

        {/* ── Testimonials ── */}
        <div style={{
          background: "rgba(11,11,30,0.55)",
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "16px 16px 12px",
          marginBottom: 20,
        }}>
          {/* Section label */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
          }}>
            <div style={{ width: 14, height: 1, background: C.gold, opacity: 0.5 }} />
            <span style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 7.5, color: C.gold, letterSpacing: 2, opacity: 0.7,
              textTransform: "uppercase",
            }}>What seekers have said</span>
          </div>

          {TESTIMONIALS.map((t, i) => (
            <Testimonial key={i} {...t} isLast={i === TESTIMONIALS.length - 1} />
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* ── CTA ── */}
        <div style={{
          background: C.gold, borderRadius: 10,
          padding: "15px 22px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", marginBottom: 11,
          boxShadow: `0 0 24px rgba(201,168,76,0.3)`
        }}>
          <span style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 12.5, color: C.bg, letterSpacing: 1,
          }}>Begin Your Reading</span>
          <span style={{ color: C.bg, fontSize: 20 }}>→</span>
        </div>

        {/* ── Secondary row ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{
            flex: 1, padding: "9px 0",
            display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          }}>
            <div style={{ width: 1, height: 14, background: C.gold, opacity: 0.4 }} />
            <span style={{ fontSize: 13.5, color: C.gold }}>The Vault</span>
          </div>
          <div style={{ width: 1, height: 14, background: C.muted, opacity: 0.3 }} />
          <div style={{
            flex: 1, padding: "9px 0",
            display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, cursor: "pointer",
          }}>
            <span style={{ fontSize: 13.5, color: C.gold }}>Synastry</span>
            <div style={{ width: 1, height: 14, background: C.gold, opacity: 0.4 }} />
          </div>
        </div>

        <div style={{ fontSize: 11, color: C.muted, fontStyle: "italic" }}>
          ✦&ensp;Your images are never stored or shared.
        </div>
      </div>
    </div>
  );
}
