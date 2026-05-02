import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import GoldSigil from "@/components/GoldSigil";
import { useSubscription } from "@/lib/revenuecat";
import { useAuth } from "@/context/AuthContext";
import { trackEvent, trackFunnelStep, AnalyticsEvent } from "@/lib/analytics";
import { useProfiles } from "@/context/ProfileContext";
import { useReferral } from "@/context/ReferralContext";
import { getApiUrl } from "@/lib/api";

const ONBOARDING_COMPLETE_KEY = "@oracle/onboarding_complete";

const { width } = Dimensions.get("window");

const ORACLE_HELP_LINES = [
  "Career direction and major life decisions",
  "Relationships, intimacy, and how you connect",
  "Money, drive, and what you actually want",
  "Family dynamics and inherited patterns",
  "Health, energy, and your inner rhythms",
];

const PRO_BANNER_DISMISS_KEY = "oracle_pro_banner_dismissed_at";
const PRO_BANNER_DISMISS_HOURS = 24;

function DailyOracleCard({ profile }: { profile: { id: string; name: string; sessionId?: string } }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDaily = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const baseUrl = getApiUrl();
      const resp = await fetch(`${baseUrl}api/daily-oracle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Task #64 — include sessionId so the server's themesBlock branch
        // pulls this profile's most recent reading instead of the generic
        // fallback. Field omitted when the profile has no completed
        // session yet — server already handles the empty case.
        body: JSON.stringify({
          profileId: profile.id,
          name: profile.name,
          ...(profile.sessionId ? { sessionId: profile.sessionId } : {}),
        }),
      });
      if (!resp.ok) throw new Error("Failed");
      const data = await resp.json();
      setContent(data.content);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [profile.id, profile.name, profile.sessionId]);

  useEffect(() => {
    fetchDaily();
  }, [fetchDaily]);

  const today = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dateStr = `${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}`;

  return (
    <Animated.View entering={FadeInDown.duration(700).delay(300)} style={styles.dailyCard}>
      <View style={styles.dailyHeader}>
        <Text style={styles.dailyTitle}>✦ Daily Reflection</Text>
        <Pressable
          onPress={() => router.push({ pathname: "/daily-history", params: { profileId: profile.id, profileName: profile.name } })}
          style={({ pressed }) => [styles.historyBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="clock" size={14} color={Colors.gold} />
          <Text style={styles.historyBtnText}>History</Text>
        </Pressable>
      </View>
      <Text style={styles.dailyDate}>{dateStr}</Text>
      <Text style={styles.dailyFor}>For {profile.name}</Text>

      {loading && (
        <View style={styles.dailyLoadingContainer}>
          <ActivityIndicator size="small" color={Colors.gold} />
          <Text style={styles.dailyLoadingText}>Generating today's reflection…</Text>
        </View>
      )}

      {error && !loading && (
        <Pressable onPress={fetchDaily} style={styles.dailyErrorContainer}>
          <Text style={styles.dailyErrorText}>Could not load today's reflection. Tap to retry.</Text>
        </Pressable>
      )}

      {content && !loading && (
        <Text style={styles.dailyContent}>{content}</Text>
      )}
    </Animated.View>
  );
}

function WeeklyForecastCard({ profile }: { profile: { id: string; name: string; sessionId?: string } }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchWeekly = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const baseUrl = getApiUrl();
      const resp = await fetch(`${baseUrl}api/weekly-forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Task #64 — same sessionId plumbing as DailyOracleCard above.
        body: JSON.stringify({
          profileId: profile.id,
          name: profile.name,
          ...(profile.sessionId ? { sessionId: profile.sessionId } : {}),
        }),
      });
      if (!resp.ok) throw new Error("Failed");
      const data = await resp.json();
      setContent(data.content);
      setExpanded(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [profile.id, profile.name, profile.sessionId]);

  const handlePress = async () => {
    if (content) {
      setExpanded(!expanded);
      return;
    }
    await fetchWeekly();
  };

  return (
    <Animated.View entering={FadeInDown.duration(700).delay(500)} style={styles.weeklyCard}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.weeklyHeader, pressed && { opacity: 0.8 }]}
      >
        <View style={styles.weeklyTitleRow}>
          <Text style={styles.weeklyTitle}>✦ This Week's Focus</Text>
          {loading && <ActivityIndicator size="small" color={Colors.gold} style={{ marginLeft: 8 }} />}
        </View>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={Colors.gold}
        />
      </Pressable>

      {error && !loading && (
        <Pressable onPress={fetchWeekly} style={styles.weeklyErrorContainer}>
          <Text style={styles.dailyErrorText}>Could not load this week's reflection. Tap to retry.</Text>
        </Pressable>
      )}

      {expanded && content && (
        <Animated.View entering={FadeIn.duration(400)}>
          <Text style={styles.weeklyContent}>{content}</Text>
        </Animated.View>
      )}

      {!content && !loading && !error && (
        <Text style={styles.weeklyHint}>Tap to load this week's reflection</Text>
      )}
    </Animated.View>
  );
}

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const glowOpacity = useSharedValue(0.5);
  const { restore, isRestoring, isConfigured, isSubscribed } = useSubscription();
  const { user, isLoggedIn, logout } = useAuth();
  const { profiles, isLoaded } = useProfiles();
  const { referralCount, freeDeepDives } = useReferral();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [proBannerVisible, setProBannerVisible] = useState(false);

  useEffect(() => {
    (async () => {
      if (isSubscribed) {
        setProBannerVisible(false);
        return;
      }
      try {
        const raw = await AsyncStorage.getItem(PRO_BANNER_DISMISS_KEY);
        const dismissedAt = raw ? parseInt(raw, 10) : 0;
        const cutoff = Date.now() - PRO_BANNER_DISMISS_HOURS * 60 * 60 * 1000;
        setProBannerVisible(!dismissedAt || dismissedAt < cutoff);
      } catch {
        setProBannerVisible(true);
      }
    })();
  }, [isSubscribed]);

  const handleDismissProBanner = async () => {
    setProBannerVisible(false);
    try {
      await AsyncStorage.setItem(PRO_BANNER_DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  const handleUpgradePro = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    router.push("/intake");
  };

  const mostRecentProfile = profiles.length > 0
    ? profiles.reduce((a, b) => (a.createdAt > b.createdAt ? a : b))
    : null;

  const hasProfile = mostRecentProfile && mostRecentProfile.dob;

  useEffect(() => {
    (async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        if (!completed) {
          router.replace("/onboarding");
          return;
        }
      } catch {
        router.replace("/onboarding");
        return;
      }
      setOnboardingChecked(true);
    })();
  }, []);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
    borderColor: `rgba(201,168,76,${glowOpacity.value * 0.8})`,
  }));

  const handleBegin = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    trackFunnelStep("intake");
    router.push("/intake");
  };

  const handleRestore = async () => {
    if (!isConfigured) return;
    try {
      const info = await restore();
      if (info?.entitlements?.active?.["full_reading"]) {
        Alert.alert("Purchase Restored", "Your full session has been restored.");
      } else {
        Alert.alert("No Purchase Found", "No previous purchase was found for this account.");
      }
    } catch {
      Alert.alert("Restore Failed", "Could not restore purchase. Please try again.");
    }
  };

  const handleAccountPress = () => {
    if (isLoggedIn) {
      Alert.alert(
        "Account",
        `Signed in as ${user?.email}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign Out",
            style: "destructive",
            onPress: () => logout(),
          },
        ],
      );
    } else {
      router.push("/login");
    }
  };

  if (!onboardingChecked) {
    return <View style={styles.container}><StarField /></View>;
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      <View style={styles.topBar}>
        <View style={{ width: 44 }} />
        <View style={{ flex: 1 }} />
        <Pressable
          style={({ pressed }) => [styles.topBarBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.push("/settings")}
          accessibilityLabel="Open settings"
          accessibilityRole="button"
        >
          <Feather name="settings" size={20} color={Colors.gold} />
        </Pressable>
      </View>

      {proBannerVisible && !isSubscribed && (
        <Animated.View entering={FadeIn.duration(500)} style={styles.proBanner}>
          <Pressable
            style={({ pressed }) => [styles.proBannerInner, pressed && { opacity: 0.9 }]}
            onPress={handleUpgradePro}
            accessibilityLabel="Upgrade to Oracle Pro"
            accessibilityRole="button"
          >
            <Feather name="star" size={16} color={Colors.bg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.proBannerTitle}>Upgrade to Oracle Pro</Text>
              <Text style={styles.proBannerSub}>Unlock full sessions + unlimited Oracle Chat</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.bg} />
          </Pressable>
          <Pressable
            onPress={handleDismissProBanner}
            style={styles.proBannerDismiss}
            hitSlop={12}
            accessibilityLabel="Dismiss Oracle Pro banner"
            accessibilityRole="button"
          >
            <Feather name="x" size={14} color={Colors.bg} />
          </Pressable>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={[styles.content]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View entering={FadeIn.duration(1000)} style={styles.sigilContainer}>
          <GoldSigil size={hasProfile ? 100 : 140} />
        </Animated.View>

        <Animated.View entering={FadeIn.duration(1000).delay(200)}>
          <Text style={styles.appName}>ORACLE</Text>
          {!hasProfile && (
            <>
              <Text style={styles.taglineHeadline}>Your Personal AI Advisor</Text>
              <Text style={styles.tagline}>
                Powered by your palm. Guided by AI.
              </Text>
              <Text style={styles.taglineDescription}>
                Oracle uses a few biometric reference images and your context to map your
                behavioral profile — then helps you navigate the decisions in front of you.
              </Text>
            </>
          )}
        </Animated.View>

        {hasProfile && isLoaded && (
          <>
            <DailyOracleCard profile={{ id: mostRecentProfile.id, name: mostRecentProfile.name, sessionId: mostRecentProfile.sessionId }} />
            <WeeklyForecastCard profile={{ id: mostRecentProfile.id, name: mostRecentProfile.name, sessionId: mostRecentProfile.sessionId }} />
            <View style={styles.divider} />
          </>
        )}

        {!hasProfile && (
          <Animated.View entering={FadeIn.duration(800).delay(500)} style={styles.trustContainer}>
            <Text style={styles.helpHeader}>Oracle can help with:</Text>
            {ORACLE_HELP_LINES.map((line, i) => (
              <View key={i} style={styles.trustLine}>
                <Text style={styles.trustDiamond}>✦</Text>
                <Text style={styles.trustText}>{line}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        <Animated.View entering={FadeIn.duration(800).delay(hasProfile ? 400 : 700)} style={styles.ctaContainer}>
          <Animated.View style={[styles.ctaButtonWrapper, glowStyle]}>
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleBegin}
              accessibilityLabel="Start your Oracle session"
              accessibilityRole="button"
            >
              <Text style={styles.ctaText}>{hasProfile ? "New Session" : "Start Your Session"}</Text>
              <Feather name="arrow-right" size={20} color={Colors.bg} style={{ marginLeft: 8 }} />
            </Pressable>
          </Animated.View>

          <Pressable
            style={({ pressed }) => [styles.referralBanner, pressed && { opacity: 0.85 }]}
            onPress={() => router.push("/referral")}
            accessibilityLabel="Refer a friend"
            accessibilityRole="button"
          >
            <Feather name="gift" size={18} color={Colors.gold} />
            <View style={styles.referralBannerText}>
              <Text style={styles.referralTitle}>Refer a Friend</Text>
              <Text style={styles.referralSub}>
                {referralCount > 0
                  ? `${referralCount} referred · ${freeDeepDives} free sessions`
                  : "Both of you get a free deep-dive session"}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.gold} />
          </Pressable>

          <View style={styles.secondaryRow}>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.75 }]}
              onPress={() => router.push("/profiles")}
              accessibilityLabel="Open the profile vault"
              accessibilityRole="button"
            >
              <Feather name="users" size={16} color={Colors.gold} />
              <Text style={styles.secondaryText}>Vault</Text>
            </Pressable>

            <View style={styles.secondarySep} />

            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.75 }]}
              onPress={() => router.push("/journal")}
              accessibilityLabel="Open your session journal"
              accessibilityRole="button"
            >
              <Feather name="book-open" size={16} color={Colors.gold} />
              <Text style={styles.secondaryText}>Journal</Text>
            </Pressable>

            <View style={styles.secondarySep} />

            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.75 }]}
              onPress={() => router.push("/behavioral-profile")}
              accessibilityLabel="Open your behavioral profile"
              accessibilityRole="button"
            >
              <Feather name="user" size={16} color={Colors.gold} />
              <Text style={styles.secondaryText}>Profile</Text>
            </Pressable>
          </View>

          <View style={styles.secondaryRow}>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.75 }]}
              onPress={() => router.push("/synastry")}
              accessibilityLabel="Start a relationship session"
              accessibilityRole="button"
            >
              <Text style={styles.secondaryIcon}>✦ ✦</Text>
              <Text style={styles.secondaryText}>Synastry</Text>
            </Pressable>
          </View>

          <View style={styles.secondaryRow}>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.75 }]}
              onPress={handleRestore}
              disabled={isRestoring || !isConfigured}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color={Colors.gold} />
              ) : (
                <Text style={styles.secondaryText}>Restore Purchase</Text>
              )}
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.notifBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.push("/notification-settings")}
            accessibilityLabel="Notification settings"
            accessibilityRole="button"
          >
            <Feather name="bell" size={15} color={Colors.gold} />
            <Text style={styles.secondaryText}>Notifications</Text>
          </Pressable>

          <Text style={styles.privacyNote}>
            Images are sent securely for analysis and never stored.
          </Text>
        </Animated.View>

        <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 0,
  },
  proBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gold,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 4,
  },
  proBannerInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 8,
  },
  proBannerTitle: {
    color: Colors.bg,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  proBannerSub: {
    color: Colors.bg,
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  proBannerDismiss: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
    marginLeft: 6,
  },
  topBarBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  sigilContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  appName: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 28,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 4,
    marginBottom: 14,
  },
  taglineHeadline: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 22,
    color: Colors.cream,
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 17,
    color: Colors.cream,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 18,
    opacity: 0.9,
  },
  taglineDescription: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 15,
    color: Colors.cream,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
    opacity: 0.78,
    paddingHorizontal: 8,
  },
  helpHeader: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 16,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 12,
  },
  trustContainer: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 44,
    gap: 16,
  },
  trustLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  trustDiamond: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.gold,
    marginTop: 2,
  },
  trustText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.cream,
    lineHeight: 24,
    flex: 1,
    opacity: 0.85,
  },
  ctaContainer: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    gap: 16,
  },
  ctaButtonWrapper: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 8,
  },
  ctaButton: {
    backgroundColor: Colors.gold,
    borderRadius: 11,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  ctaText: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 15,
    color: Colors.bg,
    letterSpacing: 1,
  },
  privacyNote: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    fontStyle: "italic",
  },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    gap: 0,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    minHeight: 44,
  },
  secondaryText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 15,
    color: Colors.gold,
  },
  secondaryIcon: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 12,
    color: Colors.gold,
    letterSpacing: 4,
  },
  secondarySep: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(201,168,76,0.25)",
  },
  dailyCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    padding: 20,
    marginBottom: 16,
  },
  dailyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  dailyTitle: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 16,
    color: Colors.gold,
    letterSpacing: 2,
  },
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  historyBtnText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 13,
    color: Colors.gold,
    opacity: 0.8,
  },
  dailyDate: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 2,
  },
  dailyFor: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 14,
    color: Colors.goldLight,
    marginBottom: 14,
    opacity: 0.9,
  },
  dailyContent: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.cream,
    lineHeight: 26,
    opacity: 0.92,
  },
  dailyLoadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },
  dailyLoadingText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    color: Colors.muted,
  },
  dailyErrorContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  dailyErrorText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
  },
  weeklyCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.12)",
    padding: 20,
    marginBottom: 16,
  },
  weeklyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weeklyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  weeklyTitle: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 15,
    color: Colors.gold,
    letterSpacing: 2,
  },
  weeklyContent: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.cream,
    lineHeight: 26,
    marginTop: 14,
    opacity: 0.92,
  },
  weeklyHint: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 13,
    color: Colors.muted,
    marginTop: 8,
  },
  weeklyErrorContainer: {
    paddingVertical: 12,
    alignItems: "center",
  },
  divider: {
    width: "80%",
    maxWidth: 320,
    height: 1,
    backgroundColor: "rgba(201,168,76,0.12)",
    marginVertical: 12,
  },
  referralBanner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(201,168,76,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  referralBannerText: {
    flex: 1,
    gap: 2,
  },
  referralTitle: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 15,
    color: Colors.gold,
  },
  referralSub: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 13,
    color: Colors.muted,
  },
  notifBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
});
