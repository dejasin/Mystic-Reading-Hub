import { C, FONT_HEADING, FONT_BODY, StarField, IPhoneFrame, PageWrap } from "./_shared";

const items = [
  { icon: "✋", title: "Dominant Palm", subtitle: "Your life path & strengths", note: "Required", nc: "#c9a84c" },
  { icon: "🤚", title: "Non-Dominant Palm", subtitle: "Inherited patterns & potential", note: "Optional", nc: "#6b6b8a" },
  { icon: "👁", title: "Right Iris", subtitle: "Iridology health & constitution", note: "Optional", nc: "#6b6b8a" },
  { icon: "👁", title: "Left Iris", subtitle: "Receptive energies & balance", note: "Optional", nc: "#6b6b8a" },
  { icon: "🌙", title: "Face Reading", subtitle: "Mianxiang · front + both profiles", note: "3 photos", nc: "#6b6b8a" },
];

export default function S04_PhotoRitual() {
  return (
    <PageWrap>
      <IPhoneFrame label="4 · The Sacred Ritual">
        <div style={{ position: "absolute", inset: 0, background: C.bg, display: "flex", flexDirection: "column" }}>
          <StarField />
          <div style={{ paddingTop: 44, paddingLeft: 20, paddingRight: 20, paddingBottom: 12, borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
            <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 16, color: C.gold, letterSpacing: 3, textAlign: "center" }}>
              THE SACRED IMAGING RITUAL
            </div>
            <div style={{ fontFamily: FONT_HEADING, fontSize: 11, color: C.gold, letterSpacing: 5, opacity: 0.35, textAlign: "center", marginTop: 8 }}>
              ─── ✦ ───
            </div>
          </div>
          <div style={{ flex: 1, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((item, i) => (
              <div key={i} style={{ background: C.surface, border: "1px solid rgba(201,168,76,0.1)", borderRadius: 14, padding: "13px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 21, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 14, color: C.cream }}>{item.title}</div>
                  <div style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 12, color: C.muted, marginTop: 2 }}>{item.subtitle}</div>
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: item.nc, opacity: 0.85 }}>{item.note}</div>
              </div>
            ))}
            <div
              style={{
                marginTop: 6,
                padding: "15px",
                border: `1px solid ${C.gold}`,
                borderRadius: 40,
                background: "rgba(201,168,76,0.08)",
                fontFamily: FONT_HEADING,
                fontWeight: 700,
                fontSize: 13,
                color: C.gold,
                letterSpacing: 2,
                textAlign: "center",
              }}
            >
              BEGIN RITUAL →
            </div>
          </div>
        </div>
      </IPhoneFrame>
    </PageWrap>
  );
}
