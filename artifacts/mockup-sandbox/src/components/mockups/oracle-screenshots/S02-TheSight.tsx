import { C, FONT_HEADING, FONT_BODY, StarField, GoldSigil, IPhoneFrame, PageWrap, Divider } from "./_shared";

export default function S02_TheSight() {
  const lines = [
    { icon: "✋", text: "Each line a story written before birth" },
    { icon: "👁", text: "Each pattern a gateway to hidden truth" },
    { icon: "🌙", text: "Each feature a map of destiny" },
  ];
  return (
    <PageWrap>
      <IPhoneFrame label="2 · The Sight">
        <div style={{ position: "absolute", inset: 0, background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 28px 48px" }}>
          <StarField />
          <GoldSigil size={80} />
          <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 28, color: C.gold, letterSpacing: 6, textAlign: "center", marginTop: 18 }}>
            THE SIGHT
          </div>
          <div style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 17, color: C.cream, textAlign: "center", marginTop: 14, opacity: 0.88 }}>
            Your palm. Your iris. Your face.
          </div>
          <div style={{ marginTop: 28, width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
            {lines.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 12, padding: "14px 18px" }}>
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <span style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 15, color: C.cream, opacity: 0.85, lineHeight: 1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32 }}>
            <Divider />
          </div>
          <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ width: i === 1 ? 22 : 8, height: 8, borderRadius: 4, background: i === 1 ? C.gold : "rgba(201,168,76,0.25)" }} />
            ))}
          </div>
        </div>
      </IPhoneFrame>
    </PageWrap>
  );
}
