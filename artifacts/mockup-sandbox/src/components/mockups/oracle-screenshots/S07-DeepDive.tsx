import { C, FONT_HEADING, FONT_BODY, StarField, IPhoneFrame, PageWrap, Divider } from "./_shared";

const cats = [
  { icon: "♥", label: "Love & Relationships", desc: "Bonds, patterns & the love that shapes you", color: "#c9a84c" },
  { icon: "✦", label: "Career & Purpose", desc: "Your path, vocation & destiny's calling", color: "#c9a84c" },
  { icon: "◈", label: "Health & Vitality", desc: "Body wisdom, energy & physical potential", color: "#c9a84c" },
  { icon: "☽", label: "Shadow & Growth", desc: "Hidden depths, wounds & transformation", color: "#c9a84c" },
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
            <div style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 13, color: C.muted, marginBottom: 14 }}>
              Select a life area for a targeted reading woven from your Oracle profile.
            </div>
            <div style={{ marginBottom: 16 }}><Divider /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
              {cats.map((cat, i) => (
                <div key={i} style={{
                  background: C.surface,
                  border: "1px solid rgba(201,168,76,0.18)",
                  borderRadius: 16,
                  padding: "18px 14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 8,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 22,
                    background: "rgba(201,168,76,0.12)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, color: C.gold, flexShrink: 0,
                  }}>
                    {cat.icon}
                  </div>
                  <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 12, color: C.cream, lineHeight: 1.3 }}>{cat.label}</div>
                  <div style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 10, color: C.muted, lineHeight: 1.4 }}>{cat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </IPhoneFrame>
    </PageWrap>
  );
}
