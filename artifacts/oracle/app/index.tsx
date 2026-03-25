import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Dimensions,
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

const { width } = Dimensions.get("window");

const TRUST_LINES = [
  "Real vision analysis — not just archetypes",
  "15+ ancient systems synthesized into one reading",
  "Trusted by 10,000+ seekers worldwide",
];

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const glowOpacity = useSharedValue(0.5);
  const buttonScale = useSharedValue(1);

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

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

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
            >
              <Text style={styles.ctaText}>Begin Your Reading</Text>
              <Feather name="arrow-right" size={20} color={Colors.bg} style={{ marginLeft: 8 }} />
            </Pressable>
          </Animated.View>

          <Text style={styles.privacyNote}>
            Your images are never stored or shared.
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
});
