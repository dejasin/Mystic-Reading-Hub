import { C, FONT_HEADING, FONT_BODY, StarField, IPhoneFrame, PageWrap } from "./_shared";

const entries = [
  { type: "Full Reading", title: "Oracle Reading", date: "April 1, 2026", preview: "The deep crease along your heart line tells a story of intense feeling — you love with ferocity, but have learned…" },
  { type: "Deep Dive", title: "Career — Sophia", date: "March 28, 2026", preview: "Your dominant hand shows an unusually strong fate line, bending toward the mount of Saturn…" },
  { type: "Deep Dive", title: "Relationship — Sophia", date: "March 25, 2026", preview: "The heart line on your palm curves upward, reaching for the space between your index and middle finger…" },
];

export default function S09_Journal() {
  return (
    <PageWrap>
      <IPhoneFrame label="9 · Reading Vault">
        <div style={{ position: "absolute", inset: 0, background: C.bg, display: "flex", flexDirection: "column" }}>
          <StarField />
          <div style={{ paddingTop: 44, paddingLeft: 16, paddingRight: 16, paddingBottom: 12, borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
            <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 17, color: C.gold, letterSpacing: 3, textAlign: "center" }}>Reading Vault</div>
            <div style={{ marginTop: 12, padding: "10px 14px", background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: 10, fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 14, color: C.muted }}>
              🔍 Search your readings…
            </div>
          </div>
          <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
            {entries.map((entry, i) => (
              <div key={i} style={{ background: C.surface, border: "1px solid rgba(201,168,76,0.1)", borderRadius: 14, padding: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 11, color: C.gold, background: "rgba(201,168,76,0.12)", padding: "3px 10px", borderRadius: 20, letterSpacing: 1 }}>
                    {entry.type}
                  </span>
                  <span style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 12, color: C.muted }}>{entry.date}</span>
                </div>
                <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 14, color: C.cream, marginBottom: 6 }}>{entry.title}</div>
                <div style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 13, color: C.muted, lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                  {entry.preview}
                </div>
              </div>
            ))}
          </div>
        </div>
      </IPhoneFrame>
    </PageWrap>
  );
}
