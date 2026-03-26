import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Share,
  TextInput,
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
import { useOracle, DeepDiveCategory } from "@/context/OracleContext";
import { useProfiles } from "@/context/ProfileContext";

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

function OracleActivationCard({
  onConfirm,
  initialQ1 = "",
  initialQ2 = "",
  initialQ3 = "",
}: {
  onConfirm: (q1: string, q2: string, q3: string) => void;
  initialQ1?: string;
  initialQ2?: string;
  initialQ3?: string;
}) {
  const [q1, setQ1] = useState(initialQ1);
  const [q2, setQ2] = useState(initialQ2);
  const [q3, setQ3] = useState(initialQ3);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <Animated.View entering={FadeIn.duration(800)} style={activationStyles.card}>
      <Text style={activationStyles.title}>Awaken the Oracle</Text>
      <Text style={activationStyles.subtitle}>
        The Oracle seeks your questions to illuminate your path.
      </Text>
      <Text style={activationStyles.divider}>─── ✦ ───</Text>

      <View style={activationStyles.fieldGroup}>
        <Text style={activationStyles.fieldLabel}>What do you most want to understand?</Text>
        <TextInput
          value={q1}
          onChangeText={setQ1}
          placeholder="Speak your truth..."
          placeholderTextColor={Colors.muted}
          multiline
          style={[
            activationStyles.input,
            focusedField === "q1" && activationStyles.inputFocused,
          ]}
          onFocus={() => setFocusedField("q1")}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      <View style={activationStyles.fieldGroup}>
        <Text style={activationStyles.fieldLabel}>What pattern keeps repeating in your life?</Text>
        <TextInput
          value={q2}
          onChangeText={setQ2}
          placeholder="The Oracle listens..."
          placeholderTextColor={Colors.muted}
          multiline
          style={[
            activationStyles.input,
            focusedField === "q2" && activationStyles.inputFocused,
          ]}
          onFocus={() => setFocusedField("q2")}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      <View style={activationStyles.fieldGroup}>
        <Text style={activationStyles.fieldLabel}>What decision are you approaching?</Text>
        <TextInput
          value={q3}
          onChangeText={setQ3}
          placeholder="Name the crossroads..."
          placeholderTextColor={Colors.muted}
          multiline
          style={[
            activationStyles.input,
            focusedField === "q3" && activationStyles.inputFocused,
          ]}
          onFocus={() => setFocusedField("q3")}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      <Pressable
        style={({ pressed }) => [activationStyles.confirmBtn, pressed && { opacity: 0.85 }]}
        onPress={() => onConfirm(q1, q2, q3)}
      >
        <Text style={activationStyles.confirmText}>Awaken the Oracle</Text>
      </Pressable>

      <Pressable
        style={activationStyles.skipBtn}
        onPress={() => onConfirm("", "", "")}
      >
        <Text style={activationStyles.skipText}>Continue without questions</Text>
      </Pressable>
    </Animated.View>
  );
}

const activationStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.35)",
    gap: 16,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  title: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 18,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 15,
    color: Colors.cream,
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.85,
  },
  divider: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 13,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 4,
    opacity: 0.5,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 14,
    color: Colors.cream,
    opacity: 0.75,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "EBGaramond_400Regular",
    fontSize: 15,
    color: Colors.cream,
    minHeight: 64,
    textAlignVertical: "top",
  },
  inputFocused: {
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  confirmBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  confirmText: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 13,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 13,
    color: Colors.muted,
  },
});

type Phase = "loading" | "streaming_free" | "paywall" | "streaming_paid" | "complete" | "error";

export default function ReadingScreen() {
  const insets = useSafeAreaInsets();
  const { state, updateUserData, appendFreeReading, appendPaidReading, appendArchetype, appendChineseFaceReading, appendIridologyReading, setReadingComplete, resetAll } = useOracle();
  const { profiles, updateProfile } = useProfiles();
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [activationDismissed, setActivationDismissed] = useState(false);
  const hasStarted = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const initiallyNeedsActivation = useRef(
    !state.userData.q1.trim() || !state.userData.q2.trim() || !state.userData.q3.trim()
  );

  const needsActivation =
    !activationDismissed && initiallyNeedsActivation.current;

  const handleActivationConfirm = (q1: string, q2: string, q3: string) => {
    updateUserData({ q1: q1.trim(), q2: q2.trim(), q3: q3.trim() });
    setActivationDismissed(true);
  };

  const saveReadingToVault = async (fullReading: string) => {
    const { name, dob } = state.userData;
    if (!name || !dob) return;
    const profile = profiles.find(
      p => p.name.trim().toLowerCase() === name.trim().toLowerCase() && p.dob === dob
    );
    if (profile) {
      await updateProfile(profile.id, { mainReading: fullReading });
    }
  };

  const getApiUrl = () => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (domain) return `https://${domain}/`;
    return "/";
  };

  const buildJsonRequest = (extra: Record<string, string> = {}): { body: string; headers: Record<string, string> } => ({
    body: JSON.stringify({ userData: JSON.stringify(state.userData), sessionId: state.sessionId, ...extra }),
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
  });

  const buildRequest = (extra: Record<string, string> = {}): { body: FormData | string; headers: Record<string, string> } => {
    if (Platform.OS === "web") return buildJsonRequest(extra);
    // Native: send FormData with image files
    const fd = new FormData();
    fd.append("userData", JSON.stringify(state.userData));
    fd.append("sessionId", state.sessionId);
    for (const [k, v] of Object.entries(extra)) fd.append(k, v);
    for (const [key, img] of Object.entries(state.images)) {
      if (img?.uri) {
        const ext = img.uri.split(".").pop()?.replace("jpeg", "jpg") ?? "jpg";
        fd.append(key, { uri: img.uri, name: `${key}.${ext}`, type: `image/jpeg` } as unknown as Blob);
      }
    }
    return { body: fd, headers: { Accept: "text/event-stream" } };
  };

  // Tries FormData (native) then falls back to JSON if file URIs are stale
  const doFetch = async (url: string, extra: Record<string, string> = {}): Promise<Response> => {
    const { body, headers } = buildRequest(extra);
    try {
      return await fetch(url, { method: "POST", body, headers });
    } catch (fetchErr) {
      if (Platform.OS !== "web") {
        const json = buildJsonRequest(extra);
        return await fetch(url, { method: "POST", body: json.body, headers: json.headers });
      }
      throw fetchErr;
    }
  };

  const streamFreeReading = async () => {
    setPhase("streaming_free");
    const baseUrl = getApiUrl();

    try {
      const response = await doFetch(`${baseUrl}api/generate`);

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
      const isNetwork = err instanceof TypeError || String(err).includes("fetch");
      setErrorMsg(
        isNetwork
          ? "The connection to the Oracle was severed. Check your network and try again."
          : "A veil fell between you and the Oracle. The signal was lost."
      );
      setPhase("error");
    }
  };

  const streamPaidReading = async () => {
    setPhase("streaming_paid");
    const baseUrl = getApiUrl();

    try {
      const response = await doFetch(`${baseUrl}api/generate/continue`, { devBypass: "true" });

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
              } else if (parsed.section === "chinese_face") {
                appendChineseFaceReading(parsed.chunk);
              } else if (parsed.section === "iridology") {
                appendIridologyReading(parsed.chunk);
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
      const isNetwork = err instanceof TypeError || String(err).includes("fetch");
      setErrorMsg(
        isNetwork
          ? "The thread was cut before the full vision could be delivered. Check your network."
          : "The Oracle's vision was interrupted. The second sight requires stillness — try again."
      );
      setPhase("error");
    }
  };

  useEffect(() => {
    if (initiallyNeedsActivation.current && !activationDismissed) {
      return;
    }
    if (!hasStarted.current) {
      hasStarted.current = true;
      streamFreeReading();
    }
  }, [activationDismissed]);

  useEffect(() => {
    if (phase === "complete") {
      const fullReading = [
        state.freeReading,
        state.paidReading,
        state.archetypeReading,
        state.chineseFaceReading,
        state.iridologyReading,
      ].filter(Boolean).join("\n\n");
      saveReadingToVault(fullReading);
    }
  }, [phase]);

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

      {phase === "loading" && needsActivation ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <OracleActivationCard
            onConfirm={handleActivationConfirm}
            initialQ1={state.userData.q1}
            initialQ2={state.userData.q2}
            initialQ3={state.userData.q3}
          />
        </ScrollView>
      ) : phase === "loading" ? (
        <LoadingView />
      ) : phase === "error" ? (
        <Animated.View entering={FadeIn.duration(600)} style={styles.errorContainer}>
          <GoldSigil size={80} style={{ opacity: 0.3 }} />
          <Text style={styles.errorTitle}>The Oracle Fell Silent</Text>
          <Text style={styles.errorDivider}>─── ✦ ───</Text>
          <Text style={styles.errorMsg}>{errorMsg}</Text>
          <View style={styles.errorActions}>
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
            <Pressable style={styles.errorBackBtn} onPress={() => router.back()}>
              <Text style={styles.errorBackText}>Return</Text>
            </Pressable>
          </View>
        </Animated.View>
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

          {/* Chinese Face Reading */}
          {state.chineseFaceReading.length > 0 && (
            <>
              <Text style={sectionStyles.divider}>─── ✦ ───</Text>
              <View style={styles.specialReadingCard}>
                <View style={styles.specialReadingHeader}>
                  <Text style={styles.specialReadingBadge}>Chinese Face Reading · 面相</Text>
                </View>
                <ReadingSection text={state.chineseFaceReading} />
              </View>
            </>
          )}

          {/* Streaming chinese face indicator */}
          {phase === "streaming_paid" && state.chineseFaceReading.length > 0 && state.iridologyReading.length === 0 && (
            <View style={styles.streamingDots}>
              <Text style={styles.streamingText}>Reading the face of destiny...</Text>
            </View>
          )}

          {/* Iridology Health Reading */}
          {state.iridologyReading.length > 0 && (
            <>
              <Text style={sectionStyles.divider}>─── ✦ ───</Text>
              <View style={styles.specialReadingCard}>
                <View style={styles.specialReadingHeader}>
                  <Text style={styles.specialReadingBadge}>Iridology Health Reading</Text>
                </View>
                <ReadingSection text={state.iridologyReading} />
              </View>
            </>
          )}

          {/* Streaming iridology indicator */}
          {phase === "streaming_paid" && state.iridologyReading.length > 0 && (
            <View style={styles.streamingDots}>
              <Text style={styles.streamingText}>Reading the iris of the soul...</Text>
            </View>
          )}

          {/* Complete — Deep Dive + chat CTA */}
          {phase === "complete" && (
            <Animated.View entering={FadeIn.duration(800)} style={styles.completeCta}>
              <Text style={styles.completeTitle}>Your reading is complete.</Text>
              <Text style={styles.completeDivider}>─── ✦ ───</Text>

              {/* Deep Dive Section */}
              <Animated.View entering={FadeIn.duration(600).delay(200)} style={styles.deepDiveSection}>
                <Text style={styles.deepDiveTitle}>Explore Further</Text>
                <Text style={styles.deepDiveSubtitle}>
                  Select a life area for a targeted Oracle reading woven from your profile.
                </Text>
                <View style={styles.deepDiveGrid}>
                  {(["career", "relationship", "finances", "fitness", "family"] as DeepDiveCategory[]).map((cat) => {
                    type FeatherName = React.ComponentProps<typeof Feather>["name"];
                    const ICONS: Record<DeepDiveCategory, FeatherName> = {
                      career: "briefcase",
                      relationship: "heart",
                      finances: "trending-up",
                      fitness: "activity",
                      family: "users",
                    };
                    const LABELS: Record<DeepDiveCategory, string> = {
                      career: "Career",
                      relationship: "Relationship",
                      finances: "Finances",
                      fitness: "Fitness",
                      family: "Family",
                    };
                    const hasDive = (state.deepDives[cat]?.length ?? 0) > 0;
                    return (
                      <Pressable
                        key={cat}
                        style={({ pressed }) => [
                          styles.deepDiveCard,
                          hasDive && styles.deepDiveCardDone,
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() => router.push({ pathname: "/deep-dive", params: { category: cat } })}
                      >
                        <Feather name={ICONS[cat]} size={18} color={hasDive ? Colors.bg : Colors.gold} />
                        <Text style={[styles.deepDiveCardLabel, hasDive && styles.deepDiveCardLabelDone]}>
                          {LABELS[cat]}
                        </Text>
                        {hasDive && (
                          <Feather name="check-circle" size={12} color={Colors.bg} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Summary cards for completed dives */}
                {(["career", "relationship", "finances", "fitness", "family"] as DeepDiveCategory[])
                  .filter(cat => (state.deepDives[cat]?.length ?? 0) > 0)
                  .map((cat) => {
                    const LABELS: Record<DeepDiveCategory, string> = {
                      career: "Career",
                      relationship: "Relationship",
                      finances: "Finances",
                      fitness: "Fitness",
                      family: "Family",
                    };
                    const text = state.deepDives[cat] ?? "";
                    const firstSentence = text.replace(/✦[^\n]*\n?/g, "").trim().split(/[.!?]/)[0]?.trim() ?? "";
                    const excerpt = firstSentence.length > 0 ? firstSentence + "." : text.substring(0, 120) + "…";
                    return (
                      <Animated.View key={cat} entering={FadeIn.duration(400)} style={styles.deepDiveSummaryCard}>
                        <View style={styles.deepDiveSummaryHeader}>
                          <Text style={styles.deepDiveSummaryLabel}>{LABELS[cat]}</Text>
                          <Feather name="check" size={12} color={Colors.gold} />
                        </View>
                        <Text style={styles.deepDiveSummaryExcerpt} numberOfLines={2}>{excerpt}</Text>
                        <Pressable
                          style={({ pressed }) => [styles.deepDiveSummaryBtn, pressed && { opacity: 0.75 }]}
                          onPress={() => router.push({ pathname: "/deep-dive", params: { category: cat } })}
                        >
                          <Text style={styles.deepDiveSummaryBtnText}>Re-read</Text>
                          <Feather name="arrow-right" size={12} color={Colors.gold} />
                        </Pressable>
                      </Animated.View>
                    );
                  })
                }
              </Animated.View>

              <View style={styles.endDivider}>
                <View style={styles.endDividerLine} />
                <Text style={styles.endDividerText}>✦</Text>
                <View style={styles.endDividerLine} />
              </View>

              {/* Share */}
              <Pressable
                style={styles.shareBtn}
                onPress={async () => {
                  const archetype = state.archetypeReading.match(/✦ YOUR ARCHETYPE\s*—\s*([^\n]+)/)?.[1] ?? "your archetype";
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
  specialReadingCard: {
    backgroundColor: "rgba(107,107,138,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.15)",
    padding: 20,
    gap: 12,
  },
  specialReadingHeader: {
    alignItems: "center",
    marginBottom: 4,
  },
  specialReadingBadge: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 10,
    color: Colors.gold,
    letterSpacing: 1,
    textAlign: "center",
    opacity: 0.85,
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
    paddingHorizontal: 36,
    gap: 14,
  },
  errorTitle: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 17,
    color: Colors.cream,
    textAlign: "center",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  errorDivider: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    letterSpacing: 4,
  },
  errorActions: {
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    width: "100%",
  },
  errorBackBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  errorBackText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    letterSpacing: 0.5,
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
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: "center",
    width: "100%",
  },
  retryText: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 13,
    color: Colors.gold,
    letterSpacing: 0.5,
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
  deepDiveSection: {
    width: "100%",
    gap: 12,
  },
  deepDiveTitle: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 15,
    color: Colors.gold,
    letterSpacing: 1,
    textAlign: "center",
  },
  deepDiveSubtitle: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  deepDiveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  deepDiveCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.3)",
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(201,168,76,0.05)",
  },
  deepDiveCardDone: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  deepDiveCardLabel: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 14,
    color: Colors.cream,
  },
  deepDiveCardLabelDone: {
    color: Colors.bg,
  },
  deepDiveSummaryCard: {
    width: "100%",
    backgroundColor: "rgba(201,168,76,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    padding: 16,
    gap: 8,
  },
  deepDiveSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deepDiveSummaryLabel: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 11,
    color: Colors.gold,
    letterSpacing: 1,
  },
  deepDiveSummaryExcerpt: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    color: Colors.cream,
    opacity: 0.8,
    lineHeight: 22,
  },
  deepDiveSummaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
  },
  deepDiveSummaryBtnText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 13,
    color: Colors.gold,
  },
});
