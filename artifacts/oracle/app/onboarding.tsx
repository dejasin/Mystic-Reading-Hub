import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  Platform,
  ViewToken,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import GoldSigil from "@/components/GoldSigil";

const { width } = Dimensions.get("window");
const ONBOARDING_COMPLETE_KEY = "@oracle/onboarding_complete";

interface SlideData {
  key: string;
  title: string;
  subtitle: string;
  bodyLines?: string[];
  isFinal?: boolean;
}

const SLIDES: SlideData[] = [
  {
    key: "veil",
    title: "ORACLE",
    subtitle: "Know yourself at a level most people never reach.",
  },
  {
    key: "chat",
    title: "ORACLE CHAT",
    subtitle: "An ongoing AI advisor for the decisions in front of you.",
    bodyLines: [
      "Ask Oracle anything — career, love, money, family",
      "Specific, grounded answers, not generic advice",
      "Continues the conversation between sessions",
    ],
  },
  {
    key: "profile",
    title: "YOUR BEHAVIORAL PROFILE",
    subtitle: "Six dimensions of who you are, mapped clearly.",
    bodyLines: [
      "Intuition, drive, adaptability, expression",
      "Inner knowing and emotional depth, scored",
      "A map of patterns — not a prediction",
    ],
  },
  {
    key: "palm",
    title: "PALM ANALYSIS",
    subtitle: "Powered by AI. Refined by your biometrics.",
    bodyLines: [
      "A few reference images of your hand",
      "AI reads behavioral signal from your imprint",
      "Images are sent securely and never stored",
    ],
    isFinal: true,
  },
];

function AnimatedSlideContent({ item }: { item: SlideData }) {
  const sigilSize = item.key === "veil" ? 160 : 80;

  return (
    <View style={styles.slideInner}>
      <Animated.View
        entering={ZoomIn.duration(900).delay(100)}
        style={styles.sigilWrap}
      >
        <GoldSigil size={sigilSize} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(700).delay(300)}>
        <Text style={styles.slideTitle}>{item.title}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(700).delay(550)}>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </Animated.View>

      {item.bodyLines && (
        <View style={styles.bodyContainer}>
          {item.bodyLines.map((line, i) => (
            <Animated.View
              key={i}
              entering={FadeInUp.duration(600).delay(800 + i * 200)}
              style={styles.bodyLine}
            >
              <Text style={styles.bodyDiamond}>✦</Text>
              <Text style={styles.bodyText}>{line}</Text>
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );
}

function SlideRenderer({ item, isActive }: { item: SlideData; isActive: boolean }) {
  const [mountKey, setMountKey] = useState(0);
  const wasActive = useRef(false);

  useEffect(() => {
    if (isActive && !wasActive.current) {
      setMountKey((k) => k + 1);
    }
    wasActive.current = isActive;
  }, [isActive]);

  if (!isActive && mountKey === 0) {
    return <View style={styles.slideInner} />;
  }

  return <AnimatedSlideContent key={mountKey} item={item} />;
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const ctaGlow = useSharedValue(0.5);

  useEffect(() => {
    ctaGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const ctaGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: ctaGlow.value,
    borderColor: `rgba(201,168,76,${ctaGlow.value * 0.8})`,
  }));

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    } catch {}
    router.replace("/");
  };

  const handleSkip = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await completeOnboarding();
  };

  const handleNext = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  const handleBeginJourney = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await completeOnboarding();
  };

  const renderSlide = ({ item, index }: { item: SlideData; index: number }) => (
    <View style={[styles.slide, { width }]}>
      <SlideRenderer item={item} isActive={index === activeIndex} />
    </View>
  );

  const isFinal = activeIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 50 : insets.top }]}>
      <StarField />

      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <Animated.View entering={FadeIn.duration(500).delay(200)}>
          <Pressable
            style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
            onPress={handleSkip}
            accessibilityLabel="Skip onboarding"
            accessibilityRole="button"
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </Animated.View>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        extraData={activeIndex}
        style={styles.flatList}
      />

      <Animated.View
        entering={FadeInUp.duration(600).delay(400)}
        style={[styles.bottomArea, { paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 20 }]}
      >
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {isFinal ? (
          <>
            <Animated.View style={[styles.ctaButtonWrapper, ctaGlowStyle]}>
              <Pressable
                style={({ pressed }) => [
                  styles.ctaButton,
                  pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                ]}
                onPress={handleBeginJourney}
                accessibilityLabel="Begin your session"
                accessibilityRole="button"
              >
                <Text style={styles.ctaText}>Begin Your Session</Text>
              </Pressable>
            </Animated.View>
            <Text style={styles.poweredByText}>Powered by Anthropic Claude AI</Text>
          </>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.7 }]}
            onPress={handleNext}
            accessibilityLabel="Next slide"
            accessibilityRole="button"
          >
            <Text style={styles.nextText}>Continue</Text>
          </Pressable>
        )}
      </Animated.View>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    height: 44,
    zIndex: 10,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.muted,
    letterSpacing: 1,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slideInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 36,
    paddingBottom: 100,
  },
  sigilWrap: {
    marginBottom: 32,
  },
  slideTitle: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 24,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 4,
    marginBottom: 20,
  },
  slideSubtitle: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 18,
    color: Colors.cream,
    textAlign: "center",
    lineHeight: 28,
    opacity: 0.9,
    marginBottom: 8,
  },
  bodyContainer: {
    marginTop: 28,
    gap: 16,
    width: "100%",
    maxWidth: 320,
  },
  bodyLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bodyDiamond: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.gold,
    marginTop: 2,
  },
  bodyText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.cream,
    lineHeight: 24,
    flex: 1,
    opacity: 0.85,
  },
  bottomArea: {
    alignItems: "center",
    paddingHorizontal: 36,
    gap: 24,
  },
  pagination: {
    flexDirection: "row",
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(201,168,76,0.25)",
  },
  dotActive: {
    backgroundColor: Colors.gold,
    width: 24,
    borderRadius: 4,
  },
  nextBtn: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.4)",
    backgroundColor: "rgba(201,168,76,0.08)",
  },
  nextText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 17,
    color: Colors.gold,
    letterSpacing: 2,
    textAlign: "center",
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
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  ctaText: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 15,
    color: Colors.bg,
    letterSpacing: 2,
  },
  poweredByText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 12,
    color: Colors.muted,
    textAlign: "center",
    marginTop: 12,
    letterSpacing: 1,
    opacity: 0.85,
  },
});
