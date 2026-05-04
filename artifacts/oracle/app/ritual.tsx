import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import GoldSigil from "@/components/GoldSigil";
import { useOracle, CapturedImage } from "@/context/OracleContext";
import { useProfiles } from "@/context/ProfileContext";
import { trackEvent, trackFunnelStep, AnalyticsEvent } from "@/lib/analytics";
import Svg, { Path } from "react-native-svg";

// ── Hand outline diagram (decorative, no palmistry annotations) ──
function HandDiagram() {
  return (
    <View style={diagStyles.container}>
      <Svg width={120} height={150} viewBox="0 0 100 130">
        {/* Hand outline only — no line annotations */}
        <Path
          d="M 30 120 Q 15 110 18 80 L 20 50 Q 20 38 28 38 Q 34 38 34 50 L 34 55 Q 34 28 42 28 Q 50 28 50 55 L 50 52 Q 50 26 58 26 Q 66 26 66 52 L 66 55 Q 66 40 72 40 Q 78 40 78 55 L 76 80 Q 82 110 68 120 Z"
          fill="none"
          stroke={Colors.gold}
          strokeWidth={1.5}
        />
      </Svg>
    </View>
  );
}


const diagStyles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
});

// ── Main screen ────────────────────────────────────────────────

interface StepConfig {
  key: keyof OracleImages | null;
  title: string;
  subtitle?: string;
  sectionLabel?: string;
  extraNote?: string;
  required?: boolean;
  instructions: string[];
  diagram?: "palm" | null;
  intro?: boolean;
  review?: boolean;
}

type OracleImages = {
  right_palm?: CapturedImage;
  left_palm?: CapturedImage;
};

const STEPS: StepConfig[] = [
  {
    key: null,
    title: "Behavioral Imprint Capture",
    intro: true,
    instructions: [],
  },
  {
    key: "right_palm",
    title: "Your Dominant Hand",
    required: true,
    instructions: [
      "Find natural light (window light, not direct sun)",
      "Hold your hand flat, fingers relaxed and slightly spread",
      "Camera 20–25cm above your hand",
      "Ensure your full hand is in frame",
    ],
    diagram: "palm",
  },
  {
    key: "left_palm",
    title: "Your Non-Dominant Hand",
    subtitle: "Behavioral imprint — secondary signal",
    instructions: [
      "Same technique as your dominant hand",
      "This image refines the behavioral profile",
      "Take your time — soft natural light",
    ],
    diagram: "palm",
  },
  {
    key: null,
    title: "Review & Submit",
    review: true,
    instructions: [],
  },
];

const FRONT_CAMERA_KEYS: (keyof OracleImages)[] = [];

export default function RitualScreen() {
  const insets = useSafeAreaInsets();
  const { state, setImage, setCurrentProfileId } = useOracle();
  const { addProfile } = useProfiles();
  const [step, setStep] = useState(0);
  const currentStep = STEPS[step];

  useEffect(() => {
    trackFunnelStep("ritual");
  }, []);

  const saveToVaultAndReveal = async () => {
    try {
      const { userData, images, currentProfileId } = state;
      // Task #65 — DOB is no longer collected at intake, so we can't use
      // it to dedupe. Skip the auto-save when the session is already
      // anchored to an existing profile (e.g. the user navigated here
      // from /profile-action). Otherwise create a fresh vault profile so
      // reading.tsx / deep-dive.tsx can still attach the generated text.
      if (!currentProfileId) {
        const created = await addProfile({
          name: userData.name ?? "",
          dob: userData.dob ?? "",
          birthTime: userData.birthTime ?? "",
          birthTimeUnknown: userData.birthTimeUnknown ?? false,
          birthCity: userData.birthCity ?? "",
          birthCountry: userData.birthCountry ?? "",
          gender: userData.gender ?? "",
          dominantHand: userData.dominantHand ?? "",
          eyeColor: userData.eyeColor ?? "",
          notes: "",
          photos: {
            right_palm: images.right_palm?.uri,
            left_palm: images.left_palm?.uri,
          },
        });
        if (created) setCurrentProfileId(created.id);
      }
    } catch (_e) {
    }
    trackEvent(AnalyticsEvent.RITUAL_COMPLETED, {
      images_captured: Object.values(state.images).filter(Boolean).length,
    });
    router.push("/reading");
  };

  const handlePickImage = async (key: keyof OracleImages) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    let result;

    const useFront = FRONT_CAMERA_KEYS.includes(key);

    if (permission.granted) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: false,
        cameraType: useFront
          ? ImagePicker.CameraType.front
          : ImagePicker.CameraType.back,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: false,
      });
    }

    if (!result.canceled && result.assets[0]) {
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setImage(key, { uri: result.assets[0].uri });
      trackEvent(AnalyticsEvent.RITUAL_IMAGE_CAPTURED, { image_type: key });
    }
  };

  const canProceed = () => {
    if (!currentStep) return false;
    if (currentStep.intro) return true;
    if (currentStep.required) return !!state.images[currentStep.key as keyof OracleImages];
    return true;
  };

  const handleNext = async () => {
    if (!canProceed()) {
      Alert.alert("This image is required", `Please capture ${currentStep?.title ?? "this image"} to continue.`);
      return;
    }
    if (Platform.OS !== "web") {
      await Haptics.selectionAsync();
    }
    trackEvent(AnalyticsEvent.RITUAL_STEP_COMPLETED, {
      step_index: step,
      step_title: currentStep?.title,
    });
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      await saveToVaultAndReveal();
    }
  };

  const isReview = !!currentStep?.review;

  if (!currentStep) {
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <StarField />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => (step > 0 ? setStep(step - 1) : router.back())}
          style={styles.backBtn}
          hitSlop={12}
          accessibilityLabel={step > 0 ? "Go to previous step" : "Go back"}
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={20} color={Colors.gold} />
        </Pressable>
        <Text style={styles.stepCounter}>
          {step === 0 ? "" : `Step ${step} of ${STEPS.length - 1}`}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Step progress dots */}
      {step > 0 && (
        <View style={styles.dots}>
          {STEPS.slice(1).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step - 1 && styles.dotActive, i < step - 1 && styles.dotDone]}
            />
          ))}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        key={step}
      >
        {currentStep.intro ? (
          <Animated.View entering={FadeIn.duration(600)} style={styles.card}>
            <GoldSigil size={80} style={{ marginBottom: 20, alignSelf: "center" }} />
            <Text style={styles.cardTitle}>{currentStep.title}</Text>
            <Text style={styles.divider}>─── ✦ ───</Text>
            <Text style={styles.introText}>
              Oracle reads behavioral and personality patterns from your hand imprint. These images are the foundation of your session. Take your time — good light matters.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.proceedBtn, pressed && { opacity: 0.85 }]}
              onPress={handleNext}
              accessibilityLabel="I'm Ready — begin photo capture"
              accessibilityRole="button"
            >
              <Text style={styles.proceedBtnText}>I'm Ready</Text>
              <Feather name="arrow-right" size={16} color={Colors.bg} />
            </Pressable>
          </Animated.View>
        ) : isReview ? (
          /* Review card */
          <Animated.View entering={FadeIn.duration(600)} style={styles.card}>
            <Text style={styles.cardTitle}>Review & Submit</Text>
            <Text style={styles.divider}>─── ✦ ───</Text>

            <View style={styles.photoGrid}>
              {(["right_palm","left_palm"] as (keyof OracleImages)[]).map(key => {
                const img = state.images[key];
                const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                return (
                  <View key={key} style={styles.photoThumb}>
                    {img ? (
                      <Image source={{ uri: img.uri }} style={styles.thumbImage} />
                    ) : (
                      <View style={styles.thumbEmpty}>
                        <Feather name="minus" size={16} color={Colors.muted} />
                      </View>
                    )}
                    <Text style={styles.thumbLabel}>{label}</Text>
                    {!img && (
                      <Text style={styles.thumbSkipped}>Not captured</Text>
                    )}
                  </View>
                );
              })}
            </View>

            <Text style={styles.generatingNote}>
              Your complete session takes 60–90 seconds to generate.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.revealBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
              onPress={saveToVaultAndReveal}
              accessibilityLabel="Begin My Session — generate Oracle insights"
              accessibilityRole="button"
            >
              <Text style={styles.revealBtnText}>Begin My Session</Text>
              <Feather name="arrow-right" size={18} color={Colors.bg} />
            </Pressable>
          </Animated.View>
        ) : (
          /* Photo step card */
          <Animated.View entering={FadeIn.duration(500)} style={styles.card}>
            {currentStep.sectionLabel && (
              <View style={styles.sectionLabelBadge}>
                <Text style={styles.sectionLabelText}>{currentStep.sectionLabel}</Text>
              </View>
            )}
            <Text style={styles.cardTitle}>{currentStep.title}</Text>
            {currentStep.subtitle && (
              <Text style={styles.cardSubtitle}>{currentStep.subtitle}</Text>
            )}
            {currentStep.required && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            )}

            <Text style={styles.divider}>─── ✦ ───</Text>

            {currentStep.extraNote && (
              <Text style={styles.extraNote}>{currentStep.extraNote}</Text>
            )}

            {/* Diagram */}
            {currentStep.diagram && (
              <View style={styles.diagramContainer}>
                {currentStep.diagram === "palm" && <HandDiagram />}
              </View>
            )}

            {/* Instructions */}
            <View style={styles.instructionsList}>
              {currentStep.instructions.map((inst, i) => (
                <View key={i} style={styles.instructionItem}>
                  <Text style={styles.instructionDot}>✦</Text>
                  <Text style={styles.instructionText}>{inst}</Text>
                </View>
              ))}
            </View>

            {/* Preview or capture */}
            {state.images[currentStep.key!] ? (
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: state.images[currentStep.key!]!.uri }}
                  style={styles.preview}
                />
                <View style={styles.checkmark}>
                  <Feather name="check" size={16} color={Colors.bg} />
                </View>
                <Pressable
                  style={styles.retakeBtn}
                  onPress={() => handlePickImage(currentStep.key!)}
                  accessibilityLabel={`Retake ${currentStep.title}`}
                  accessibilityRole="button"
                >
                  <Feather name="refresh-cw" size={14} color={Colors.gold} />
                  <Text style={styles.retakeText}>Retake</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.8 }]}
                onPress={() => handlePickImage(currentStep.key!)}
                accessibilityLabel={`Capture ${currentStep.title} — open camera`}
                accessibilityRole="button"
              >
                <Feather name="camera" size={20} color={Colors.bg} />
                <Text style={styles.captureBtnText}>
                  Capture {currentStep.title.split(" ").slice(-1)[0]}
                </Text>
              </Pressable>
            )}

            {/* Next / Skip */}
            <View style={styles.navRow}>
              {!currentStep.required && (
                <Pressable
                  style={styles.skipBtn}
                  onPress={handleNext}
                  accessibilityLabel={`Skip ${currentStep.title}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.skipText}>Skip</Text>
                  <Feather name="skip-forward" size={14} color={Colors.muted} />
                </Pressable>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.nextBtn,
                  !canProceed() && styles.nextBtnDisabled,
                  pressed && canProceed() && { opacity: 0.85 },
                ]}
                onPress={handleNext}
                disabled={!canProceed()}
                accessibilityLabel="Next step"
                accessibilityRole="button"
              >
                <Text style={[styles.nextBtnText, !canProceed() && { color: Colors.muted }]}>Next</Text>
                <Feather name="arrow-right" size={16} color={canProceed() ? Colors.gold : Colors.muted} />
              </Pressable>
            </View>
          </Animated.View>
        )}

        <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 24 }} />
      </ScrollView>
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
  stepCounter: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 12,
    color: Colors.gold,
    letterSpacing: 1,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.inputBorder,
  },
  dotActive: { backgroundColor: Colors.gold, width: 20, borderRadius: 3 },
  dotDone: { backgroundColor: "rgba(201,168,76,0.4)" },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.15)",
  },
  cardTitle: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 17,
    color: Colors.cream,
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    color: Colors.gold,
    textAlign: "center",
    marginBottom: 4,
  },
  sectionLabelBadge: {
    alignSelf: "center",
    backgroundColor: "rgba(201,168,76,0.1)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.4)",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  sectionLabelText: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 10,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  extraNote: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  requiredBadge: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  requiredText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 11,
    color: Colors.gold,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  divider: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 13,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 4,
    opacity: 0.6,
    marginVertical: 16,
  },
  introText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 17,
    color: Colors.cream,
    lineHeight: 28,
    textAlign: "center",
    marginBottom: 28,
    opacity: 0.85,
  },
  diagramContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(201,168,76,0.1)",
  },
  instructionsList: { gap: 12, marginBottom: 24 },
  instructionItem: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  instructionDot: { fontFamily: "EBGaramond_400Regular", fontSize: 12, color: Colors.gold, marginTop: 2 },
  instructionText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 15,
    color: Colors.cream,
    lineHeight: 22,
    flex: 1,
    opacity: 0.85,
  },
  captureBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 52,
    marginBottom: 16,
  },
  captureBtnText: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 13,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  previewContainer: {
    position: "relative",
    marginBottom: 16,
    alignItems: "center",
  },
  preview: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    resizeMode: "cover",
  },
  checkmark: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: Colors.gold,
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  retakeText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.gold,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 48,
  },
  skipText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 15,
    color: Colors.muted,
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 10,
    paddingVertical: 13,
    minHeight: 48,
  },
  nextBtnDisabled: {
    borderColor: Colors.inputBorder,
  },
  nextBtnText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 16,
    color: Colors.gold,
  },
  proceedBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 52,
  },
  proceedBtnText: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 13,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  // Review step
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  photoThumb: {
    width: "30%",
    alignItems: "center",
    gap: 4,
  },
  thumbImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    resizeMode: "cover",
  },
  thumbEmpty: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbLabel: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 10,
    color: Colors.cream,
    textAlign: "center",
    opacity: 0.7,
  },
  thumbSkipped: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 9,
    color: Colors.muted,
    textAlign: "center",
  },
  userSummary: {
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(201,168,76,0.1)",
  },
  summaryName: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 14,
    color: Colors.gold,
    letterSpacing: 1,
  },
  summaryDetail: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 13,
    color: Colors.muted,
  },
  generatingNote: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    marginBottom: 16,
  },
  revealBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 56,
  },
  revealBtnText: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 14,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
});
