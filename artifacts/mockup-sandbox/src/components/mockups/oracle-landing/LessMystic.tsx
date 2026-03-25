import { useEffect, useRef } from "react";

const C = {
  bg: "#0f1016",
  card: "#161820",
  amber: "#c4874a",
  amberLight: "#e0a96d",
  cream: "#f2ede6",
  muted: "#8a8aa0",
  border: "rgba(196,135,74,0.18)",
  dimBorder: "rgba(255,255,255,0.06)",
};

function EyeIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="30" stroke={C.amber} strokeWidth="1" opacity="0.25" />
      <circle cx="32" cy="32" r="20" stroke={C.amber} strokeWidth="1" opacity="0.4" />
      <circle cx="32" cy="32" r="10" stroke={C.amber} strokeWidth="1.5" opacity="0.7" />
      <circle cx="32" cy="32" r="4" fill={C.amber} opacity="0.8" />
      <line x1="2" y1="32" x2="12" y2="32" stroke={C.amber} strokeWidth="1" opacity="0.35" />
      <line x1="52" y1="32" x2="62" y2="32" stroke={C.amber} strokeWidth="1" opacity="0.35" />
      <line x1="32" y1="2" x2="32" y2="12" stroke={C.amber} strokeWidth="1" opacity="0.35" />
      <line x1="32" y1="52" x2="32" y2="62" stroke={C.amber} strokeWidth="1" opacity="0.35" />
    </svg>
  );
}

const REVIEWS = [
  { stars: 5, text: "Eerily accurate. Called out patterns in my career I hadn't admitted yet.", name: "Alex M." },
  { stars: 5, text: "I came in skeptical. Left rethinking the last decade.", name: "Jordan T." },
  { stars: 5, text: "The most useful 90 seconds of self-reflection I've had all year.", name: "Priya K." },
];

function Stars({ count }: { count: number }) {
  return (
    <span style={{ color: C.amber, fontSize: 11, letterSpacing: 1 }}>
      {"★".repeat(count)}
    </span>
  );
}

export function LessMystic() {
  return (
    <div style={{
      width: "100%", height: "100vh", background: C.bg,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center",
      overflowY: "auto",
    }}>
      {/* Top nav bar */}
      <div style={{
        width: "100%", padding: "16px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: `1px solid ${C.dimBorder}`,
        boxSizing: "border-box",
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.cream, letterSpacing: 1 }}>THE ORACLE</span>
        <span style={{ fontSize: 12, color: C.muted }}>Sign in</span>
      </div>

      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        padding: "36px 24px 32px", gap: 0, width: "100%", boxSizing: "border-box",
      }}>
        {/* Icon */}
        <div style={{ marginBottom: 20 }}>
          <EyeIcon />
        </div>

        {/* Headline */}
        <h1 style={{
          margin: "0 0 10px", textAlign: "center",
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 28, fontWeight: 700,
          color: C.cream, lineHeight: 1.2,
        }}>
          Your personal<br />reading, decoded.
        </h1>
        <p style={{
          margin: "0 0 28px", textAlign: "center",
          fontSize: 15, color: C.muted, lineHeight: 1.65, maxWidth: 290,
        }}>
          Upload palm, iris, and face photos. Get a detailed reading across 15 analytical systems in under 2 minutes.
        </p>

        {/* CTA */}
        <div style={{
          width: "100%", maxWidth: 320, background: C.amber, borderRadius: 12,
          padding: "16px", textAlign: "center", cursor: "pointer", marginBottom: 12,
          boxShadow: "0 4px 20px rgba(196,135,74,0.3)",
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: 0.3 }}>
            Start my reading →
          </span>
        </div>
        <p style={{ margin: "0 0 28px", fontSize: 11, color: C.muted }}>
          Free · No account required · 90 seconds
        </p>

        {/* Rating bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: C.card, borderRadius: 10,
          padding: "12px 16px", width: "100%", maxWidth: 320,
          boxSizing: "border-box", marginBottom: 20,
          border: `1px solid ${C.dimBorder}`,
        }}>
          <Stars count={5} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.cream }}>4.9</span>
          <span style={{ fontSize: 12, color: C.muted }}>· 10,000+ readings</span>
        </div>

        {/* Review cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
          {REVIEWS.map((r, i) => (
            <div key={i} style={{
              background: C.card, borderRadius: 10,
              border: `1px solid ${C.dimBorder}`,
              padding: "14px 16px",
            }}>
              <div style={{ marginBottom: 6 }}><Stars count={r.stars} /></div>
              <p style={{ margin: "0 0 8px", fontSize: 13.5, color: C.cream, lineHeight: 1.55, opacity: 0.9 }}>
                "{r.text}"
              </p>
              <span style={{ fontSize: 11, color: C.muted }}>— {r.name}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: "flex", gap: 20 }}>
          {["The Vault", "Synastry"].map((l, i) => (
            <span key={i} style={{ fontSize: 13, color: C.amber, cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(196,135,74,0.3)" }}>{l}</span>
          ))}
        </div>
        <p style={{ marginTop: 16, fontSize: 11, color: C.muted, textAlign: "center" }}>
          Your images are processed and immediately deleted.
        </p>
      </div>
    </div>
  );
}
