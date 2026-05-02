import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from "react-native-svg";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import GoldSigil from "@/components/GoldSigil";
import { useOracle } from "@/context/OracleContext";
import { useSubscription } from "@/lib/revenuecat";

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

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

function RadarChart({ scores, animate }: { scores: number[]; animate: boolean }) {
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

  // Animated progress 0 → 1, drives polygon expansion
  const progress = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      progress.value = 0;
      progress.value = withDelay(
        150,
        withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) }),
      );
    } else {
      progress.value = 1;
    }
  }, [animate, scores.join(",")]);

  const animatedPolygonProps = useAnimatedProps<React.ComponentProps<typeof Polygon>>(() => {
    const t = progress.value;
    const points = scores
      .map((s, i) => {
        const a = angleFor(i);
        const x = cx + Math.cos(a) * radius * s * t;
        const y = cy + Math.sin(a) * radius * s * t;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
    return { points };
  });

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

        <AnimatedPolygon
          animatedProps={animatedPolygonProps}
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

function formatRelative(updatedAt: number | null): string {
  if (!updatedAt) return "";
  const now = Date.now();
  const diff = Math.max(0, now - updatedAt);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const d = new Date(updatedAt);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function BehavioralProfileScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useOracle();
  const { isSubscribed } = useSubscription();
  const { userData, behavioralScores, behavioralScoresUpdatedAt } = state;

  const hasScores = !!behavioralScores;
  const isLocked = !hasScores;

  const scores = useMemo(
    () =>
      DIMENSIONS.map((d) => {
        if (behavioralScores) {
          const v = behavioralScores[d.key as keyof typeof behavioralScores];
          if (typeof v === "number" && Number.isFinite(v)) {
            return Math.max(0, Math.min(1, v));
          }
        }
        return 0.5;
      }),
    [behavioralScores]
  );

  const formatScore = (s: number) => Math.round(s * 100);
  const lastAnalyzed = formatRelative(behavioralScoresUpdatedAt ?? null);

  const handleBridgeToChat = () => {
    if (isSubscribed) {
      router.push("/chat");
    } else {
      router.push("/reading");
    }
  };

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
            {userData.name && !isLocked
              ? `A snapshot of how ${userData.name} moves through the world.`
              : "A snapshot of how you move through the world."}
          </Text>
          {hasScores && lastAnalyzed && (
            <Text style={styles.timestamp}>Last analyzed {lastAnalyzed}</Text>
          )}
        </Animated.View>

        {isLocked ? (
          <Animated.View entering={FadeIn.duration(700).delay(150)} style={styles.lockedCard}>
            <Feather name="lock" size={28} color={Colors.gold} style={{ opacity: 0.7, marginBottom: 12 }} />
            <Text style={styles.lockedTitle}>Profile Locked</Text>
            <Text style={styles.lockedBody}>
              Your behavioral profile is generated from your first Oracle session. Complete a session to unlock the full radar — your six core dimensions, ranked.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.lockedCta, pressed && { opacity: 0.85 }]}
              onPress={() => router.push("/intake")}
              accessibilityLabel="Begin Your First Session"
              accessibilityRole="button"
            >
              <Text style={styles.lockedCtaText}>Begin Your First Session</Text>
              <Feather name="arrow-right" size={16} color={Colors.bg} />
            </Pressable>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeIn.duration(700).delay(150)} style={styles.chartCard}>
              <RadarChart scores={scores} animate={hasScores} />
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

            <Animated.View entering={FadeIn.duration(700).delay(450)} style={styles.bridgeCtaWrap}>
              <Pressable
                style={({ pressed }) => [styles.bridgeCta, pressed && { opacity: 0.85 }]}
                onPress={handleBridgeToChat}
                accessibilityLabel="Talk to Oracle About Your Profile"
                accessibilityRole="button"
              >
                <Feather name="message-circle" size={18} color={Colors.bg} />
                <Text style={styles.bridgeCtaText}>Talk to Oracle About Your Profile →</Text>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeIn.duration(700).delay(600)} style={styles.footerCard}>
              <Text style={styles.footerText}>
                This profile is a reflection — not a verdict. It shifts as you do. Return to it when
                something changes inside you.
              </Text>
            </Animated.View>
          </>
        )}
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
  timestamp: {
    color: Colors.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
    opacity: 0.85,
  },
  lockedCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    padding: 28,
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  lockedTitle: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
  },
  lockedBody: {
    color: Colors.cream,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    opacity: 0.85,
  },
  lockedCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
    minHeight: 48,
  },
  lockedCtaText: {
    color: Colors.bg,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
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
  bridgeCtaWrap: {
    width: "100%",
    marginTop: 8,
    marginBottom: 8,
  },
  bridgeCta: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 52,
  },
  bridgeCtaText: {
    color: Colors.bg,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.5,
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
