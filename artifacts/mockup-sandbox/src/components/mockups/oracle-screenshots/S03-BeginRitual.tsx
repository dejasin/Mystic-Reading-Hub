import { C, FONT_HEADING, FONT_BODY, StarField, GoldSigil, IPhoneFrame, PageWrap, Divider } from "./_shared";

export default function S03_BeginRitual() {
  return (
    <PageWrap>
      <IPhoneFrame label="3 · Begin the Ritual">
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(201,168,76,0.1) 0%, transparent 70%), ${C.bg}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 32px 48px",
          }}
        >
          <StarField />
          <GoldSigil size={80} />
          <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 26, color: C.gold, letterSpacing: 5, textAlign: "center", marginTop: 18 }}>
            YOUR TRUTH AWAITS
          </div>
          <div style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 16, color: C.cream, textAlign: "center", marginTop: 14, lineHeight: 1.75, opacity: 0.85, maxWidth: 290 }}>
            Step beyond the veil.{"\n"}Discover what has always been written.
          </div>
          <div style={{ marginTop: 40, width: "100%" }}>
            <div
              style={{
                padding: "18px",
                border: `1.5px solid ${C.gold}`,
                borderRadius: 40,
                background: "rgba(201,168,76,0.1)",
                boxShadow: "0 0 32px rgba(201,168,76,0.38), 0 0 64px rgba(201,168,76,0.14)",
                fontFamily: FONT_HEADING,
                fontWeight: 700,
                fontSize: 15,
                color: C.gold,
                letterSpacing: 4,
                textAlign: "center",
              }}
            >
              BEGIN THE RITUAL
            </div>
          </div>
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 8 }}>
            {["Real vision analysis — not just archetypes", "15+ ancient systems synthesized", "Deep insights across love, career & purpose"].map((line, i) => (
              <div key={i} style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 13, color: C.muted, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ color: C.gold, fontSize: 9 }}>✦</span>{line}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, display: "flex", gap: 8 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ width: i === 3 ? 22 : 8, height: 8, borderRadius: 4, background: i === 3 ? C.gold : "rgba(201,168,76,0.25)" }} />
            ))}
          </div>
        </div>
      </IPhoneFrame>
    </PageWrap>
  );
}
