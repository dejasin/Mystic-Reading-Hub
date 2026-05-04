import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
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
import type { PurchasesPackage } from "react-native-purchases";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import { safeOpenURL } from "@/lib/safeOpenURL";
import StarField from "@/components/StarField";
import GoldSigil from "@/components/GoldSigil";
import ExpandableParagraph from "@/components/ExpandableParagraph";
import ShareCardModal, { extractArchetypeData } from "@/components/ShareCardModal";
import { useOracle, DeepDiveCategory } from "@/context/OracleContext";
import { useProfiles } from "@/context/ProfileContext";
import { useJournal } from "@/context/JournalContext";
import { useSubscription } from "@/lib/revenuecat";
import { maybeRequestReview } from "@/lib/storeReview";
import { trackEvent, trackFunnelStep, AnalyticsEvent } from "@/lib/analytics";
import { hasBeenPromptedForNotifications, requestAndRegisterNotifications } from "@/lib/notifications";
import { getApiUrl } from "@/lib/api";

const LOADING_MESSAGES = [
  "Capturing your biometric signal...",
  "Reading your behavioral patterns...",
  "Tracing your unique profile...",
  "Synthesizing your personal blueprint...",
  "Oracle is preparing your insights...",
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
  const { offerings, isLoading, purchase, isPurchasing, restore, isRestoring, isConfigured } = useSubscription();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
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

  const currentOffering = offerings?.current;
  const availablePackages: PurchasesPackage[] = currentOffering?.availablePackages ?? [];

  const annualPackage: PurchasesPackage | undefined =
    availablePackages.find((p) => p.packageType === "ANNUAL") ??
    availablePackages.find((p) => /annual|yearly|year/i.test(p.product?.identifier ?? ""));
  const monthlyPackage: PurchasesPackage | undefined =
    availablePackages.find((p) => p.packageType === "MONTHLY") ??
    availablePackages.find((p) => /monthly|month/i.test(p.product?.identifier ?? ""));

  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly">("annual");

  const packageToPurchase =
    selectedPlan === "annual"
      ? (annualPackage ?? monthlyPackage ?? availablePackages[0])
      : (monthlyPackage ?? annualPackage ?? availablePackages[0]);

  // Apple requires the displayed price to come from StoreKit — never hard
  // code a fallback like "$9.99". When the package hasn't loaded yet we
  // render a skeleton instead and keep the purchase button disabled.
  const priceString = packageToPurchase?.product.priceString ?? null;
  const annualPriceString = annualPackage?.product.priceString ?? null;
  const monthlyPriceString = monthlyPackage?.product.priceString ?? null;
  const purchasesAvailable =
    isConfigured && !!packageToPurchase && !!priceString;

  const handlePurchase = async () => {
    if (!packageToPurchase) return;
    setErrorMsg(null);
    trackEvent(AnalyticsEvent.PAYWALL_PURCHASE_TAPPED, { price: priceString ?? "unknown" });
    try {
      await purchase(packageToPurchase);
      trackFunnelStep("purchase", { price: priceString ?? "unknown" });
      onUnlock();
    } catch (e: any) {
      if (e?.userCancelled) {
        trackEvent(AnalyticsEvent.PAYWALL_DISMISSED);
        return;
      }
      trackEvent(AnalyticsEvent.PAYWALL_PURCHASE_FAILED);
      setErrorMsg("Purchase failed. Please try again.");
    }
  };

  const handleRestore = async () => {
    if (!isConfigured) return;
    setErrorMsg(null);
    trackEvent(AnalyticsEvent.PAYWALL_RESTORE_TAPPED);
    try {
      const info = await restore();
      if (info?.entitlements?.active?.["full_reading"]) {
        trackEvent(AnalyticsEvent.PAYWALL_RESTORE_COMPLETED, { success: true });
        onUnlock();
      } else {
        trackEvent(AnalyticsEvent.PAYWALL_RESTORE_COMPLETED, { success: false });
        setErrorMsg("No previous purchase found for this account.");
      }
    } catch {
      setErrorMsg("Restore failed. Please try again.");
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(800)} style={paywallStyles.card}>
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={paywallStyles.modalOverlay}>
          <View style={paywallStyles.modalCard}>
            <Text style={paywallStyles.modalTitle}>Confirm Subscription</Text>
            <Text style={paywallStyles.modalBody}>
              {selectedPlan === "annual"
                ? `Subscribe to Oracle Pro Annual for ${annualPriceString ?? ""}/year?\n\nAuto-renews annually. Cancel anytime in Settings → Apple ID → Subscriptions.`
                : `Subscribe to Oracle Pro Monthly for ${monthlyPriceString ?? ""}/month?\n\nAuto-renews monthly. Cancel anytime in Settings → Apple ID → Subscriptions.`}
            </Text>
            <View style={paywallStyles.modalBtns}>
              <Pressable
                style={paywallStyles.modalCancelBtn}
                onPress={() => setShowConfirm(false)}
                accessibilityLabel="Cancel purchase"
                accessibilityRole="button"
              >
                <Text style={paywallStyles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={paywallStyles.modalConfirmBtn}
                onPress={() => {
                  setShowConfirm(false);
                  handlePurchase();
                }}
                accessibilityLabel={`Confirm purchase for ${priceString ?? ""}`}
                accessibilityRole="button"
              >
                <Text style={paywallStyles.modalConfirmText}>Purchase</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Text style={paywallStyles.title}>There is more to map.</Text>
      <Text style={paywallStyles.cliffhanger}>
        Your behavioral profile points to a pattern worth examining. The full session and ongoing advisor chats help you turn that pattern into a clearer next step — without telling you what will happen.
      </Text>
      <Text style={paywallStyles.divider}>─── ✦ ───</Text>
      <Text style={paywallStyles.pitch}>
        Unlock your complete session — 4 remaining sections + your Archetype + Oracle Chat access.
      </Text>
      <View style={paywallStyles.benefitList}>
        {[
          "Complete behavioral profile across all dimensions",
          "Unlimited AI advisor conversations",
          "Relationship dynamics, deep dives, and daily reflections",
        ].map((benefit) => (
          <View key={benefit} style={paywallStyles.benefitRow}>
            <Feather name="check" size={14} color={Colors.gold} />
            <Text style={paywallStyles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>
      <View style={paywallStyles.planList}>
        {isLoading ? (
          <ActivityIndicator color={Colors.gold} />
        ) : (
          <>
            <Pressable
              onPress={() => annualPackage && setSelectedPlan("annual")}
              disabled={!annualPackage}
              style={[
                paywallStyles.planCard,
                selectedPlan === "annual" && paywallStyles.planCardSelected,
                !annualPackage && paywallStyles.planCardDisabled,
              ]}
              accessibilityLabel={annualPriceString ? `Annual plan ${annualPriceString} per year` : "Annual plan, price loading"}
              accessibilityRole="button"
              accessibilityState={{ disabled: !annualPackage, selected: selectedPlan === "annual" }}
            >
              <View style={paywallStyles.planHeaderRow}>
                <Text style={paywallStyles.planLabel}>Annual</Text>
                <View style={paywallStyles.savePill}>
                  <Text style={paywallStyles.savePillText}>Save 58%</Text>
                </View>
              </View>
              {annualPriceString ? (
                <Text style={paywallStyles.planPrice}>{annualPriceString}/yr</Text>
              ) : (
                <View style={paywallStyles.priceSkeleton} accessibilityLabel="Loading annual price" />
              )}
              <Text style={paywallStyles.planSub}>Full Session + Chat Access · best value</Text>
            </Pressable>

            <Pressable
              onPress={() => monthlyPackage && setSelectedPlan("monthly")}
              disabled={!monthlyPackage}
              style={[
                paywallStyles.planCard,
                selectedPlan === "monthly" && paywallStyles.planCardSelected,
                !monthlyPackage && paywallStyles.planCardDisabled,
              ]}
              accessibilityLabel={monthlyPriceString ? `Monthly plan ${monthlyPriceString} per month` : "Monthly plan, price loading"}
              accessibilityRole="button"
              accessibilityState={{ disabled: !monthlyPackage, selected: selectedPlan === "monthly" }}
            >
              <View style={paywallStyles.planHeaderRow}>
                <Text style={paywallStyles.planLabel}>Monthly</Text>
              </View>
              {monthlyPriceString ? (
                <Text style={paywallStyles.planPrice}>{monthlyPriceString}/mo</Text>
              ) : (
                <View style={paywallStyles.priceSkeleton} accessibilityLabel="Loading monthly price" />
              )}
              <Text style={paywallStyles.planSub}>Full Session + Chat Access</Text>
            </Pressable>

            <Text style={paywallStyles.subTerms}>
              {selectedPlan === "annual"
                ? "Auto-renews annually. Cancel anytime in Settings → Apple ID → Subscriptions."
                : "Auto-renews monthly. Cancel anytime in Settings → Apple ID → Subscriptions."}
            </Text>
          </>
        )}
      </View>

      {errorMsg && (
        <Text style={paywallStyles.errorText}>{errorMsg}</Text>
      )}

      <Animated.View style={[paywallStyles.unlockWrapper, glowStyle, !purchasesAvailable && { opacity: 0.5 }]}>
        <Pressable
          style={({ pressed }) => [paywallStyles.unlockBtn, (pressed || isPurchasing) && { opacity: 0.85 }]}
          onPress={() => setShowConfirm(true)}
          disabled={isPurchasing || isLoading || !purchasesAvailable}
          accessibilityLabel={priceString ? `Unlock Full Session for ${priceString}` : "Unlock Full Session"}
          accessibilityRole="button"
        >
          {isPurchasing ? (
            <ActivityIndicator color={Colors.bg} size="small" />
          ) : (
            <>
              <Feather name="unlock" size={18} color={Colors.bg} />
              <Text style={paywallStyles.unlockText}>Unlock Full Session</Text>
            </>
          )}
        </Pressable>
      </Animated.View>

      {!isConfigured && !isLoading && (
        <Text style={paywallStyles.errorText}>Payments are not available right now.</Text>
      )}

      <Pressable
        style={paywallStyles.restoreBtn}
        onPress={handleRestore}
        disabled={isRestoring || !isConfigured}
        accessibilityLabel="Restore Purchase"
        accessibilityRole="button"
      >
        {isRestoring ? (
          <ActivityIndicator color={Colors.muted} size="small" />
        ) : (
          <Text style={paywallStyles.restoreBtnText}>Restore Purchase</Text>
        )}
      </Pressable>

      <View style={paywallStyles.legalRow}>
        <Pressable onPress={() => safeOpenURL("https://theoracle.app/api/terms")} accessibilityLabel="Terms of Use" accessibilityRole="link">
          <Text style={paywallStyles.legalLink}>Terms of Use</Text>
        </Pressable>
        <Text style={paywallStyles.legalSep}> · </Text>
        <Pressable onPress={() => safeOpenURL("https://theoracle.app/api/privacy")} accessibilityLabel="Privacy Policy" accessibilityRole="link">
          <Text style={paywallStyles.legalLink}>Privacy Policy</Text>
        </Pressable>
      </View>

      {__DEV__ && (
        <Pressable
          style={paywallStyles.devSkipBtn}
          onPress={onUnlock}
          accessibilityLabel="Skip payment (testing only)"
        >
          <Text style={paywallStyles.devSkipText}>Skip Payment (Dev)</Text>
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
    fontFamily: "CormorantGaramond_700Bold",
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
  benefitList: {
    gap: 8,
    marginTop: 4,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  benefitText: {
    flex: 1,
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.cream,
    opacity: 0.9,
  },
  planList: {
    gap: 10,
  },
  planCard: {
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.25)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(201,168,76,0.04)",
    gap: 4,
  },
  planCardSelected: {
    borderColor: Colors.gold,
    backgroundColor: "rgba(201,168,76,0.10)",
    borderWidth: 2,
  },
  planCardDisabled: {
    opacity: 0.5,
  },
  priceSkeleton: {
    height: 26,
    width: 110,
    borderRadius: 6,
    backgroundColor: "rgba(201,168,76,0.18)",
    marginVertical: 2,
  },
  planHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planLabel: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 16,
    color: Colors.cream,
    letterSpacing: 1,
  },
  savePill: {
    backgroundColor: Colors.gold,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  savePillText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 11,
    color: Colors.bg,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  planPrice: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 22,
    color: Colors.gold,
  },
  planSub: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 12,
    color: Colors.muted,
  },
  subTerms: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 11,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
    opacity: 0.7,
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
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 13,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  errorText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 13,
    color: "#ff6b6b",
    textAlign: "center",
  },
  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  restoreBtnText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.3)",
  },
  modalTitle: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 16,
    color: Colors.gold,
    textAlign: "center",
  },
  modalBody: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 15,
    color: Colors.cream,
    textAlign: "center",
    lineHeight: 24,
  },
  modalBtns: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.muted,
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalConfirmText: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 12,
    color: Colors.bg,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  legalLink: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 12,
    color: Colors.muted,
    textDecorationLine: "underline",
  },
  legalSep: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 12,
    color: Colors.muted,
  },
  devSkipBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#7fdfb0",
    borderRadius: 8,
    backgroundColor: "rgba(127,223,176,0.07)",
  },
  devSkipText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 13,
    color: "#7fdfb0",
    letterSpacing: 0.3,
  },
});

interface ReadingSectionProps {
  text: string;
  sessionId?: string;
  userData?: string;
  // Task #64 — forwarded to ExpandableParagraph so /api/expand receives
  // the same behavioral context as the rest of the reading flow.
  questionnaireAnswers?: unknown;
  isSubscribed?: boolean;
  parentScrollRef?: React.RefObject<ScrollView | null>;
  parentScrollOffset?: React.MutableRefObject<number>;
}

function ReadingSection({ text, sessionId, userData, questionnaireAnswers, isSubscribed, parentScrollRef, parentScrollOffset }: ReadingSectionProps) {
  if (!text) return null;
  const sections = text.split(/(?=✦\s)/);
  return (
    <>
      {sections.map((section, i) => {
        if (!section.trim()) return null;
        const lines = section.trim().split("\n");
        const heading = lines[0].startsWith("✦") ? lines[0] : null;
        const body = heading ? lines.slice(1).join("\n").trim() : section.trim();
        const paragraphs = body.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
        return (
          <Animated.View key={i} entering={FadeIn.duration(600).delay(i * 100)} style={sectionStyles.container}>
            {heading && (
              <Text style={sectionStyles.heading}>{heading}</Text>
            )}
            <Text style={sectionStyles.divider}>─── ✦ ───</Text>
            {sessionId && userData ? (
              paragraphs.map((para, j) => (
                <ExpandableParagraph
                  key={j}
                  text={para}
                  sessionId={sessionId}
                  userData={userData}
                  questionnaireAnswers={questionnaireAnswers}
                  isSubscribed={isSubscribed ?? false}
                  parentScrollRef={parentScrollRef}
                  parentScrollOffset={parentScrollOffset}
                />
              ))
            ) : (
              <Text style={sectionStyles.body}>{body}</Text>
            )}
          </Animated.View>
        );
      })}
    </>
  );
}

const sectionStyles = StyleSheet.create({
  container: { marginBottom: 8 },
  heading: {
    fontFamily: "CormorantGaramond_700Bold",
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
        accessibilityLabel="Awaken the Oracle — begin session"
        accessibilityRole="button"
      >
        <Text style={activationStyles.confirmText}>Awaken the Oracle</Text>
      </Pressable>

      <Pressable
        style={activationStyles.skipBtn}
        onPress={() => onConfirm("", "", "")}
        accessibilityLabel="Continue without questions"
        accessibilityRole="button"
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
    fontFamily: "CormorantGaramond_700Bold",
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
    fontFamily: "CormorantGaramond_400Regular",
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

type Phase = "loading" | "streaming_free" | "paywall" | "streaming_paid" | "paid_interrupted" | "complete" | "error";

// Task #68 — paid stream resilience tuning. If neither a chunk nor a server
// keep-alive `ping` event arrives within this window we treat the stream as
// stalled rather than waiting for the request's 180s wall-clock abort. The
// server pings every 5s, so 15s gives us 3 missed pings before we give up.
const PAID_STREAM_STALL_MS = 15000;
const PAID_STREAM_RESUME_DIVIDER = "\n\n─── ✦ continued ✦ ───\n\n";

export default function ReadingScreen() {
  const insets = useSafeAreaInsets();
  const { state, updateUserData, appendFreeReading, appendPaidReading, appendArchetype, resetFreeReading, resetPaidReading, setReadingComplete, setBehavioralScores, resetAll } = useOracle();
  const { profiles, updateProfile } = useProfiles();
  const { addEntry: addJournalEntry } = useJournal();
  const { customerInfo } = useSubscription();
  const journalSaved = useRef(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [errorSource, setErrorSource] = useState<"free" | "paid">("free");
  const [activationDismissed, setActivationDismissed] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const hasStarted = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef<number>(0);

  const initiallyNeedsActivation = useRef(
    !(state.userData.q1 ?? "").trim() || !(state.userData.q2 ?? "").trim() || !(state.userData.q3 ?? "").trim()
  );

  const needsActivation =
    !activationDismissed && initiallyNeedsActivation.current;

  const handleActivationConfirm = (q1: string, q2: string, q3: string) => {
    updateUserData({ q1: q1.trim(), q2: q2.trim(), q3: q3.trim() });
    setActivationDismissed(true);
  };

  const saveReadingToVault = async (fullReading: string) => {
    // Task #65 — DOB is no longer collected at intake, so we anchor the
    // session to a profile via OracleState.currentProfileId (set by the
    // ritual when it auto-creates the profile, or by profile-action when
    // an existing profile starts a new session).
    const profileId = state.currentProfileId;
    if (!profileId) return;
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      // Task #64 — also persist the sessionId of this completed reading so
      // the home cards can pull recent behavioral themes for daily/weekly.
      await updateProfile(profile.id, { mainReading: fullReading, sessionId: state.sessionId });
    }
  };

  const buildJsonRequest = (extra: Record<string, string> = {}): { body: string; headers: Record<string, string> } => ({
    body: JSON.stringify({
      userData: JSON.stringify(state.userData),
      sessionId: state.sessionId,
      // Task #64 — server reads this to build behavioralContextBlock.
      // parseQuestionnaire accepts both string and object; sending the
      // object on JSON requests keeps the wire format clean.
      questionnaireAnswers: state.questionnaireAnswers,
      ...extra,
    }),
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
  });

  const buildRequest = (extra: Record<string, string> = {}): { body: FormData | string; headers: Record<string, string> } => {
    if (Platform.OS === "web") return buildJsonRequest(extra);
    // Native: send FormData with image files
    const fd = new FormData();
    fd.append("userData", JSON.stringify(state.userData));
    fd.append("sessionId", state.sessionId);
    // Task #64 — same payload on the FormData path. Multer/multipart fields
    // are always strings, so stringify here; server parseQuestionnaire
    // handles JSON-string input.
    if (state.questionnaireAnswers) {
      fd.append("questionnaireAnswers", JSON.stringify(state.questionnaireAnswers));
    }
    for (const [k, v] of Object.entries(extra)) fd.append(k, v);
    for (const [key, img] of Object.entries(state.images)) {
      if (img?.uri) {
        const ext = img.uri.split(".").pop()?.replace("jpeg", "jpg") ?? "jpg";
        fd.append(key, { uri: img.uri, name: `${key}.${ext}`, type: `image/jpeg` } as unknown as Blob);
      }
    }
    return { body: fd, headers: { Accept: "text/event-stream" } };
  };

  const doFetch = async (url: string, extra: Record<string, string> = {}, signal?: AbortSignal): Promise<Response> => {
    const { body, headers } = buildRequest(extra);
    try {
      return await fetch(url, { method: "POST", body, headers, signal });
    } catch (fetchErr) {
      if (Platform.OS !== "web" && !(signal?.aborted)) {
        const json = buildJsonRequest(extra);
        return await fetch(url, { method: "POST", body: json.body, headers: json.headers, signal });
      }
      throw fetchErr;
    }
  };

  const streamFreeReading = async () => {
    resetFreeReading();
    setPhase("streaming_free");
    trackFunnelStep("reading");
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
              setErrorSource("free");
              setPhase("error");
              return;
            }
            if (parsed.event === "paywall") {
              trackEvent(AnalyticsEvent.READING_FREE_COMPLETED);
              trackFunnelStep("paywall");
              await maybeShowPaywall();
              return;
            }
            if (parsed.event === "behavioralScores" && parsed.behavioralScores) {
              const s = parsed.behavioralScores;
              if (
                typeof s.intuition === "number" &&
                typeof s.emotionalDepth === "number" &&
                typeof s.drive === "number" &&
                typeof s.adaptability === "number" &&
                typeof s.innerKnowing === "number" &&
                typeof s.expression === "number"
              ) {
                setBehavioralScores({
                  intuition: s.intuition,
                  emotionalDepth: s.emotionalDepth,
                  drive: s.drive,
                  adaptability: s.adaptability,
                  innerKnowing: s.innerKnowing,
                  expression: s.expression,
                });
              }
              continue;
            }
            if (parsed.chunk) {
              appendFreeReading(parsed.chunk);
            }
          } catch (e) {
            console.warn("SSE parse error (free reading):", e);
          }
        }
      }

      if (buffer.trim()) {
        const remainingLines = buffer.split("\n");
        for (const rl of remainingLines) {
          const trimmed = rl.trim();
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            if (parsed.chunk) appendFreeReading(parsed.chunk);
            if (parsed.event === "paywall") {
              await maybeShowPaywall();
              return;
            }
          } catch (e) { console.warn("SSE flush parse error (free):", e); }
        }
      }

      await maybeShowPaywall();
    } catch (err) {
      const isNetwork = err instanceof TypeError || String(err).includes("fetch");
      setErrorMsg(
        isNetwork
          ? "The connection to the Oracle was severed. Check your network and try again."
          : "A veil fell between you and the Oracle. The signal was lost."
      );
      setErrorSource("free");
      setPhase("error");
    }
  };

  const PAYWALL_REVEAL_DELAY_MS = 1500;
  const maybeShowPaywall = async () => {
    const isSubscribed = !!customerInfo?.entitlements?.active?.["full_reading"];
    if (isSubscribed) {
      // Active subscriber — skip the paywall entirely; advance to paid stream.
      void streamPaidReading();
      return;
    }
    const flagKey = `oracle_paywall_shown_${state.sessionId}`;
    try {
      const alreadyShown = await AsyncStorage.getItem(flagKey);
      if (alreadyShown === "1") {
        // Already auto-shown once this session — don't show again automatically.
        // Stay on the free reveal; user can tap the bridge button to re-open.
        setPhase("complete");
        return;
      }
      await AsyncStorage.setItem(flagKey, "1");
    } catch (e) {
      console.warn("Paywall session flag persistence failed:", e);
    }
    // Let the user briefly see the completed free reveal before the paywall
    // overlay; then transition to the paywall phase.
    setPhase("complete");
    setTimeout(() => {
      setPhase("paywall");
    }, PAYWALL_REVEAL_DELAY_MS);
  };

  const fetchBehavioralScores = async () => {
    // Backup path: if the inline /api/generate scoring SSE event was missed,
    // fall back to the standalone endpoint (which itself never returns non-200).
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/behavioral-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          userData: state.userData,
          // Task #64 — behavioral-profile fallback path also receives the
          // questionnaire so the regenerated scores reflect it.
          questionnaireAnswers: state.questionnaireAnswers,
        }),
      });
      if (!response.ok) return;
      const data = await response.json();
      const s = data?.behavioralScores;
      if (
        s &&
        typeof s.intuition === "number" &&
        typeof s.emotionalDepth === "number" &&
        typeof s.drive === "number" &&
        typeof s.adaptability === "number" &&
        typeof s.innerKnowing === "number" &&
        typeof s.expression === "number"
      ) {
        setBehavioralScores({
          intuition: s.intuition,
          emotionalDepth: s.emotionalDepth,
          drive: s.drive,
          adaptability: s.adaptability,
          innerKnowing: s.innerKnowing,
          expression: s.expression,
        });
      }
    } catch (e) {
      console.warn("Behavioral profile fetch failed:", e);
    }
  };

  // Task #68 — paid stream resilience.
  //
  // streamPaidReading now supports two modes:
  //   • fresh start (resume = false): clear any prior paid text, reset phase
  //     to "streaming_paid", begin from scratch.
  //   • resume after interruption (resume = true): KEEP existing paid text,
  //     append a visible divider, then continue appending new chunks the
  //     server re-streams from the top. The server doesn't support true
  //     checkpoint/resume, so we accept duplicate content rather than throw
  //     away anything the seeker already received.
  //
  // A watchdog timer aborts the request if neither a data chunk nor a server
  // keep-alive `ping` arrives within PAID_STREAM_STALL_MS, so brief network
  // blips don't get swallowed by the 180s wall-clock timeout, and a fully
  // dead connection surfaces a recovery CTA in seconds rather than minutes.
  const streamPaidReading = async (opts: { resume?: boolean } = {}) => {
    const isResume = opts.resume === true;
    if (!isResume) {
      resetPaidReading();
    } else {
      // Add a visible boundary so the seeker can tell where the new attempt
      // picks up. Server replays the section from scratch — duplication is
      // intentional per Task #68 (preserve > de-dupe).
      appendPaidReading(PAID_STREAM_RESUME_DIVIDER);
    }
    setPhase("streaming_paid");
    const baseUrl = getApiUrl();

    const abortController = new AbortController();
    let didStall = false;
    const abortTimeout = setTimeout(() => abortController.abort(), 180000);

    let lastActivity = Date.now();
    const stallWatchdog = setInterval(() => {
      if (Date.now() - lastActivity > PAID_STREAM_STALL_MS) {
        didStall = true;
        abortController.abort();
      }
    }, 2000);
    const stopWatchdog = () => {
      clearInterval(stallWatchdog);
      clearTimeout(abortTimeout);
    };

    try {
      const rcAppUserId = customerInfo?.originalAppUserId ?? "";
      const extra: Record<string, string> = { rcAppUserId };
      if (__DEV__) extra.devSkip = "true";
      const response = await doFetch(`${baseUrl}api/generate/continue`, extra, abortController.signal);

      if (!response.ok) throw new Error("API error");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // Any read activity — chunks OR keep-alive pings — counts as life.
        lastActivity = Date.now();
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          try {
            const parsed = JSON.parse(raw);
            if (parsed.event === "ping") {
              // Heartbeat — already counted via lastActivity above.
              continue;
            }
            if (parsed.event === "error") {
              setErrorMsg(parsed.message ?? "The Oracle is temporarily unavailable.");
              setErrorSource("paid");
              setPhase("error");
              return;
            }
            if (parsed.event === "complete") {
              trackEvent(AnalyticsEvent.READING_PAID_COMPLETED);
              trackEvent(AnalyticsEvent.READING_COMPLETED);
              setReadingComplete(true);
              setPhase("complete");
              if (!state.behavioralScores) void fetchBehavioralScores();
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
            }
          } catch (e) {
            console.warn("SSE parse error (paid reading):", e);
          }
        }
      }

      if (buffer.trim()) {
        const remainingLines = buffer.split("\n");
        for (const rl of remainingLines) {
          const trimmed = rl.trim();
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            if (parsed.chunk) {
              if (parsed.section === "archetype") {
                appendArchetype(parsed.chunk);
              } else {
                appendPaidReading(parsed.chunk);
              }
            }
          } catch (e) { console.warn("SSE flush parse error (paid):", e); }
        }
      }

      setReadingComplete(true);
      setPhase("complete");
      void fetchBehavioralScores();
    } catch (err) {
      const wallClock = abortController.signal.aborted && !didStall;
      const hasPartial = state.paidReading.length > 0;

      if (hasPartial) {
        // Preserve the partial text and offer a one-tap continue. This is
        // the common cellular-blip case — paying users should never see a
        // generic "Try Again" that wipes their reading.
        trackEvent(AnalyticsEvent.READING_PAID_STREAM_INTERRUPTED, {
          partial_length: state.paidReading.length,
          stalled: didStall,
          wall_clock_timeout: wallClock,
        });
        setErrorSource("paid");
        setPhase("paid_interrupted");
        return;
      }

      // Nothing to preserve — fall through to the existing error screen.
      if (wallClock) {
        setErrorMsg("The session took too long. Please try again.");
      } else if (didStall) {
        setErrorMsg("The thread was cut before the full vision could be delivered. Check your network.");
      } else {
        const isNetwork = err instanceof TypeError || String(err).includes("fetch");
        setErrorMsg(
          isNetwork
            ? "The thread was cut before the full vision could be delivered. Check your network."
            : "The Oracle's vision was interrupted. The second sight requires stillness — try again."
        );
      }
      setErrorSource("paid");
      setPhase("error");
    } finally {
      stopWatchdog();
    }
  };

  const handlePaidContinue = () => {
    trackEvent(AnalyticsEvent.READING_PAID_STREAM_RESUMED, {
      partial_length: state.paidReading.length,
    });
    void streamPaidReading({ resume: true });
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
    if (phase === "paywall") {
      if (!journalSaved.current && state.freeReading.length > 0) {
        journalSaved.current = true;
        addJournalEntry({
          readingType: "Full Reading",
          title: state.userData.name || "Full Reading",
          preview: "",
          fullText: state.freeReading,
          metadata: { profileNames: [state.userData.name].filter(Boolean) },
        });
      }
    }

    if (phase === "complete") {
      const fullReading = [
        state.freeReading,
        state.paidReading,
        state.archetypeReading,
      ].filter(Boolean).join("\n\n");
      saveReadingToVault(fullReading);
      maybeRequestReview();
      if (!journalSaved.current && fullReading.length > 0) {
        journalSaved.current = true;
        addJournalEntry({
          readingType: "Full Reading",
          title: state.userData.name || "Full Reading",
          preview: "",
          fullText: fullReading,
          metadata: { profileNames: [state.userData.name].filter(Boolean) },
        });
      }

      if (Platform.OS !== "web") {
        (async () => {
          try {
            const alreadyPrompted = await hasBeenPromptedForNotifications();
            if (!alreadyPrompted) {
              setTimeout(() => {
                requestAndRegisterNotifications();
              }, 3000);
            }
          } catch (e) {
            console.warn("Failed to check notification prompt status:", e);
          }
        })();
      }
    }
  }, [phase]);

  const hasContent = state.freeReading.length > 0;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      {/* Header */}
      {hasContent && (
        <View style={styles.header}>
          <Pressable onPress={() => { if (phase === "paywall") trackEvent(AnalyticsEvent.PAYWALL_DISMISSED); router.replace("/intake"); }} style={styles.backBtn} hitSlop={12} accessibilityLabel="Go back to intake" accessibilityRole="button">
            <Feather name="arrow-left" size={20} color={Colors.gold} />
          </Pressable>
          <Text style={styles.headerTitle}>Your Session</Text>
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
                if (errorSource === "paid") {
                  setPhase("streaming_paid");
                  streamPaidReading();
                } else {
                  hasStarted.current = false;
                  setPhase("loading");
                  streamFreeReading();
                }
              }}
              accessibilityLabel="Try Again — retry Oracle connection"
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
            <Pressable
              style={styles.errorBackBtn}
              onPress={() => router.back()}
              accessibilityLabel="Return to previous screen"
              accessibilityRole="button"
            >
              <Text style={styles.errorBackText}>Return</Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={16}
        >
          {/* Reading title */}
          <Animated.View entering={FadeIn.duration(800)} style={styles.titleBlock}>
            <GoldSigil size={60} style={{ alignSelf: "center", marginBottom: 12 }} />
            <Text style={styles.readingTitle}>YOUR ORACLE SESSION</Text>
            <Text style={styles.readingName}>{state.userData.name}</Text>
          </Animated.View>

          {/* Free sections */}
          {state.freeReading.length > 0 && (
            <>
              <Animated.View entering={FadeIn.duration(700)} style={styles.disclaimerWrap}>
                <Text style={styles.disclaimer}>
                  Oracle's behavioral profile is for personal reflection and self-understanding. It is not medical, psychological, or professional advice, and does not predict future events.
                </Text>
              </Animated.View>
              <ReadingSection
                text={state.freeReading}
                sessionId={state.sessionId}
                userData={JSON.stringify(state.userData)}
                questionnaireAnswers={state.questionnaireAnswers}
                isSubscribed={!!(customerInfo?.entitlements?.active?.["full_reading"])}
                parentScrollRef={scrollRef}
                parentScrollOffset={scrollOffsetRef}
              />
            </>
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

          {/* Paid sections — also rendered while paid_interrupted so the
              partial paid text the seeker already received stays on screen
              behind the "Continue where Oracle left off" CTA. */}
          {(phase === "streaming_paid" || phase === "complete" || phase === "paid_interrupted") && state.paidReading.length > 0 && (
            <>
              <Text style={sectionStyles.divider}>─── ✦ ───</Text>
              <ReadingSection
                text={state.paidReading}
                sessionId={state.sessionId}
                userData={JSON.stringify(state.userData)}
                questionnaireAnswers={state.questionnaireAnswers}
                isSubscribed={!!(customerInfo?.entitlements?.active?.["full_reading"])}
                parentScrollRef={scrollRef}
                parentScrollOffset={scrollOffsetRef}
              />
            </>
          )}

          {/* Streaming paid indicator */}
          {phase === "streaming_paid" && (
            <View style={styles.streamingDots}>
              <Text style={styles.streamingText}>The depths open...</Text>
            </View>
          )}

          {/* Task #68 — paid stream interrupted recovery CTA. The partial
              paid text remains rendered above; this block adds a clear
              "Continue where Oracle left off" affordance plus a secondary
              "Begin a New Session" escape hatch. */}
          {phase === "paid_interrupted" && (
            <Animated.View entering={FadeIn.duration(500)} style={styles.interruptedBlock}>
              <Text style={styles.interruptedDivider}>─── ✦ ───</Text>
              <Text style={styles.interruptedTitle}>Connection lost</Text>
              <Text style={styles.interruptedBody}>
                The thread was momentarily severed. Your reading so far is preserved — continue where Oracle left off.
              </Text>
              <View style={styles.errorActions}>
                <Pressable
                  style={styles.retryBtn}
                  onPress={handlePaidContinue}
                  accessibilityLabel="Continue where Oracle left off"
                  accessibilityRole="button"
                >
                  <Text style={styles.retryText}>Continue</Text>
                </Pressable>
                <Pressable
                  style={styles.errorBackBtn}
                  onPress={() => {
                    resetAll();
                    router.replace("/");
                  }}
                  accessibilityLabel="Begin a New Session"
                  accessibilityRole="button"
                >
                  <Text style={styles.errorBackText}>Begin a New Session</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Archetype */}
          {state.archetypeReading.length > 0 && (
            <>
              <Text style={sectionStyles.divider}>─── ✦ ───</Text>
              <View style={styles.archetypeCard}>
                <ReadingSection
                  text={state.archetypeReading}
                  sessionId={state.sessionId}
                  userData={JSON.stringify(state.userData)}
                  questionnaireAnswers={state.questionnaireAnswers}
                  isSubscribed={!!(customerInfo?.entitlements?.active?.["full_reading"])}
                  parentScrollRef={scrollRef}
                  parentScrollOffset={scrollOffsetRef}
                />
              </View>
            </>
          )}

          {/* Complete — Deep Dive + chat CTA */}
          {phase === "complete" && (
            <Animated.View entering={FadeIn.duration(800)} style={styles.completeCta}>
              <Text style={styles.completeTitle}>Your session is complete.</Text>
              <Text style={styles.completeDivider}>─── ✦ ───</Text>

              {/* Deep Dive Section */}
              <Animated.View entering={FadeIn.duration(600).delay(200)} style={styles.deepDiveSection}>
                <Text style={styles.deepDiveTitle}>Explore Further</Text>
                <Text style={styles.deepDiveSubtitle}>
                  Select a life area for a targeted Oracle session woven from your profile.
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
                        accessibilityLabel={hasDive ? `${LABELS[cat]} deep dive — completed` : `${LABELS[cat]} deep dive`}
                        accessibilityRole="button"
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
                          accessibilityLabel={`Re-read ${LABELS[cat]} deep dive`}
                          accessibilityRole="button"
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
                onPress={() => { trackEvent(AnalyticsEvent.SHARE_TAPPED, { content: "archetype" }); setShowShareCard(true); }}
                accessibilityLabel="Share your archetype"
                accessibilityRole="button"
              >
                <Feather name="share-2" size={16} color={Colors.gold} />
                <Text style={styles.shareText}>Share your archetype</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.85 }]}
                onPress={() => router.push("/chat")}
                accessibilityLabel="Ask Oracle Anything — open chat"
                accessibilityRole="button"
              >
                <Feather name="message-circle" size={18} color={Colors.bg} />
                <Text style={styles.chatBtnText}>Ask Oracle Anything</Text>
              </Pressable>

              <View style={styles.bridgeCtaWrap}>
                <Pressable
                  style={({ pressed }) => [styles.bridgeCta, pressed && { opacity: 0.85 }]}
                  onPress={() => {
                    if (customerInfo?.entitlements?.active?.["full_reading"]) {
                      router.push("/chat");
                    } else {
                      setPhase("paywall");
                    }
                  }}
                  accessibilityLabel="Talk to Oracle About Your Profile"
                  accessibilityRole="button"
                >
                  <Feather name="user" size={16} color={Colors.bg} />
                  <Text style={styles.bridgeCtaText}>Talk to Oracle About Your Profile →</Text>
                </Pressable>
              </View>

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
                accessibilityLabel="Begin a New Session"
                accessibilityRole="button"
              >
                <Feather name="refresh-cw" size={15} color={Colors.muted} />
                <Text style={styles.newReadingText}>Begin a New Session</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      )}

      <ShareCardModal
        visible={showShareCard}
        onClose={() => setShowShareCard(false)}
        data={extractArchetypeData(
          state.archetypeReading || state.freeReading,
          state.userData.name || "Seeker",
        )}
      />
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
    fontFamily: "CormorantGaramond_400Regular",
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
    fontFamily: "CormorantGaramond_700Bold",
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
    fontFamily: "CormorantGaramond_400Regular",
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
    fontFamily: "CormorantGaramond_400Regular",
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
    fontFamily: "CormorantGaramond_400Regular",
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
    fontFamily: "CormorantGaramond_400Regular",
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
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 13,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  interruptedBlock: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: "center",
    gap: 12,
  },
  interruptedDivider: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    letterSpacing: 4,
  },
  interruptedTitle: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 18,
    color: Colors.gold,
    letterSpacing: 1,
    textAlign: "center",
  },
  interruptedBody: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 4,
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
  disclaimerWrap: {
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  disclaimer: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 22,
    textAlign: "center",
    opacity: 0.85,
  },
  bridgeCtaWrap: {
    width: "100%",
    marginTop: 24,
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
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  deepDiveSection: {
    width: "100%",
    gap: 12,
  },
  deepDiveTitle: {
    fontFamily: "CormorantGaramond_700Bold",
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
    fontFamily: "CormorantGaramond_400Regular",
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
