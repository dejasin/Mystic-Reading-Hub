import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from "react-native-svg";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import GoldSigil from "@/components/GoldSigil";
import { useOracle } from "@/context/OracleContext";

const DIMENSIONS = [
  {
    key: "intuition",
    label: "Intuition",
    description: "How readily you sense beneath the surface of a situation.",
  },
  {
    key: "emotional_depth",
    label: "Emotional Depth",
    description: "The range and intensity of feeling you can hold and process.",
  },
  {
    key: "drive",
    label: "Drive",
    description: "The force with which you move toward what you want.",
  },
  {
    key: "adaptability",
    label: "Adaptability",
    description: "How fluidly you adjust when circumstances shift.",
  },
  {
    key: "inner_knowing",
    label: "Inner Knowing",
    description: "Your access to clarity that does not need external proof.",
  },
  {
    key: "expression",
    label: "Expression",
    description: "How clearly you translate the inner world into outer form.",
  },
] as const;

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function scoreFor(seed: string, key: string): number {
  const h = hashString(`${seed}::${key}`);
  return 0.4 + ((h % 1000) / 1000) * 0.55;
}

function RadarChart({ scores }: { scores: number[] }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 36;
  const n = scores.length;

  const angleFor = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  const ringLevels = [0.25, 0.5, 0.75, 1.0];

  const polygonForLevel = (level: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = angleFor(i);
      const x = cx + Math.cos(a) * radius * level;
      const y = cy + Math.sin(a) * radius * level;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ");

  const dataPolygon = scores
    .map((s, i) => {
      const a = angleFor(i);
      const x = cx + Math.cos(a) * radius * s;
      const y = cy + Math.sin(a) * radius * s;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <Svg width={size} height={size}>
      <G>
        {ringLevels.map((level, i) => (
          <Polygon
            key={`ring-${i}`}
            points={polygonForLevel(level)}
            fill="none"
            stroke={Colors.gold}
            strokeOpacity={0.18}
            strokeWidth={1}
          />
        ))}

        {Array.from({ length: n }, (_, i) => {
          const a = angleFor(i);
          const x = cx + Math.cos(a) * radius;
          const y = cy + Math.sin(a) * radius;
          return (
            <Line
              key={`spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={Colors.gold}
              strokeOpacity={0.18}
              strokeWidth={1}
            />
          );
        })}

        <Polygon
          points={dataPolygon}
          fill={Colors.gold}
          fillOpacity={0.25}
          stroke={Colors.gold}
          strokeWidth={1.5}
        />

        {scores.map((s, i) => {
          const a = angleFor(i);
          const x = cx + Math.cos(a) * radius * s;
          const y = cy + Math.sin(a) * radius * s;
          return (
            <Circle
              key={`pt-${i}`}
              cx={x}
              cy={y}
              r={3}
              fill={Colors.goldLight}
            />
          );
        })}

        {DIMENSIONS.map((d, i) => {
          const a = angleFor(i);
          const labelRadius = radius + 18;
          const x = cx + Math.cos(a) * labelRadius;
          const y = cy + Math.sin(a) * labelRadius;
          return (
            <SvgText
              key={`lbl-${i}`}
              x={x}
              y={y}
              fontSize={10}
              fill={Colors.cream}
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {d.label.toUpperCase()}
            </SvgText>
          );
        })}
      </G>
    </Svg>
  );
}

export default function BehavioralProfileScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useOracle();
  const { userData, freeReading, paidReading, behavioralScores } = state;

  const seed = useMemo(() => {
    const base = `${userData.name ?? ""}|${userData.dob ?? ""}|${userData.dominantHand ?? ""}`;
    const readingHash = `${(freeReading ?? "").length}|${(paidReading ?? "").length}`;
    return `${base}|${readingHash}`;
  }, [userData.name, userData.dob, userData.dominantHand, freeReading, paidReading]);

  const scores = useMemo(
    () =>
      DIMENSIONS.map((d) => {
        if (behavioralScores) {
          const v = behavioralScores[d.key as keyof typeof behavioralScores];
          if (typeof v === "number" && Number.isFinite(v)) {
            return Math.max(0, Math.min(1, v));
          }
        }
        return scoreFor(seed, d.key);
      }),
    [seed, behavioralScores]
  );

  const hasReading = Boolean((freeReading && freeReading.length > 0) || (paidReading && paidReading.length > 0));

  const formatScore = (s: number) => Math.round(s * 100);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StarField />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={20} color={Colors.gold} />
        </Pressable>
        <Text style={styles.headerTitle}>Behavioral Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "web" ? 48 : insets.bottom + 48 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(700)} style={styles.titleBlock}>
          <GoldSigil size={64} style={{ alignSelf: "center", marginBottom: 12 }} />
          <Text style={styles.title}>YOUR INNER WIRING</Text>
          <Text style={styles.divider}>─── ✦ ───</Text>
          <Text style={styles.subtitle}>
            {userData.name
              ? `A snapshot of how ${userData.name} moves through the world.`
              : "A snapshot of how you move through the world."}
          </Text>
          {!hasReading && (
            <Text style={styles.emptyNote}>
              Begin a session to refine this profile with your palm analysis.
            </Text>
          )}
        </Animated.View>

        <Animated.View entering={FadeIn.duration(700).delay(150)} style={styles.chartCard}>
          <RadarChart scores={scores} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(700).delay(300)} style={styles.dimensionsList}>
          {DIMENSIONS.map((d, i) => (
            <View key={d.key} style={styles.dimensionRow}>
              <View style={styles.dimensionHeader}>
                <Text style={styles.dimensionLabel}>{d.label}</Text>
                <Text style={styles.dimensionScore}>{formatScore(scores[i])}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${formatScore(scores[i])}%` }]} />
              </View>
              <Text style={styles.dimensionDescription}>{d.description}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeIn.duration(700).delay(450)} style={styles.footerCard}>
          <Text style={styles.footerText}>
            This profile is a reflection — not a verdict. It shifts as you do. Return to it when
            something changes inside you.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: Colors.cream,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  titleBlock: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  title: {
    color: Colors.gold,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 4,
    textAlign: "center",
  },
  divider: {
    color: Colors.gold,
    opacity: 0.5,
    letterSpacing: 4,
    marginVertical: 10,
  },
  subtitle: {
    color: Colors.cream,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  emptyNote: {
    color: Colors.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
  chartCard: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.15)",
  },
  dimensionsList: {
    gap: 18,
    marginBottom: 24,
  },
  dimensionRow: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.12)",
  },
  dimensionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  dimensionLabel: {
    color: Colors.cream,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  dimensionScore: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: "700",
  },
  barTrack: {
    height: 4,
    backgroundColor: "rgba(201,168,76,0.12)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  barFill: {
    height: "100%",
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  dimensionDescription: {
    color: Colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  footerCard: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  footerText: {
    color: Colors.muted,
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 18,
  },
});
