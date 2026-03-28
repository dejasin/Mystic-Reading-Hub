import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Share,
  Alert,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import { useReferral } from "@/context/ReferralContext";

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const {
    referralCode,
    referralCount,
    freeDeepDives,
    loading,
    refreshStats,
  } = useReferral();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    refreshStats();
  }, []);

  const referralLink = referralCode
    ? `https://theoracle.app/invite/${referralCode}`
    : "";

  const handleShare = async () => {
    if (!referralCode) return;
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Share.share({
        message: `The Oracle revealed something extraordinary about me. Discover your truth — use my code ${referralCode} for a free deep-dive reading.\n\n${referralLink}`,
      });
    } catch (e) {
      console.error("Share failed:", e);
    }
  };

  const handleCopy = async () => {
    if (!referralCode) return;
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Clipboard.setStringAsync(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert("Could not copy to clipboard");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={20} color={Colors.gold} />
        </Pressable>
        <Text style={styles.headerTitle}>Refer a Friend</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(800)} style={styles.heroSection}>
          <Text style={styles.heroIcon}>✦</Text>
          <Text style={styles.heroTitle}>Share The Oracle</Text>
          <Text style={styles.heroSubtitle}>
            When a friend uses your code, you both receive a free deep-dive reading.
          </Text>
        </Animated.View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 40 }} />
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.codeCard}>
              <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
              <Text style={styles.codeText}>{referralCode ?? "..."}</Text>
              <View style={styles.codeActions}>
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
                  onPress={handleCopy}
                >
                  <Feather name={copied ? "check" : "copy"} size={16} color={Colors.gold} />
                  <Text style={styles.actionText}>{copied ? "Copied!" : "Copy Code"}</Text>
                </Pressable>

                <View style={styles.actionSep} />

                <Pressable
                  style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
                  onPress={handleShare}
                >
                  <Feather name="share-2" size={16} color={Colors.gold} />
                  <Text style={styles.actionText}>Share</Text>
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{referralCount}</Text>
                <Text style={styles.statLabel}>Friends Referred</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{freeDeepDives}</Text>
                <Text style={styles.statLabel}>Free Deep Dives</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(600).delay(600)} style={styles.howItWorks}>
              <Text style={styles.sectionTitle}>How It Works</Text>
              <View style={styles.stepList}>
                <View style={styles.step}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNum}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Share your unique code with a friend</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNum}>2</Text>
                  </View>
                  <Text style={styles.stepText}>They enter your code when starting their reading</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNum}>3</Text>
                  </View>
                  <Text style={styles.stepText}>You both receive a free deep-dive reading</Text>
                </View>
              </View>
            </Animated.View>

            {freeDeepDives > 0 && (
              <Animated.View entering={FadeInDown.duration(600).delay(800)} style={styles.rewardBanner}>
                <Feather name="gift" size={20} color={Colors.bg} />
                <Text style={styles.rewardText}>
                  You have {freeDeepDives} free deep-dive {freeDeepDives === 1 ? "reading" : "readings"}!
                </Text>
              </Animated.View>
            )}
          </>
        )}

        <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 24 }} />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 14,
    color: Colors.cream,
    flex: 1,
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
    gap: 24,
  },
  heroSection: {
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  heroIcon: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 32,
    color: Colors.gold,
  },
  heroTitle: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 22,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 2,
  },
  heroSubtitle: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 16,
    color: Colors.cream,
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.85,
    maxWidth: 300,
  },
  codeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.3)",
    padding: 24,
    alignItems: "center",
    gap: 16,
  },
  codeLabel: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 12,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  codeText: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 28,
    color: Colors.gold,
    letterSpacing: 6,
  },
  codeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  actionText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 15,
    color: Colors.gold,
  },
  actionSep: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(201,168,76,0.25)",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  statNumber: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 28,
    color: Colors.gold,
  },
  statLabel: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
  },
  howItWorks: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 15,
    color: Colors.cream,
    letterSpacing: 1,
    textAlign: "center",
  },
  stepList: {
    gap: 14,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(201,168,76,0.15)",
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 14,
    color: Colors.gold,
  },
  stepText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 15,
    color: Colors.cream,
    flex: 1,
    lineHeight: 22,
    opacity: 0.85,
  },
  rewardBanner: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  rewardText: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 13,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
});
