const C = {
  bg: "#080c18",
  navy: "#0d1526",
  blue: "#3b82f6",
  blueLight: "#60a5fa",
  gold: "#c9a84c",
  cream: "#e8edf5",
  muted: "#64748b",
  border: "rgba(59,130,246,0.15)",
  borderSubtle: "rgba(255,255,255,0.06)",
};

function DiamondLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <polygon points="24,2 46,24 24,46 2,24"
        fill="none" stroke={C.blue} strokeWidth="1.5" opacity="0.6" />
      <polygon points="24,10 38,24 24,38 10,24"
        fill="none" stroke={C.blue} strokeWidth="1" opacity="0.4" />
      <polygon points="24,18 30,24 24,30 18,24"
        fill={C.blue} opacity="0.3" stroke={C.blue} strokeWidth="1" />
      <circle cx="24" cy="24" r="2.5" fill={C.blueLight} opacity="0.9" />
    </svg>
  );
}

const METRICS = [
  { value: "15+", label: "Analytical frameworks" },
  { value: "97%", label: "Pattern accuracy rate" },
  { value: "2 min", label: "Time to full report" },
];

const FEATURES = [
  { icon: "◈", title: "Biometric Vision Analysis", sub: "AI reads palm lines, iris patterns, and facial geometry" },
  { icon: "◉", title: "Multi-System Synthesis", sub: "Astrology, numerology, and physiognomy unified" },
  { icon: "◇", title: "Personalized Report", sub: "Specific to your biology, not generic archetypes" },
];

export function CorporateFriendly() {
  return (
    <div style={{
      width: "100%", height: "100vh", background: C.bg,
      fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
      display: "flex", flexDirection: "column",
      overflowY: "auto",
    }}>
      {/* Nav */}
      <div style={{
        padding: "14px 24px", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        borderBottom: `1px solid ${C.borderSubtle}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <DiamondLogo />
          <span style={{ fontSize: 14, fontWeight: 700, color: C.cream, letterSpacing: 0.5 }}>Oracle</span>
        </div>
        <div style={{
          fontSize: 12, fontWeight: 500, color: C.blue,
          border: `1px solid ${C.border}`,
          borderRadius: 6, padding: "6px 14px", cursor: "pointer",
        }}>Sign in</div>
      </div>

      <div style={{ padding: "32px 24px", flex: 1 }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(59,130,246,0.08)", border: `1px solid ${C.border}`,
          borderRadius: 20, padding: "4px 12px", marginBottom: 20,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue, display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: C.blueLight, letterSpacing: 0.5 }}>
            AI-Powered Self-Assessment
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          margin: "0 0 12px", fontSize: 26, fontWeight: 700,
          color: C.cream, lineHeight: 1.25, letterSpacing: -0.3,
        }}>
          Advanced pattern recognition.<br />
          <span style={{ color: C.blue }}>Applied to you.</span>
        </h1>
        <p style={{
          margin: "0 0 28px", fontSize: 14, color: C.muted, lineHeight: 1.65,
        }}>
          Oracle analyzes biometric data from three image sources against 15 validated analytical frameworks to produce a comprehensive self-assessment report.
        </p>

        {/* Metrics row */}
        <div style={{
          display: "flex", gap: 10, marginBottom: 28,
        }}>
          {METRICS.map((m, i) => (
            <div key={i} style={{
              flex: 1, background: C.navy, borderRadius: 10,
              border: `1px solid ${C.borderSubtle}`,
              padding: "12px 10px", textAlign: "center",
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.blueLight, marginBottom: 3 }}>{m.value}</div>
              <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.3 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: C.navy, borderRadius: 10,
              border: `1px solid ${C.borderSubtle}`,
              padding: "14px 16px",
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 14, color: C.blue, marginTop: 1, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.cream, marginBottom: 2 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          background: C.blue, borderRadius: 10,
          padding: "15px", textAlign: "center", cursor: "pointer", marginBottom: 10,
          boxShadow: "0 4px 20px rgba(59,130,246,0.25)",
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Begin assessment →</span>
        </div>
        <div style={{
          borderRadius: 10, border: `1px solid ${C.border}`,
          padding: "12px", textAlign: "center", cursor: "pointer", marginBottom: 20,
        }}>
          <span style={{ fontSize: 13, color: C.blueLight }}>View sample report</span>
        </div>

        <p style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>
          Images processed securely · Immediately deleted · No account required
        </p>
      </div>
    </div>
  );
}
