import { C, FONT_HEADING, FONT_BODY, StarField, IPhoneFrame, PageWrap } from "./_shared";

export default function S10_Chat() {
  return (
    <PageWrap>
      <IPhoneFrame label="10 · Chat with Oracle">
        <div style={{ position: "absolute", inset: 0, background: C.bg, display: "flex", flexDirection: "column" }}>
          <StarField />
          <div style={{ padding: "44px 16px 12px", borderBottom: "1px solid rgba(201,168,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.gold }}>✦</span>
            <span style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 13, color: C.gold, letterSpacing: 3 }}>THE ORACLE</span>
          </div>
          <div style={{ flex: 1, padding: "14px 16px 8px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
              {["When will I find love?", "What is blocking my success?", "What career path suits me?"].map((q, i) => (
                <div key={i} style={{ border: "1px solid rgba(201,168,76,0.2)", borderRadius: 16, padding: "7px 13px", background: "rgba(201,168,76,0.04)", fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 12, color: C.cream, opacity: 0.72 }}>
                  {q}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, maxWidth: "85%" }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: "rgba(201,168,76,0.15)", border: `1px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: C.gold }}>
                ✦
              </div>
              <div style={{ background: "#0f0f24", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 16, borderBottomLeftRadius: 4, padding: "11px 15px", fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 15, color: C.cream, lineHeight: 1.75, opacity: 0.95 }}>
                The stars do not measure love in time — they measure it in readiness. Your palm shows the heart line deepening near the mount of Luna, which speaks of emotional evolution happening now.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, maxWidth: "85%", alignSelf: "flex-end" }}>
              <div style={{ background: "rgba(201,168,76,0.18)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 16, borderBottomRightRadius: 4, padding: "11px 15px", fontFamily: FONT_BODY, fontSize: 15, color: C.cream, lineHeight: 1.6 }}>
                What does that mean for me specifically?
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, maxWidth: "75%" }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: "rgba(201,168,76,0.15)", border: `1px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: C.gold }}>
                ✦
              </div>
              <div style={{ background: "#0f0f24", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 16, borderBottomLeftRadius: 4, padding: "11px 15px", fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 15, color: C.gold, letterSpacing: 3, opacity: 0.8 }}>
                • • •
              </div>
            </div>
          </div>
          <div style={{ padding: "10px 16px 40px", borderTop: "1px solid rgba(201,168,76,0.08)", display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: 20, padding: "12px 16px", fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 15, color: C.muted }}>
              Ask The Oracle…
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
              ➤
            </div>
          </div>
        </div>
      </IPhoneFrame>
    </PageWrap>
  );
}
