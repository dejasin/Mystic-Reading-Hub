import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import Svg, { Circle, Path, Line } from "react-native-svg";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

type AspectRatio = "story" | "feed";

interface ArchetypeCardData {
  type: "archetype";
  userName: string;
  archetypeName: string;
  traits: string[];
}

interface SynastryCardData {
  type: "synastry";
  name1: string;
  name2: string;
  highlights: string[];
}

interface DeepDiveCardData {
  type: "deepdive";
  userName: string;
  category: string;
  insights: string[];
}

type ShareCardData = ArchetypeCardData | SynastryCardData | DeepDiveCardData;

interface ShareCardModalProps {
  visible: boolean;
  onClose: () => void;
  data: ShareCardData;
}

function StaticSigil({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const r2 = size * 0.32;
  const r3 = size * 0.15;

  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });
  const tri1 = `M ${pts[0][0]} ${pts[0][1]} L ${pts[2][0]} ${pts[2][1]} L ${pts[4][0]} ${pts[4][1]} Z`;
  const tri2 = `M ${pts[1][0]} ${pts[1][1]} L ${pts[3][0]} ${pts[3][1]} L ${pts[5][0]} ${pts[5][1]} Z`;

  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={Colors.gold} strokeWidth={1} opacity={0.8} />
      <Circle cx={cx} cy={cy} r={r2} fill="none" stroke={Colors.gold} strokeWidth={0.5} opacity={0.5} />
      <Path d={tri1} fill="none" stroke={Colors.gold} strokeWidth={1.2} opacity={0.9} />
      <Path d={tri2} fill="none" stroke={Colors.gold} strokeWidth={1.2} opacity={0.9} />
      <Circle cx={cx} cy={cy} r={r3} fill={Colors.gold} opacity={0.6} />
      <Circle cx={cx} cy={cy} r={4} fill={Colors.goldLight} opacity={0.9} />
      {pts.map(([px, py], i) => (
        <Line key={i} x1={cx} y1={cy} x2={px} y2={py} stroke={Colors.gold} strokeWidth={0.4} opacity={0.3} />
      ))}
    </Svg>
  );
}

function ArchetypeCard({ data, ratio }: { data: ArchetypeCardData; ratio: AspectRatio }) {
  const isStory = ratio === "story";
  return (
    <View style={[cardStyles.base, isStory ? cardStyles.story : cardStyles.feed]}>
      <View style={cardStyles.glowTop} />
      <View style={cardStyles.glowBottom} />

      <View style={cardStyles.topBrand}>
        <Text style={cardStyles.brandSmall}>THE ORACLE</Text>
      </View>

      <View style={[cardStyles.centerContent, isStory && { flex: 1 }]}>
        <StaticSigil size={isStory ? 100 : 80} />
        <Text style={cardStyles.labelSmall}>YOUR ARCHETYPE</Text>
        <Text style={[cardStyles.archetypeName, !isStory && { fontSize: 22 }]}>{data.archetypeName}</Text>
        <View style={cardStyles.dividerRow}>
          <View style={cardStyles.dividerLine} />
          <Text style={cardStyles.dividerStar}>✦</Text>
          <View style={cardStyles.dividerLine} />
        </View>
        <Text style={cardStyles.forName}>{data.userName}</Text>

        {data.traits.length > 0 && (
          <View style={cardStyles.traitsContainer}>
            {data.traits.slice(0, 3).map((trait, i) => (
              <View key={i} style={cardStyles.traitRow}>
                <Text style={cardStyles.traitBullet}>✦</Text>
                <Text style={cardStyles.traitText}>{trait}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={cardStyles.footer}>
        <View style={cardStyles.footerDividerRow}>
          <View style={cardStyles.footerDividerLine} />
          <Text style={cardStyles.footerDividerStar}>✦</Text>
          <View style={cardStyles.footerDividerLine} />
        </View>
        <Text style={cardStyles.cta}>Discover yours at theoracle.app</Text>
      </View>
    </View>
  );
}

function SynastryCard({ data, ratio }: { data: SynastryCardData; ratio: AspectRatio }) {
  const isStory = ratio === "story";
  return (
    <View style={[cardStyles.base, isStory ? cardStyles.story : cardStyles.feed]}>
      <View style={cardStyles.glowTop} />
      <View style={cardStyles.glowBottom} />

      <View style={cardStyles.topBrand}>
        <Text style={cardStyles.brandSmall}>THE ORACLE</Text>
      </View>

      <View style={[cardStyles.centerContent, isStory && { flex: 1 }]}>
        <Text style={cardStyles.labelSmall}>SYNASTRY READING</Text>

        <View style={cardStyles.synastryNames}>
          <Text style={cardStyles.synastryName}>{data.name1}</Text>
          <View style={cardStyles.synastryConnector}>
            <StaticSigil size={50} />
          </View>
          <Text style={cardStyles.synastryName}>{data.name2}</Text>
        </View>

        <View style={cardStyles.dividerRow}>
          <View style={cardStyles.dividerLine} />
          <Text style={cardStyles.dividerStar}>✦</Text>
          <View style={cardStyles.dividerLine} />
        </View>

        {data.highlights.length > 0 && (
          <View style={cardStyles.traitsContainer}>
            {data.highlights.slice(0, 3).map((h, i) => (
              <View key={i} style={cardStyles.traitRow}>
                <Text style={cardStyles.traitBullet}>✦</Text>
                <Text style={cardStyles.traitText}>{h}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={cardStyles.footer}>
        <View style={cardStyles.footerDividerRow}>
          <View style={cardStyles.footerDividerLine} />
          <Text style={cardStyles.footerDividerStar}>✦</Text>
          <View style={cardStyles.footerDividerLine} />
        </View>
        <Text style={cardStyles.cta}>Discover yours at theoracle.app</Text>
      </View>
    </View>
  );
}

function DeepDiveCard({ data, ratio }: { data: DeepDiveCardData; ratio: AspectRatio }) {
  const isStory = ratio === "story";
  const categoryLabel = data.category.charAt(0).toUpperCase() + data.category.slice(1);
  return (
    <View style={[cardStyles.base, isStory ? cardStyles.story : cardStyles.feed]}>
      <View style={cardStyles.glowTop} />
      <View style={cardStyles.glowBottom} />

      <View style={cardStyles.topBrand}>
        <Text style={cardStyles.brandSmall}>THE ORACLE</Text>
      </View>

      <View style={[cardStyles.centerContent, isStory && { flex: 1 }]}>
        <StaticSigil size={isStory ? 80 : 64} />
        <Text style={cardStyles.labelSmall}>{categoryLabel.toUpperCase()} DEEP DIVE</Text>
        <Text style={[cardStyles.archetypeName, { fontSize: 20 }]}>{categoryLabel}</Text>
        <View style={cardStyles.dividerRow}>
          <View style={cardStyles.dividerLine} />
          <Text style={cardStyles.dividerStar}>✦</Text>
          <View style={cardStyles.dividerLine} />
        </View>
        <Text style={cardStyles.forName}>{data.userName}</Text>

        {data.insights.length > 0 && (
          <View style={cardStyles.traitsContainer}>
            {data.insights.slice(0, 3).map((ins, i) => (
              <View key={i} style={cardStyles.traitRow}>
                <Text style={cardStyles.traitBullet}>✦</Text>
                <Text style={cardStyles.traitText}>{ins}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={cardStyles.footer}>
        <View style={cardStyles.footerDividerRow}>
          <View style={cardStyles.footerDividerLine} />
          <Text style={cardStyles.footerDividerStar}>✦</Text>
          <View style={cardStyles.footerDividerLine} />
        </View>
        <Text style={cardStyles.cta}>Discover yours at theoracle.app</Text>
      </View>
    </View>
  );
}

export default function ShareCardModal({ visible, onClose, data }: ShareCardModalProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [ratio, setRatio] = useState<AspectRatio>("story");
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!viewShotRef.current?.capture) return;
    setSharing(true);
    try {
      const uri = await viewShotRef.current.capture();

      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "oracle-share.png";
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share your Oracle card",
        });
      }
    } catch (e) {
      console.warn("Share failed:", e);
    } finally {
      setSharing(false);
    }
  }, []);

  const renderCard = () => {
    switch (data.type) {
      case "archetype":
        return <ArchetypeCard data={data} ratio={ratio} />;
      case "synastry":
        return <SynastryCard data={data} ratio={ratio} />;
      case "deepdive":
        return <DeepDiveCard data={data} ratio={ratio} />;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Share Your Card</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close" accessibilityRole="button">
              <Feather name="x" size={22} color={Colors.cream} />
            </Pressable>
          </View>

          <View style={modalStyles.ratioToggle}>
            <Pressable
              style={[modalStyles.ratioBtn, ratio === "story" && modalStyles.ratioBtnActive]}
              onPress={() => setRatio("story")}
              accessibilityLabel="Story format"
              accessibilityRole="button"
            >
              <Text style={[modalStyles.ratioBtnText, ratio === "story" && modalStyles.ratioBtnTextActive]}>Story</Text>
            </Pressable>
            <Pressable
              style={[modalStyles.ratioBtn, ratio === "feed" && modalStyles.ratioBtnActive]}
              onPress={() => setRatio("feed")}
              accessibilityLabel="Feed format"
              accessibilityRole="button"
            >
              <Text style={[modalStyles.ratioBtnText, ratio === "feed" && modalStyles.ratioBtnTextActive]}>Feed</Text>
            </Pressable>
          </View>

          <View style={modalStyles.previewWrap}>
            <ViewShot
              ref={viewShotRef}
              options={{
                format: "png",
                quality: 1,
                width: ratio === "story" ? 1080 : 1080,
                height: ratio === "story" ? 1920 : 1080,
              }}
            >
              {renderCard()}
            </ViewShot>
          </View>

          <Pressable
            style={({ pressed }) => [modalStyles.shareBtn, pressed && { opacity: 0.85 }, sharing && { opacity: 0.6 }]}
            onPress={handleShare}
            disabled={sharing}
            accessibilityLabel="Share image card"
            accessibilityRole="button"
          >
            {sharing ? (
              <ActivityIndicator size="small" color={Colors.bg} />
            ) : (
              <>
                <Feather name="share-2" size={18} color={Colors.bg} />
                <Text style={modalStyles.shareBtnText}>Share</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function extractArchetypeData(reading: string, userName: string): ArchetypeCardData {
  const archetypeMatch = reading.match(/✦\s*YOUR ARCHETYPE\s*[—–-]\s*([^\n]+)/i);
  const archetypeName = archetypeMatch?.[1]?.trim() ?? "The Seeker";

  const traits: string[] = [];
  const traitPatterns = [
    /core\s*trait[s]?[:\s]+([^\n]+)/i,
    /key\s*quality[:\s]+([^\n]+)/i,
    /primary\s*energy[:\s]+([^\n]+)/i,
    /strength[s]?[:\s]+([^\n]+)/i,
    /essence[:\s]+([^\n]+)/i,
    /defining\s*quality[:\s]+([^\n]+)/i,
  ];
  for (const pat of traitPatterns) {
    const m = reading.match(pat);
    if (m?.[1] && traits.length < 3) {
      traits.push(m[1].trim().slice(0, 60));
    }
  }

  if (traits.length === 0) {
    const sentences = reading
      .split(/[.!]\s+/)
      .filter(s => s.length > 20 && s.length < 80)
      .slice(0, 3);
    for (const s of sentences) {
      if (traits.length < 3) traits.push(s.trim().slice(0, 60));
    }
  }

  return { type: "archetype", userName, archetypeName, traits };
}

export function extractSynastryData(reading: string, name1: string, name2: string): SynastryCardData {
  const highlights: string[] = [];
  const patterns = [
    /connection[:\s]+([^\n]+)/i,
    /dynamic[:\s]+([^\n]+)/i,
    /bond[:\s]+([^\n]+)/i,
    /chemistry[:\s]+([^\n]+)/i,
    /harmony[:\s]+([^\n]+)/i,
    /challenge[:\s]+([^\n]+)/i,
  ];

  for (const pat of patterns) {
    const m = reading.match(pat);
    if (m?.[1] && highlights.length < 3) {
      highlights.push(m[1].trim().slice(0, 60));
    }
  }

  if (highlights.length === 0) {
    const sentences = reading
      .split(/[.!]\s+/)
      .filter(s => s.length > 20 && s.length < 80)
      .slice(0, 3);
    for (const s of sentences) {
      if (highlights.length < 3) highlights.push(s.trim().slice(0, 60));
    }
  }

  return { type: "synastry", name1, name2, highlights };
}

export function extractDeepDiveData(
  text: string,
  userName: string,
  category: string,
): DeepDiveCardData {
  const insights: string[] = [];
  const sentences = text
    .split(/[.!]\s+/)
    .filter(s => s.length > 20 && s.length < 80)
    .slice(0, 3);
  for (const s of sentences) {
    if (insights.length < 3) insights.push(s.trim().slice(0, 60));
  }
  return { type: "deepdive", userName, category, insights };
}

const cardStyles = StyleSheet.create({
  base: {
    backgroundColor: Colors.bg,
    overflow: "hidden",
    position: "relative",
  },
  story: {
    width: 270,
    height: 480,
    padding: 24,
    justifyContent: "space-between",
  },
  feed: {
    width: 300,
    height: 300,
    padding: 20,
    justifyContent: "space-between",
  },
  glowTop: {
    position: "absolute",
    top: -60,
    left: "30%",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(201,168,76,0.08)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -40,
    right: "20%",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(201,168,76,0.05)",
  },
  topBrand: {
    alignItems: "center",
    marginBottom: 4,
  },
  brandSmall: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 10,
    color: Colors.gold,
    letterSpacing: 4,
    opacity: 0.7,
  },
  centerContent: {
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  labelSmall: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 8,
    color: Colors.gold,
    letterSpacing: 2,
    opacity: 0.8,
    marginTop: 8,
  },
  archetypeName: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 26,
    color: Colors.cream,
    textAlign: "center",
    letterSpacing: 1,
  },
  forName: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "80%",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(201,168,76,0.3)",
  },
  dividerStar: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 10,
    color: Colors.gold,
    opacity: 0.6,
  },
  traitsContainer: {
    gap: 6,
    marginTop: 8,
    width: "100%",
    paddingHorizontal: 8,
  },
  traitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  traitBullet: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 9,
    color: Colors.gold,
    marginTop: 2,
  },
  traitText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 11,
    color: Colors.cream,
    opacity: 0.85,
    lineHeight: 16,
    flex: 1,
  },
  synastryNames: {
    alignItems: "center",
    gap: 4,
    marginVertical: 4,
  },
  synastryName: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 16,
    color: Colors.cream,
    textAlign: "center",
    letterSpacing: 1,
  },
  synastryConnector: {
    marginVertical: 4,
  },
  footer: {
    alignItems: "center",
    gap: 6,
  },
  footerDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "60%",
  },
  footerDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(201,168,76,0.2)",
  },
  footerDividerStar: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 8,
    color: Colors.gold,
    opacity: 0.4,
  },
  cta: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 9,
    color: Colors.gold,
    opacity: 0.6,
    letterSpacing: 0.5,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 14,
    color: Colors.cream,
    letterSpacing: 0.5,
  },
  ratioToggle: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: Colors.inputBg,
    borderRadius: 20,
    padding: 3,
    marginBottom: 16,
  },
  ratioBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 17,
  },
  ratioBtnActive: {
    backgroundColor: Colors.gold,
  },
  ratioBtnText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 13,
    color: Colors.muted,
  },
  ratioBtnTextActive: {
    color: Colors.bg,
  },
  previewWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.15)",
  },
  shareBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 54,
  },
  shareBtnText: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 13,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
});
