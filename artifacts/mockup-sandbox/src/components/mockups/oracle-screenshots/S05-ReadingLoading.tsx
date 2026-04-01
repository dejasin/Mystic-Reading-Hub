import { C, FONT_HEADING, FONT_BODY, StarField, GoldSigil, IPhoneFrame, PageWrap, Divider } from "./_shared";

export default function S05_ReadingLoading() {
  return (
    <PageWrap>
      <IPhoneFrame label="5 · Reading Loading">
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,168,76,0.09) 0%, transparent 70%), ${C.bg}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            padding: "80px 40px 60px",
          }}
        >
          <StarField />
          <div style={{ filter: "drop-shadow(0 0 32px rgba(201,168,76,0.55))" }}>
            <GoldSigil size={140} />
          </div>
          <div style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 18, color: C.gold, textAlign: "center", lineHeight: 1.7, maxWidth: 280 }}>
            Synthesizing the ancient patterns…
          </div>
          <Divider />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", alignItems: "center" }}>
            {[
              { msg: "Mapping your palm lines...", active: false },
              { msg: "Reading the iris zones...", active: false },
              { msg: "Cross-referencing your numerological signature...", active: true },
              { msg: "Your Oracle is preparing to speak...", active: false },
            ].map((item, i) => (
              <div key={i} style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: item.active ? 14 : 13, color: item.active ? C.gold : C.muted, opacity: item.active ? 0.9 : 0.4, textAlign: "center" }}>
                {item.msg}
              </div>
            ))}
          </div>
        </div>
      </IPhoneFrame>
    </PageWrap>
  );
}
