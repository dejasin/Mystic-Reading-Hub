import { C, FONT_HEADING, FONT_BODY, StarField, IPhoneFrame, PageWrap } from "./_shared";

export default function S06_ReadingResult() {
  return (
    <PageWrap>
      <IPhoneFrame label="6 · Reading Result">
        <div style={{ position: "absolute", inset: 0, background: C.bg, display: "flex", flexDirection: "column" }}>
          <StarField />
          <div style={{ padding: "44px 16px 12px", borderBottom: "1px solid rgba(201,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.gold }}>✦</span>
            <span style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 13, color: C.gold, letterSpacing: 3 }}>YOUR ORACLE READING</span>
          </div>
          <div style={{ flex: 1, overflowY: "hidden", padding: "20px 20px" }}>
            {[
              {
                heading: "✦ THE LIFE PATH",
                body: "The deep crease along your heart line tells a story of intense feeling — you love with ferocity, but have learned to protect what burns brightest within you. This is not a wound; it is armor hard-won by a soul that chose depth over comfort.",
              },
              {
                heading: "✦ IRIDOLOGY HEALTH",
                body: "Your iris reveals a constitutionally strong nervous system, though the radial striations in the upper zone suggest a tendency toward adrenal fatigue when under prolonged stress. Rest is not weakness — it is medicine for your constitution.",
              },
            ].map((sec, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 12, color: C.gold, letterSpacing: 2, textAlign: "center", marginBottom: 6 }}>{sec.heading}</div>
                <div style={{ fontFamily: FONT_HEADING, fontSize: 10, color: C.gold, letterSpacing: 4, opacity: 0.35, textAlign: "center", marginBottom: 12 }}>─── ✦ ───</div>
                <div style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 15, color: C.cream, lineHeight: 1.85, opacity: 0.92 }}>{sec.body}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 16px 40px", borderTop: "1px solid rgba(201,168,76,0.1)", display: "flex", gap: 10 }}>
            {[
              { label: "✦ DEEP DIVE", active: true },
              { label: "◎ CHAT", active: false },
              { label: "SHARE", active: false },
            ].map((btn, i) => (
              <div key={i} style={{ flex: 1, padding: "12px", background: btn.active ? "rgba(201,168,76,0.12)" : C.surface, border: `1px solid ${btn.active ? "rgba(201,168,76,0.3)" : "rgba(201,168,76,0.1)"}`, borderRadius: 12, fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 11, color: C.gold, letterSpacing: 1, textAlign: "center" }}>
                {btn.label}
              </div>
            ))}
          </div>
        </div>
      </IPhoneFrame>
    </PageWrap>
  );
}
