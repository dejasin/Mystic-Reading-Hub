import React, { useEffect, useRef } from "react";
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
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import GoldSigil from "@/components/GoldSigil";
import { useSubscription } from "@/lib/revenuecat";
import { useAuth } from "@/context/AuthContext";

const { width } = Dimensions.get("window");

const TRUST_LINES = [
  "Real vision analysis — not just archetypes",
  "15+ ancient systems synthesized into one reading",
  "Deep insights across love, career, health & purpose",
];

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const glowOpacity = useSharedValue(0.5);
  const buttonScale = useSharedValue(1);
  const { restore, isRestoring, isConfigured } = useSubscription();
  const { user, isLoggedIn, logout } = useAuth();

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
    router.push("/intake");
  };

  const handleRestore = async () => {
    if (!isConfigured) return;
    try {
      const info = await restore();
      if (info?.entitlements?.active?.["full_reading"]) {
        Alert.alert("Purchase Restored", "Your full reading has been restored.");
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

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      <View style={styles.accountBar}>
        <Pressable
          style={({ pressed }) => [styles.accountBtn, pressed && { opacity: 0.7 }]}
          onPress={handleAccountPress}
          accessibilityLabel={isLoggedIn ? `Account: ${user?.email}` : "Sign in"}
          accessibilityRole="button"
        >
          <Feather
            name={isLoggedIn ? "user-check" : "user"}
            size={16}
            color={isLoggedIn ? Colors.gold : Colors.muted}
          />
          <Text style={[styles.accountText, isLoggedIn && styles.accountTextActive]}>
            {isLoggedIn ? user?.email : "Sign In"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View entering={FadeIn.duration(1000)} style={styles.sigilContainer}>
          <GoldSigil size={140} />
        </Animated.View>

        <Animated.View entering={FadeIn.duration(1000).delay(200)}>
          <Text style={styles.appName}>THE ORACLE</Text>
          <Text style={styles.tagline}>
            Your palm. Your iris. Your face.{"\n"}Your truth.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(800).delay(500)} style={styles.trustContainer}>
          {TRUST_LINES.map((line, i) => (
            <View key={i} style={styles.trustLine}>
              <Text style={styles.trustDiamond}>✦</Text>
              <Text style={styles.trustText}>{line}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeIn.duration(800).delay(700)} style={styles.ctaContainer}>
          <Animated.View style={[styles.ctaButtonWrapper, glowStyle]}>
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleBegin}
              accessibilityLabel="Begin your Oracle reading"
              accessibilityRole="button"
            >
              <Text style={styles.ctaText}>Begin Your Reading</Text>
              <Feather name="arrow-right" size={20} color={Colors.bg} style={{ marginLeft: 8 }} />
            </Pressable>
          </Animated.View>

          <View style={styles.secondaryRow}>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.75 }]}
              onPress={() => router.push("/profiles")}
              accessibilityLabel="Open the profile vault"
              accessibilityRole="button"
            >
              <Feather name="users" size={16} color={Colors.gold} />
              <Text style={styles.secondaryText}>The Vault</Text>
            </Pressable>

            <View style={styles.secondarySep} />

            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.75 }]}
              onPress={() => router.push("/synastry")}
              accessibilityLabel="Start a synastry reading"
              accessibilityRole="button"
            >
              <Text style={styles.secondaryIcon}>✦ ✦</Text>
              <Text style={styles.secondaryText}>Synastry</Text>
            </Pressable>

            <View style={styles.secondarySep} />

            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.75 }]}
              onPress={handleRestore}
              disabled={isRestoring || !isConfigured}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color={Colors.gold} />
              ) : (
                <Text style={styles.secondaryText}>Restore</Text>
              )}
            </Pressable>
          </View>

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
  accountBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
  },
  accountBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  accountText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 13,
    color: Colors.muted,
  },
  accountTextActive: {
    color: Colors.gold,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  sigilContainer: {
    marginBottom: 32,
    alignItems: "center",
  },
  appName: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 28,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 4,
    marginBottom: 14,
  },
  tagline: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 17,
    color: Colors.cream,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 40,
    opacity: 0.9,
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
    fontFamily: "CinzelDecorative_400Regular",
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
});
