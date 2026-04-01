export const C = {
  bg: "#04040f",
  surface: "#0b0b1e",
  gold: "#c9a84c",
  goldLight: "#e8cc7a",
  cream: "#f0e6cc",
  muted: "#6b6b8a",
  inputBg: "#0f0f24",
  inputBorder: "#2a2a4a",
};

export const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
export const FONT_BODY = "'EB Garamond', Georgia, serif";

export function GoogleFonts() {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap"
    />
  );
}

export function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: (i * 37 + i * i * 7) % 390,
    y: (i * 53 + i * i * 3) % 844,
    r: i % 5 === 0 ? 1.5 : 0.75,
    op: 0.15 + (i % 7) * 0.07,
  }));
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 390 844"
    >
      {stars.map(s => (
        <circle key={s.id} cx={s.x} cy={s.y} r={s.r} fill={C.gold} opacity={s.op} />
      ))}
    </svg>
  );
}

export function GoldSigil({ size = 80 }: { size?: number }) {
  const s = size;
  const cx = s / 2;
  const r = s * 0.42;
  const inner = s * 0.26;
  const pts6 = (radius: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return [cx + radius * Math.cos(a), cx + radius * Math.sin(a)] as [number, number];
    });
  const outer = pts6(r);
  const innerPts = pts6(inner);
  const outerRev = pts6(r).reverse();

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={C.gold} strokeWidth={0.8} opacity={0.3} />
      <circle cx={cx} cy={cx} r={inner} fill="none" stroke={C.gold} strokeWidth={0.5} opacity={0.2} />
      <polygon points={outer.map(p => p.join(",")).join(" ")} fill="none" stroke={C.gold} strokeWidth={0.8} opacity={0.5} />
      <polygon points={outerRev.map(p => p.join(",")).join(" ")} fill="none" stroke={C.goldLight} strokeWidth={0.7} opacity={0.35} />
      <circle cx={cx} cy={cx} r={s * 0.06} fill={C.gold} opacity={0.7} />
    </svg>
  );
}

export function IPhoneFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 390,
          height: 844,
          borderRadius: 44,
          border: "2px solid #2a2a2a",
          boxShadow: "0 0 60px rgba(0,0,0,0.9), inset 0 0 0 1px #1a1a1a",
          overflow: "hidden",
          position: "relative",
          background: C.bg,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 116,
            height: 28,
            background: "#0a0a0a",
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            zIndex: 100,
          }}
        />
        {children}
      </div>
      <div
        style={{
          fontFamily: FONT_HEADING,
          fontSize: 13,
          color: C.muted,
          letterSpacing: 1.5,
          textAlign: "center",
          opacity: 0.8,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#03030c",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <GoogleFonts />
      {children}
    </div>
  );
}

export const Divider = () => (
  <div
    style={{
      fontFamily: FONT_HEADING,
      fontSize: 11,
      color: C.gold,
      letterSpacing: 5,
      opacity: 0.35,
      textAlign: "center",
    }}
  >
    ─── ✦ ───
  </div>
);
