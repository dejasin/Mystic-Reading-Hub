import { C, FONT_HEADING, FONT_BODY, StarField, GoldSigil, IPhoneFrame, PageWrap, Divider } from "./_shared";

export default function S01_Welcome() {
  return (
    <PageWrap>
      <IPhoneFrame label="1 · Welcome">
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 70% 50% at 50% 30%, rgba(201,168,76,0.13) 0%, transparent 70%), ${C.bg}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            padding: "80px 32px 40px",
          }}
        >
          <StarField />
          <div style={{ filter: "drop-shadow(0 0 28px rgba(201,168,76,0.55))", marginBottom: 8 }}>
            <GoldSigil size={160} />
          </div>
          <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 33, color: C.gold, letterSpacing: 8, textAlign: "center", marginTop: 10 }}>
            THE ORACLE
          </div>
          <div style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 16, color: C.muted, letterSpacing: 1.5, textAlign: "center", marginTop: 16, lineHeight: 1.7 }}>
            Ancient wisdom. Modern sight.
          </div>
          <div style={{ marginTop: 20 }}>
            <Divider />
          </div>
          <div
            style={{
              marginTop: 44,
              padding: "16px 44px",
              border: `1.5px solid ${C.gold}`,
              borderRadius: 40,
              background: "rgba(201,168,76,0.09)",
              boxShadow: "0 0 24px rgba(201,168,76,0.32)",
              fontFamily: FONT_HEADING,
              fontWeight: 700,
              fontSize: 14,
              color: C.gold,
              letterSpacing: 3,
              textAlign: "center",
            }}
          >
            BEGIN THE RITUAL
          </div>
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            {["Real vision analysis — not just archetypes", "15+ ancient systems synthesized into one reading"].map((t, i) => (
              <div key={i} style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 12, color: C.muted, opacity: 0.55, textAlign: "center", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.gold, fontSize: 9 }}>✦</span>{t}
              </div>
            ))}
          </div>
        </div>
      </IPhoneFrame>
    </PageWrap>
  );
}
