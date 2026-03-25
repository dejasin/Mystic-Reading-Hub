import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Share,
} from "react-native";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { fetch } from "expo/fetch";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import GoldSigil from "@/components/GoldSigil";
import { useOracle } from "@/context/OracleContext";

const LOADING_MESSAGES = [
  "Mapping your palm lines...",
  "Reading the iris zones...",
  "Cross-referencing your numerological signature...",
  "Synthesizing the ancient patterns...",
  "Your Oracle is preparing to speak...",
];

function LoadingView() {
  const [msgIndex, setMsgIndex] = useState(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={loadStyles.container}>
      <Animated.View style={rotateStyle}>
        <GoldSigil size={120} />
      </Animated.View>
      <Animated.Text
        key={msgIndex}
        entering={FadeIn.duration(600)}
        style={loadStyles.message}
      >
        {LOADING_MESSAGES[msgIndex]}
      </Animated.Text>
    </View>
  );
}

const loadStyles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 32 },
  message: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 16,
    color: Colors.gold,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 26,
  },
});

function PaywallGate({ onUnlock }: { onUnlock: () => void }) {
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
    borderColor: `rgba(201,168,76,${glowOpacity.value * 0.7})`,
  }));

  return (
    <Animated.View entering={FadeIn.duration(800)} style={paywallStyles.card}>
      <Text style={paywallStyles.title}>The Oracle sees more.</Text>
      <Text style={paywallStyles.cliffhanger}>
        You are approaching a phase where one decision will define the next 3–5 years of your life. The Oracle can already see the pattern forming.
      </Text>
      <Text style={paywallStyles.divider}>─── ✦ ───</Text>
      <Text style={paywallStyles.pitch}>
        Unlock your complete reading — 4 remaining sections + your Archetype + Oracle Chat access.
      </Text>
      <View style={paywallStyles.priceRow}>
        <Text style={paywallStyles.price}>$7.99</Text>
        <Text style={paywallStyles.priceDesc}>Full Reading + Lifetime Chat</Text>
      </View>

      {/* TODO: STRIPE — replace DEV bypass with real Stripe Checkout session creation
          Use STRIPE_SECRET_KEY from Replit Secrets
          Price ID: create $7.99 one-time product in Stripe Dashboard
          On success webhook → set session.paid = true → continue stream */}
      <Animated.View style={[paywallStyles.unlockWrapper, glowStyle]}>
        <Pressable
          style={({ pressed }) => [paywallStyles.unlockBtn, pressed && { opacity: 0.85 }]}
          onPress={onUnlock}
        >
          <Feather name="unlock" size={18} color={Colors.bg} />
          <Text style={paywallStyles.unlockText}>Unlock Full Reading</Text>
        </Pressable>
      </Animated.View>

      {/* TODO: SHARE-TO-UNLOCK — generate unique share URL, track clicks, unlock on 3 shares */}
      <Pressable
        style={paywallStyles.shareBtn}
        onPress={async () => {
          try {
            await Share.share({
              message: "I just discovered The Oracle — it gave me the most accurate life reading I've ever seen. Try it yourself: https://theoracle.app",
            });
          } catch {}
        }}
      >
        <Feather name="share-2" size={14} color={Colors.muted} />
        <Text style={paywallStyles.shareBtnText}>Share to Unlock</Text>
      </Pressable>

      {__DEV__ && (
        <Pressable style={paywallStyles.devBtn} onPress={onUnlock}>
          <Text style={paywallStyles.devBtnText}>DEV: Skip Payment</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const paywallStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    gap: 14,
  },
  title: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 18,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  cliffhanger: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 16,
    color: Colors.cream,
    lineHeight: 26,
    textAlign: "center",
    opacity: 0.9,
  },
  divider: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 13,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 4,
    opacity: 0.6,
  },
  pitch: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 15,
    color: Colors.cream,
    lineHeight: 24,
    textAlign: "center",
    opacity: 0.8,
  },
  priceRow: {
    alignItems: "center",
    gap: 4,
  },
  price: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 26,
    color: Colors.gold,
  },
  priceDesc: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.muted,
  },
  unlockWrapper: {
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
  unlockBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 11,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 52,
  },
  unlockText: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 13,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
  },
  shareBtnText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.muted,
  },
  devBtn: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "center",
  },
  devBtnText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 12,
    color: Colors.muted,
  },
});

function ReadingSection({ text }: { text: string }) {
  if (!text) return null;
  // Split into sections by ✦
  const sections = text.split(/(?=✦\s)/);
  return (
    <>
      {sections.map((section, i) => {
        if (!section.trim()) return null;
        const lines = section.trim().split("\n");
        const heading = lines[0].startsWith("✦") ? lines[0] : null;
        const body = heading ? lines.slice(1).join("\n").trim() : section.trim();
        return (
          <Animated.View key={i} entering={FadeIn.duration(600).delay(i * 100)} style={sectionStyles.container}>
            {heading && (
              <Text style={sectionStyles.heading}>{heading}</Text>
            )}
            <Text style={sectionStyles.divider}>─── ✦ ───</Text>
            <Text style={sectionStyles.body}>{body}</Text>
          </Animated.View>
        );
      })}
    </>
  );
}

const sectionStyles = StyleSheet.create({
  container: { marginBottom: 8 },
  heading: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 13,
    color: Colors.gold,
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 8,
  },
  divider: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 12,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 4,
    opacity: 0.5,
    marginBottom: 14,
  },
  body: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 17,
    color: Colors.cream,
    lineHeight: 30,
    opacity: 0.9,
    marginBottom: 10,
  },
});

type Phase = "loading" | "streaming_free" | "paywall" | "streaming_paid" | "complete" | "error";

export default function ReadingScreen() {
  const insets = useSafeAreaInsets();
  const { state, appendFreeReading, appendPaidReading, appendArchetype, setReadingComplete, resetAll } = useOracle();
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const hasStarted = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const getApiUrl = () => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (domain) return `https://${domain}/`;
    return "/";
  };

  const buildFormData = () => {
    const fd = new FormData();
    const ud = { ...state.userData };
    fd.append("userData", JSON.stringify(ud));
    fd.append("sessionId", state.sessionId);

    for (const [key, img] of Object.entries(state.images)) {
      if (img?.uri) {
        const ext = img.uri.split(".").pop() ?? "jpg";
        fd.append(key, {
          uri: img.uri,
          name: `${key}.${ext}`,
          type: `image/${ext === "jpg" ? "jpeg" : ext}`,
        } as unknown as Blob);
      }
    }
    return fd;
  };

  const streamFreeReading = async () => {
    setPhase("streaming_free");
    const baseUrl = getApiUrl();

    try {
      const fd = buildFormData();
      const response = await fetch(`${baseUrl}api/generate`, {
        method: "POST",
        body: fd,
        headers: { Accept: "text/event-stream" },
      });

      if (!response.ok) throw new Error("API error");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          try {
            const parsed = JSON.parse(raw);
            if (parsed.event === "error") {
              setErrorMsg(parsed.message ?? "The Oracle is temporarily unavailable.");
              setPhase("error");
              return;
            }
            if (parsed.event === "paywall") {
              setPhase("paywall");
              return;
            }
            if (parsed.chunk) {
              appendFreeReading(parsed.chunk);
              scrollRef.current?.scrollToEnd({ animated: true });
            }
          } catch {}
        }
      }
      // If stream ended without paywall event, still show paywall
      setPhase("paywall");
    } catch (err) {
      setErrorMsg("The Oracle is temporarily unavailable. Please try again.");
      setPhase("error");
    }
  };

  const streamPaidReading = async () => {
    setPhase("streaming_paid");
    const baseUrl = getApiUrl();

    try {
      const fd = buildFormData();
      fd.append("devBypass", "true");

      const response = await fetch(`${baseUrl}api/generate/continue`, {
        method: "POST",
        body: fd,
        headers: { Accept: "text/event-stream" },
      });

      if (!response.ok) throw new Error("API error");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          try {
            const parsed = JSON.parse(raw);
            if (parsed.event === "error") {
              setErrorMsg(parsed.message ?? "The Oracle is temporarily unavailable.");
              setPhase("error");
              return;
            }
            if (parsed.event === "complete") {
              setReadingComplete(true);
              setPhase("complete");
              if (Platform.OS !== "web") {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              return;
            }
            if (parsed.chunk) {
              if (parsed.section === "archetype") {
                appendArchetype(parsed.chunk);
              } else {
                appendPaidReading(parsed.chunk);
              }
              scrollRef.current?.scrollToEnd({ animated: true });
            }
          } catch {}
        }
      }
      setReadingComplete(true);
      setPhase("complete");
    } catch (err) {
      setErrorMsg("The Oracle must rest. Please return in a few minutes.");
      setPhase("error");
    }
  };

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      streamFreeReading();
    }
  }, []);

  const hasContent = state.freeReading.length > 0;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      {/* Header */}
      {hasContent && (
        <View style={styles.header}>
          <Pressable onPress={() => router.replace("/intake")} style={styles.backBtn} hitSlop={12}>
            <Feather name="arrow-left" size={20} color={Colors.gold} />
          </Pressable>
          <Text style={styles.headerTitle}>Your Reading</Text>
          <View style={{ width: 44 }} />
        </View>
      )}

      {phase === "loading" ? (
        <LoadingView />
      ) : phase === "error" ? (
        <View style={styles.errorContainer}>
          <Feather name="moon" size={40} color={Colors.muted} />
          <Text style={styles.errorTitle}>The Oracle is resting.</Text>
          <Text style={styles.errorMsg}>{errorMsg}</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => {
              hasStarted.current = false;
              setPhase("loading");
              streamFreeReading();
            }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Reading title */}
          <Animated.View entering={FadeIn.duration(800)} style={styles.titleBlock}>
            <GoldSigil size={60} style={{ alignSelf: "center", marginBottom: 12 }} />
            <Text style={styles.readingTitle}>YOUR ORACLE READING</Text>
            <Text style={styles.readingName}>{state.userData.name}</Text>
          </Animated.View>

          {/* Free sections */}
          {state.freeReading.length > 0 && (
            <ReadingSection text={state.freeReading} />
          )}

          {/* Streaming indicator */}
          {phase === "streaming_free" && state.freeReading.length > 0 && (
            <View style={styles.streamingDots}>
              <Text style={styles.streamingText}>The Oracle speaks...</Text>
            </View>
          )}

          {/* Paywall */}
          {phase === "paywall" && (
            <PaywallGate onUnlock={streamPaidReading} />
          )}

          {/* Paid sections */}
          {(phase === "streaming_paid" || phase === "complete") && state.paidReading.length > 0 && (
            <>
              <Text style={sectionStyles.divider}>─── ✦ ───</Text>
              <ReadingSection text={state.paidReading} />
            </>
          )}

          {/* Streaming paid indicator */}
          {phase === "streaming_paid" && (
            <View style={styles.streamingDots}>
              <Text style={styles.streamingText}>The depths open...</Text>
            </View>
          )}

          {/* Archetype */}
          {state.archetypeReading.length > 0 && (
            <>
              <Text style={sectionStyles.divider}>─── ✦ ───</Text>
              <View style={styles.archetypeCard}>
                <ReadingSection text={state.archetypeReading} />
              </View>
            </>
          )}

          {/* Complete — chat CTA */}
          {phase === "complete" && (
            <Animated.View entering={FadeIn.duration(800)} style={styles.completeCta}>
              <Text style={styles.completeTitle}>Your reading is complete.</Text>
              <Text style={styles.completeDivider}>─── ✦ ───</Text>

              {/* Share */}
              <Pressable
                style={styles.shareBtn}
                onPress={async () => {
                  const archetype = state.archetypeReading.match(/✦ YOUR ARCHETYPE[^\n]*\n([^\n]+)/)?.[1] ?? "The Oracle";
                  try {
                    await Share.share({
                      message: `My Oracle archetype: ${archetype.trim()}. Discover yours at theoracle.app`,
                    });
                  } catch {}
                }}
              >
                <Feather name="share-2" size={16} color={Colors.gold} />
                <Text style={styles.shareText}>Share your archetype</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.85 }]}
                onPress={() => router.push("/chat")}
              >
                <Feather name="message-circle" size={18} color={Colors.bg} />
                <Text style={styles.chatBtnText}>Ask The Oracle a Question</Text>
              </Pressable>

              <View style={styles.endDivider}>
                <View style={styles.endDividerLine} />
                <Text style={styles.endDividerText}>✦</Text>
                <View style={styles.endDividerLine} />
              </View>

              <Pressable
                style={({ pressed }) => [styles.newReadingBtn, pressed && { opacity: 0.75 }]}
                onPress={() => {
                  resetAll();
                  router.replace("/");
                }}
              >
                <Feather name="refresh-cw" size={15} color={Colors.muted} />
                <Text style={styles.newReadingText}>Begin a New Reading</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 13,
    color: Colors.cream,
    letterSpacing: 1,
  },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 16,
    gap: 20,
  },
  titleBlock: {
    alignItems: "center",
    marginBottom: 8,
  },
  readingTitle: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 13,
    color: Colors.gold,
    letterSpacing: 3,
    textAlign: "center",
  },
  readingName: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 16,
    color: Colors.muted,
    textAlign: "center",
    marginTop: 4,
  },
  streamingDots: {
    alignItems: "center",
    paddingVertical: 8,
  },
  streamingText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    color: Colors.gold,
    opacity: 0.7,
  },
  archetypeCard: {
    backgroundColor: "rgba(201,168,76,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    padding: 20,
  },
  completeCta: {
    alignItems: "center",
    gap: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  completeTitle: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 15,
    color: Colors.cream,
    letterSpacing: 1,
    textAlign: "center",
  },
  completeDivider: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 12,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 4,
    opacity: 0.5,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  shareText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 15,
    color: Colors.gold,
  },
  chatBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    width: "100%",
    justifyContent: "center",
  },
  chatBtnText: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 13,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 16,
    color: Colors.cream,
    textAlign: "center",
  },
  errorMsg: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 15,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 24,
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  retryText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 15,
    color: Colors.gold,
  },
  endDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    marginVertical: 4,
  },
  endDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(107,107,138,0.25)",
  },
  endDividerText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 12,
    color: Colors.muted,
    opacity: 0.6,
  },
  newReadingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 44,
  },
  newReadingText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 15,
    color: Colors.muted,
  },
});
