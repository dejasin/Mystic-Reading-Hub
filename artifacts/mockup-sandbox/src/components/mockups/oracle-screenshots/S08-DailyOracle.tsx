import { C, FONT_HEADING, FONT_BODY, StarField, IPhoneFrame, PageWrap, Divider } from "./_shared";

export default function S08_DailyOracle() {
  return (
    <PageWrap>
      <IPhoneFrame label="8 · Daily Oracle">
        <div style={{ position: "absolute", inset: 0, background: C.bg, display: "flex", flexDirection: "column" }}>
          <StarField />
          <div style={{ paddingTop: 44, paddingLeft: 20, paddingRight: 20, paddingBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ width: 24 }} />
            <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 16, color: C.gold, letterSpacing: 3 }}>THE ORACLE</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 18, color: C.muted }}>⚙</div>
          </div>
          <div style={{ flex: 1, padding: "8px 20px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.surface, border: "1px solid rgba(201,168,76,0.28)", borderRadius: 16, padding: "18px", boxShadow: "0 0 24px rgba(201,168,76,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 14, color: C.gold, letterSpacing: 1 }}>✦ Daily Oracle</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.gold, opacity: 0.6, display: "flex", alignItems: "center", gap: 4 }}>
                  🕐 <span>History</span>
                </div>
              </div>
              <div style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 12, color: C.muted, marginBottom: 2 }}>Tuesday, April 1, 2026</div>
              <div style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 12, color: C.muted, marginBottom: 14 }}>For Sophia</div>
              <div style={{ marginBottom: 14 }}><Divider /></div>
              <div style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 16, color: C.cream, lineHeight: 1.85, opacity: 0.9 }}>
                Today the stars ask you to trust the knowing that lives beneath thought. A door that seemed closed is quietly opening — not in the world, but within you.
              </div>
            </div>
            <div style={{ background: C.surface, border: "1px solid rgba(201,168,76,0.1)", borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 14, color: C.gold, letterSpacing: 1 }}>✦ This Week</div>
              <span style={{ color: C.gold, fontSize: 18, opacity: 0.5 }}>⌄</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[{ label: "NEW READING", active: true }, { label: "DEEP DIVE", active: false }].map((btn, i) => (
                <div key={i} style={{ flex: 1, padding: "13px", background: btn.active ? "rgba(201,168,76,0.1)" : C.surface, border: `1px solid ${btn.active ? "rgba(201,168,76,0.3)" : "rgba(201,168,76,0.1)"}`, borderRadius: 12, fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 11, color: C.gold, letterSpacing: 2, textAlign: "center" }}>
                  {btn.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </IPhoneFrame>
    </PageWrap>
  );
}
