import { useEffect, useRef } from "react";

const C = {
  bg: "#050310",
  surface: "#0a071f",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  gold: "#c9a84c",
  silver: "#a8b4cc",
  cream: "#ede8f5",
  muted: "#6b6280",
  border: "rgba(139,92,246,0.2)",
  glow: "rgba(99,102,241,0.12)",
};

function MandalaIcon({ size = 120 }: { size?: number }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 2;
  const rings = [r * 0.9, r * 0.72, r * 0.54, r * 0.36];
  const spokeCount = 12;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {rings.map((radius, ri) => (
        <circle key={ri} cx={cx} cy={cy} r={radius}
          stroke={ri % 2 === 0 ? C.violet : C.gold}
          strokeWidth={ri === 0 ? 0.8 : 0.6}
          opacity={0.25 + ri * 0.12} />
      ))}
      {/* Spokes */}
      {Array.from({ length: spokeCount }).map((_, i) => {
        const angle = (i * Math.PI * 2) / spokeCount;
        const x1 = cx + Math.cos(angle) * rings[1]!;
        const y1 = cy + Math.sin(angle) * rings[1]!;
        const x2 = cx + Math.cos(angle) * rings[3]!;
        const y2 = cy + Math.sin(angle) * rings[3]!;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={C.gold} strokeWidth="0.5" opacity="0.25" />;
      })}
      {/* Star of David */}
      <polygon points={`${cx},${cy - rings[2]!} ${cx + rings[2]! * 0.866},${cy + rings[2]! * 0.5} ${cx - rings[2]! * 0.866},${cy + rings[2]! * 0.5}`}
        fill="none" stroke={C.violet} strokeWidth="1" opacity="0.55" />
      <polygon points={`${cx},${cy + rings[2]!} ${cx + rings[2]! * 0.866},${cy - rings[2]! * 0.5} ${cx - rings[2]! * 0.866},${cy - rings[2]! * 0.5}`}
        fill="none" stroke={C.gold} strokeWidth="1" opacity="0.55" />
      {/* Petal dots */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 8;
        return <circle key={i} cx={cx + Math.cos(a) * rings[3]!} cy={cy + Math.sin(a) * rings[3]!}
          r="1.5" fill={C.gold} opacity="0.5" />;
      })}
      <circle cx={cx} cy={cy} r="5" fill={C.violet} opacity="0.5" />
      <circle cx={cx} cy={cy} r="2.5" fill={C.cream} opacity="0.9" />
    </svg>
  );
}

function CosmicCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    // Dense star field
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = Math.random() * 1.4 + 0.1;
      const isGold = Math.random() < 0.12;
      const a = Math.random() * 0.6 + 0.1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = isGold ? `rgba(201,168,76,${a})` : `rgba(180,160,230,${a * 0.6})`;
      ctx.fill();
    }
    // Nebula-like glow patches
    for (let i = 0; i < 3; i++) {
      const grd = ctx.createRadialGradient(
        Math.random() * canvas.width, Math.random() * canvas.height, 0,
        Math.random() * canvas.width, Math.random() * canvas.height, 150
      );
      grd.addColorStop(0, "rgba(99,102,241,0.06)");
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

const TESTIMONIALS = [
  { quote: "It read my soul contract. I saw the karmic loop I've been in since birth.", name: "Selene A." },
  { quote: "The Akashic resonance section described my past-life wound in exact detail.", name: "Orion V." },
];

export function Metaphysical() {
  return (
    <div style={{
      width: "100%", height: "100vh", background: C.bg,
      fontFamily: "'EB Garamond', Georgia, serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      position: "relative", overflow: "hidden",
    }}>
      <CosmicCanvas />

      {/* Deep glow from center */}
      <div style={{
        position: "absolute", top: "28%", left: "50%", transform: "translateX(-50%)",
        width: 300, height: 300,
        background: "radial-gradient(ellipse, rgba(139,92,246,0.14) 0%, rgba(99,102,241,0.06) 40%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "42px 24px 28px", width: "100%", boxSizing: "border-box",
      }}>
        {/* Cosmic label */}
        <div style={{
          fontSize: 9, letterSpacing: 5, color: C.violet, opacity: 0.7,
          textTransform: "uppercase", marginBottom: 22, textAlign: "center",
        }}>
          ✦ &nbsp; Soul Blueprint Decoding &nbsp; ✦
        </div>

        <MandalaIcon size={118} />

        <div style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 22, letterSpacing: 3, fontWeight: 700,
          color: C.gold, textAlign: "center", marginTop: 16, marginBottom: 6,
        }}>THE ORACLE</div>

        <div style={{ fontSize: 12, letterSpacing: 3, color: C.violet, opacity: 0.7, marginBottom: 14, textAlign: "center" }}>
          AKASHIC · PALM · IRIS · FACE
        </div>

        <p style={{
          fontSize: 16, color: C.cream, fontStyle: "italic",
          textAlign: "center", lineHeight: 1.75, opacity: 0.88,
          maxWidth: 280, marginBottom: 24,
        }}>
          Your body carries the memory of every life you have lived.<br />
          The Oracle reads what your soul encoded in your flesh.
        </p>

        {/* Divider with rune marks */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, width: "100%",
          maxWidth: 300, marginBottom: 24,
        }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${C.violet})`, opacity: 0.3 }} />
          <span style={{ fontSize: 11, color: C.gold, opacity: 0.6, letterSpacing: 4 }}>ᚠ ᚢ ᚦ</span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.violet}, transparent)`, opacity: 0.3 }} />
        </div>

        {/* Testimonials */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300, marginBottom: 24 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              background: "rgba(10,7,31,0.7)", border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "14px 16px",
            }}>
              <p style={{ margin: "0 0 8px", fontSize: 14, color: C.cream, fontStyle: "italic", lineHeight: 1.6, opacity: 0.9 }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 1, background: C.violet, opacity: 0.5 }} />
                <span style={{ fontSize: 11, color: C.muted }}>{t.name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Systems list */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6,
          justifyContent: "center", maxWidth: 300, marginBottom: 24,
        }}>
          {["Palmistry","Iridology","Mianxiang","Astrology","Numerology","Tarot","Human Design","I Ching"].map((s, i) => (
            <span key={i} style={{
              fontSize: 10, color: C.muted, border: `1px solid rgba(139,92,246,0.15)`,
              borderRadius: 12, padding: "3px 9px", letterSpacing: 0.5,
            }}>{s}</span>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          width: "100%", maxWidth: 300,
          background: `linear-gradient(135deg, ${C.indigo}, ${C.violet})`,
          borderRadius: 12, padding: "16px", textAlign: "center",
          cursor: "pointer", marginBottom: 12,
          boxShadow: `0 0 30px rgba(139,92,246,0.3)`,
        }}>
          <span style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 12, color: "#fff", letterSpacing: 1,
          }}>Open the Akashic Portal</span>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {["The Vault", "Synastry"].map((l, i) => (
            <span key={i} style={{ fontSize: 13, color: C.violet, cursor: "pointer" }}>{l}</span>
          ))}
        </div>

        <p style={{ marginTop: 16, fontSize: 10, color: C.muted, textAlign: "center", fontStyle: "italic" }}>
          ✦ Your sacred images are never stored.
        </p>
      </div>
    </div>
  );
}
