import { C, FONT_HEADING, FONT_BODY, StarField, IPhoneFrame, PageWrap, Divider } from "./_shared";

const cats = [
  { icon: "💼", label: "Career", color: "#c9a84c", desc: "Your path, purpose & professional destiny" },
  { icon: "💕", label: "Relationship", color: "#b87b7b", desc: "The patterns, bonds & love that shape you" },
  { icon: "📈", label: "Finances", color: "#7bc4a0", desc: "Wealth, flow & your relationship with money" },
  { icon: "⚡", label: "Fitness", color: "#8b9fd4", desc: "Vitality, body wisdom & physical potential" },
  { icon: "🌿", label: "Family", color: "#c9a04c", desc: "Roots, bonds & the legacy you carry" },
];

export default function S07_DeepDive() {
  return (
    <PageWrap>
      <IPhoneFrame label="7 · Deep Dive">
        <div style={{ position: "absolute", inset: 0, background: C.bg, display: "flex", flexDirection: "column" }}>
          <StarField />
          <div style={{ paddingTop: 44, paddingLeft: 20, paddingRight: 20, paddingBottom: 12, borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
            <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 17, color: C.gold, letterSpacing: 3, textAlign: "center" }}>
              Explore Further
            </div>
          </div>
          <div style={{ flex: 1, padding: "20px 20px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 22, color: C.cream, marginBottom: 6 }}>Deep Dive</div>
            <div style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 14, color: C.muted, marginBottom: 14 }}>
              Select a life area for a targeted reading woven from your Oracle profile.
            </div>
            <div style={{ marginBottom: 18 }}><Divider /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {cats.map((cat, i) => (
                <div key={i} style={{ background: C.surface, border: "1px solid rgba(201,168,76,0.1)", borderRadius: 14, padding: "13px 16px", display: "flex", alignItems: "center", gap: 13 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 21, background: `${cat.color}1a`, border: `1px solid ${cat.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 14, color: C.cream }}>{cat.label}</div>
                    <div style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>{cat.desc}</div>
                  </div>
                  <span style={{ color: C.gold, fontSize: 18, opacity: 0.45 }}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </IPhoneFrame>
    </PageWrap>
  );
}
