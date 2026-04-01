import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Modal,
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
import MultishotFaceCamera, { MultishotResult } from "@/components/MultishotFaceCamera";
import { useOracle, CapturedImage } from "@/context/OracleContext";
import { useProfiles } from "@/context/ProfileContext";
import { trackEvent, trackFunnelStep, AnalyticsEvent } from "@/lib/analytics";
import Svg, { Path, Circle, Line, Ellipse } from "react-native-svg";

// ── Palm diagram ──────────────────────────────────────────────
function PalmDiagram() {
  return (
    <View style={diagStyles.container}>
      <Svg width={100} height={130} viewBox="0 0 100 130">
        {/* Palm outline */}
        <Path
          d="M 30 120 Q 15 110 18 80 L 20 50 Q 20 38 28 38 Q 34 38 34 50 L 34 55 Q 34 28 42 28 Q 50 28 50 55 L 50 52 Q 50 26 58 26 Q 66 26 66 52 L 66 55 Q 66 40 72 40 Q 78 40 78 55 L 76 80 Q 82 110 68 120 Z"
          fill="none"
          stroke={Colors.muted}
          strokeWidth={1.5}
        />
        {/* Heart line */}
        <Path d="M 25 65 Q 50 60 75 65" fill="none" stroke={Colors.gold} strokeWidth={1.2} />
        {/* Head line */}
        <Path d="M 28 78 Q 52 82 72 75" fill="none" stroke={Colors.gold} strokeWidth={1.2} />
        {/* Life line */}
        <Path d="M 35 50 Q 28 75 30 105" fill="none" stroke={Colors.gold} strokeWidth={1.2} />
        {/* Fate line */}
        <Path d="M 50 120 Q 52 90 50 60" fill="none" stroke={Colors.goldLight} strokeWidth={0.8} strokeDasharray="3,2" />
        {/* Labels */}
      </Svg>
      <View style={diagStyles.labels}>
        <View style={diagStyles.labelItem}>
          <View style={[diagStyles.labelDot, { backgroundColor: Colors.gold }]} />
          <Text style={diagStyles.labelText}>Heart</Text>
        </View>
        <View style={diagStyles.labelItem}>
          <View style={[diagStyles.labelDot, { backgroundColor: Colors.gold }]} />
          <Text style={diagStyles.labelText}>Head</Text>
        </View>
        <View style={diagStyles.labelItem}>
          <View style={[diagStyles.labelDot, { backgroundColor: Colors.gold }]} />
          <Text style={diagStyles.labelText}>Life</Text>
        </View>
        <View style={diagStyles.labelItem}>
          <View style={[diagStyles.labelDot, { backgroundColor: Colors.goldLight }]} />
          <Text style={diagStyles.labelText}>Fate</Text>
        </View>
      </View>
    </View>
  );
}

// ── Iris diagram ──────────────────────────────────────────────
function IrisDiagram() {
  return (
    <Svg width={100} height={100} viewBox="0 0 100 100" style={diagStyles.svg}>
      {/* Eye white */}
      <Ellipse cx={50} cy={50} rx={48} ry={28} fill="none" stroke={Colors.muted} strokeWidth={1.5} />
      {/* Iris */}
      <Circle cx={50} cy={50} r={22} fill="none" stroke={Colors.gold} strokeWidth={1.5} />
      {/* Iris zones */}
      <Circle cx={50} cy={50} r={15} fill="none" stroke={Colors.gold} strokeWidth={0.5} opacity={0.5} />
      <Circle cx={50} cy={50} r={8} fill="none" stroke={Colors.gold} strokeWidth={0.5} opacity={0.5} />
      {/* Pupil */}
      <Circle cx={50} cy={50} r={6} fill={Colors.muted} opacity={0.5} />
      {/* Radial lines */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (Math.PI * 2 / 12) * i;
        const x1 = 50 + 8 * Math.cos(a);
        const y1 = 50 + 8 * Math.sin(a);
        const x2 = 50 + 22 * Math.cos(a);
        const y2 = 50 + 22 * Math.sin(a);
        return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={Colors.gold} strokeWidth={0.3} opacity={0.4} />;
      })}
    </Svg>
  );
}

// ── Iridology zone diagram ─────────────────────────────────────
function IridologyDiagram() {
  return (
    <View style={diagStyles.container}>
      <Svg width={100} height={100} viewBox="0 0 100 100" style={diagStyles.svg}>
        {/* Eye white */}
        <Ellipse cx={50} cy={50} rx={48} ry={28} fill="none" stroke={Colors.muted} strokeWidth={1.5} />
        {/* Outer iris ring */}
        <Circle cx={50} cy={50} r={22} fill="none" stroke={Colors.gold} strokeWidth={1.5} />
        {/* Middle zone */}
        <Circle cx={50} cy={50} r={15} fill="none" stroke={Colors.gold} strokeWidth={0.8} opacity={0.6} />
        {/* Inner zone */}
        <Circle cx={50} cy={50} r={9} fill="none" stroke={Colors.gold} strokeWidth={0.8} opacity={0.6} />
        {/* Pupil */}
        <Circle cx={50} cy={50} r={6} fill={Colors.muted} opacity={0.4} />
        {/* Zone sector lines — 6 sectors */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 6) * i * 2;
          const x1 = 50 + 9 * Math.cos(a);
          const y1 = 50 + 9 * Math.sin(a);
          const x2 = 50 + 22 * Math.cos(a);
          const y2 = 50 + 22 * Math.sin(a);
          return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={Colors.gold} strokeWidth={0.5} opacity={0.5} />;
        })}
      </Svg>
      <View style={diagStyles.labels}>
        <View style={diagStyles.labelItem}>
          <View style={[diagStyles.labelDot, { backgroundColor: Colors.gold }]} />
          <Text style={diagStyles.labelText}>Vitality</Text>
        </View>
        <View style={diagStyles.labelItem}>
          <View style={[diagStyles.labelDot, { backgroundColor: Colors.gold }]} />
          <Text style={diagStyles.labelText}>Organs</Text>
        </View>
        <View style={diagStyles.labelItem}>
          <View style={[diagStyles.labelDot, { backgroundColor: Colors.gold }]} />
          <Text style={diagStyles.labelText}>Nervous</Text>
        </View>
      </View>
    </View>
  );
}

// ── Chinese Face diagram (front portrait) ──────────────────────
function ChineseFaceDiagram() {
  return (
    <View style={diagStyles.container}>
      <Svg width={90} height={120} viewBox="0 0 90 120" style={diagStyles.svg}>
        {/* Face oval */}
        <Ellipse cx={45} cy={62} rx={36} ry={50} fill="none" stroke={Colors.muted} strokeWidth={1.5} />
        {/* Forehead zone */}
        <Line x1={9} y1={30} x2={81} y2={30} stroke={Colors.gold} strokeWidth={0.7} strokeDasharray="4,3" opacity={0.6} />
        {/* Mid-face zone */}
        <Line x1={9} y1={66} x2={81} y2={66} stroke={Colors.gold} strokeWidth={0.7} strokeDasharray="4,3" opacity={0.6} />
        {/* Lower face zone */}
        <Line x1={9} y1={90} x2={81} y2={90} stroke={Colors.gold} strokeWidth={0.7} strokeDasharray="4,3" opacity={0.6} />
        {/* Eyes */}
        <Ellipse cx={31} cy={50} rx={8} ry={4} fill="none" stroke={Colors.muted} strokeWidth={1} />
        <Ellipse cx={59} cy={50} rx={8} ry={4} fill="none" stroke={Colors.muted} strokeWidth={1} />
        {/* Nose tip */}
        <Circle cx={45} cy={72} r={3} fill="none" stroke={Colors.muted} strokeWidth={1} />
        {/* Mouth */}
        <Path d="M 35 90 Q 45 96 55 90" fill="none" stroke={Colors.muted} strokeWidth={1} />
        {/* Ears */}
        <Path d="M 9 54 Q 5 62 9 70" fill="none" stroke={Colors.muted} strokeWidth={1} />
        <Path d="M 81 54 Q 85 62 81 70" fill="none" stroke={Colors.muted} strokeWidth={1} />
      </Svg>
      <View style={diagStyles.faceZoneLabels}>
        <Text style={diagStyles.faceLabelText}>HEAVEN</Text>
        <Text style={diagStyles.faceLabelText}>HUMAN</Text>
        <Text style={diagStyles.faceLabelText}>EARTH</Text>
        <Text style={diagStyles.faceLabelText}>DESTINY</Text>
      </View>
    </View>
  );
}

// ── Chinese Face side profile diagram ─────────────────────────
function ChineseFaceProfileDiagram() {
  return (
    <View style={diagStyles.container}>
      <Svg width={90} height={120} viewBox="0 0 90 120" style={diagStyles.svg}>
        {/* Profile outline */}
        <Path
          d="M 50 12 Q 65 14 68 28 Q 72 36 70 44 Q 72 50 68 56 Q 74 66 66 74 Q 68 82 62 90 Q 55 105 45 110 Q 35 112 28 105 L 28 12 Z"
          fill="none" stroke={Colors.muted} strokeWidth={1.5}
        />
        {/* Eye */}
        <Ellipse cx={58} cy={48} rx={6} ry={4} fill="none" stroke={Colors.muted} strokeWidth={1} />
        {/* Nose bridge line */}
        <Path d="M 68 28 L 66 56" fill="none" stroke={Colors.gold} strokeWidth={0.6} strokeDasharray="3,2" opacity={0.5} />
        {/* Jaw line */}
        <Path d="M 62 90 Q 50 108 35 110" fill="none" stroke={Colors.gold} strokeWidth={0.6} strokeDasharray="3,2" opacity={0.5} />
        {/* Ear */}
        <Path d="M 28 50 Q 22 58 28 68" fill="none" stroke={Colors.muted} strokeWidth={1} />
      </Svg>
      <View style={diagStyles.labels}>
        <View style={diagStyles.labelItem}>
          <View style={[diagStyles.labelDot, { backgroundColor: Colors.gold }]} />
          <Text style={diagStyles.labelText}>Forehead</Text>
        </View>
        <View style={diagStyles.labelItem}>
          <View style={[diagStyles.labelDot, { backgroundColor: Colors.gold }]} />
          <Text style={diagStyles.labelText}>Nose</Text>
        </View>
        <View style={diagStyles.labelItem}>
          <View style={[diagStyles.labelDot, { backgroundColor: Colors.gold }]} />
          <Text style={diagStyles.labelText}>Jaw</Text>
        </View>
      </View>
    </View>
  );
}

const diagStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 16 },
  svg: {},
  labels: { gap: 8 },
  labelItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  labelDot: { width: 8, height: 8, borderRadius: 4 },
  labelText: { fontFamily: "EBGaramond_400Regular", fontSize: 13, color: Colors.cream, opacity: 0.7 },
  faceLabelText: { fontFamily: "EBGaramond_400Regular", fontSize: 11, color: Colors.gold, opacity: 0.7, letterSpacing: 1 },
  faceZoneLabels: { justifyContent: "space-between", height: 120, paddingVertical: 6 },
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
  diagram?: "palm" | "iris" | "iridology" | "face_chinese" | "face_profile" | null;
  intro?: boolean;
  review?: boolean;
  multishot?: boolean;
  consent?: boolean;
}

type OracleImages = {
  right_palm?: CapturedImage;
  left_palm?: CapturedImage;
  right_iris?: CapturedImage;
  left_iris?: CapturedImage;
  face?: CapturedImage;
  face_front?: CapturedImage;
  face_left?: CapturedImage;
  face_right?: CapturedImage;
};

const STEPS: StepConfig[] = [
  {
    key: null,
    title: "The Sacred Imaging Ritual",
    intro: true,
    instructions: [],
  },
  {
    key: "right_palm",
    title: "Your Dominant Palm",
    required: true,
    instructions: [
      "Find natural light (window light, not direct sun)",
      "Hold palm flat, fingers relaxed and slightly spread",
      "Camera 20–25cm above palm",
      "Ensure all major lines are visible",
    ],
    diagram: "palm",
  },
  {
    key: "left_palm",
    title: "Your Non-Dominant Palm",
    subtitle: "Reveals Past & Potential",
    instructions: [
      "Same technique as your dominant palm",
      "This hand carries your inherited patterns",
      "Take your time — soft natural light",
    ],
    diagram: "palm",
  },
  {
    key: null,
    title: "Biometric Data Consent",
    consent: true,
    instructions: [],
    diagram: null,
  },
  {
    key: "right_iris",
    title: "Your Right Iris",
    sectionLabel: "Iridology Health Reading",
    extraNote: "The iris maps to organ systems, vitality zones, and constitutional tendencies — revealing what the body holds in silence.",
    instructions: [
      "Use front-facing camera in bright light",
      "Hold phone at arm's length, look directly at lens",
      "Or ask someone to photograph your eye from 15cm",
      "Iris must fill at least 40% of the frame",
    ],
    diagram: "iridology",
  },
  {
    key: "left_iris",
    title: "Your Left Iris",
    subtitle: "The Receiving Eye",
    sectionLabel: "Iridology Health Reading",
    extraNote: "The left iris carries receptive energies and maps the body's hidden sensitivities.",
    instructions: [
      "Same technique as your right iris",
      "The left iris carries receptive energies",
      "Bright, even lighting works best",
    ],
    diagram: "iridology",
  },
  {
    key: "face_front",
    title: "Face Reading Session",
    subtitle: "Front · Left · Right",
    sectionLabel: "Chinese Face Reading (面相)",
    extraNote: "Mianxiang — the ancient art of physiognomy — reads destiny, character, and life phases from the five facial zones. Three photos will be captured in a single guided session.",
    instructions: [
      "Find even, natural light with no harsh shadows",
      "Hair pulled back, ears visible for profiles",
      "Follow the on-screen prompts to turn for each shot",
      "All three photos are captured automatically",
    ],
    diagram: "face_chinese",
    multishot: true,
  },
  {
    key: null,
    title: "Review & Submit",
    review: true,
    instructions: [],
  },
];

const FRONT_CAMERA_KEYS: (keyof OracleImages)[] = [
  "face_front", "face_left", "face_right",
  "right_iris", "left_iris",
];

export default function RitualScreen() {
  const insets = useSafeAreaInsets();
  const { state, setImage } = useOracle();
  const { profiles, addProfile } = useProfiles();
  const [step, setStep] = useState(0);
  const [showMultishot, setShowMultishot] = useState(false);
  const [multishotKey, setMultishotKey] = useState(0);
  const [biometricConsentGiven, setBiometricConsentGiven] = useState(false);
  const currentStep = STEPS[step];

  const isIrisStep = currentStep?.key === "right_iris" || currentStep?.key === "left_iris";
  const showBiometricConsent = isIrisStep && !biometricConsentGiven;

  useEffect(() => {
    trackFunnelStep("ritual");
  }, []);

  const saveToVaultAndReveal = async () => {
    try {
      const { userData, images } = state;
      if (userData.name && userData.dob) {
        const alreadySaved = profiles.some(
          p => p.name.trim().toLowerCase() === userData.name.trim().toLowerCase() && p.dob === userData.dob
        );
        if (!alreadySaved) {
          await addProfile({
            name: userData.name,
            dob: userData.dob,
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
              right_iris: images.right_iris?.uri,
              left_iris: images.left_iris?.uri,
              face: images.face?.uri,
              face_front: images.face_front?.uri,
              face_left: images.face_left?.uri,
              face_right: images.face_right?.uri,
            },
          });
        }
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

  const handleMultishotComplete = async (result: MultishotResult) => {
    setShowMultishot(false);
    setImage("face_front", { uri: result.face_front });
    setImage("face_left", { uri: result.face_left });
    setImage("face_right", { uri: result.face_right });
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      await saveToVaultAndReveal();
    }
  };

  const openMultishot = () => {
    setMultishotKey(k => k + 1);
    setShowMultishot(true);
  };

  const [bioConsentGiven, setBioConsentGiven] = useState(false);

  const canProceed = () => {
    if (!currentStep) return false;
    if (currentStep.consent) return bioConsentGiven;
    if (currentStep.intro) return true;
    if (currentStep.multishot) {
      return !!(state.images.face_front && state.images.face_left && state.images.face_right);
    }
    if (currentStep.required) return !!state.images[currentStep.key!];
    return true;
  };

  const handleNext = async () => {
    if (!canProceed()) {
      Alert.alert("This image is required", "Please capture your palm to continue.");
      return;
    }
    if (Platform.OS !== "web") {
      await Haptics.selectionAsync();
    }
    trackEvent(AnalyticsEvent.RITUAL_STEP_COMPLETED, {
      step_index: step,
      step_title: currentStep.title,
    });
    if (currentStep.consent) {
      trackEvent(AnalyticsEvent.RITUAL_BIOMETRIC_CONSENT_GIVEN);
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      await saveToVaultAndReveal();
    }
  };

  const isReview = !!currentStep.review;
  const isConsent = !!currentStep.consent;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      {/* Multishot Face Camera Modal */}
      <Modal
        visible={showMultishot}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <MultishotFaceCamera
          key={multishotKey}
          onComplete={handleMultishotComplete}
          onCancel={() => setShowMultishot(false)}
        />
      </Modal>

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
        {/* Biometric consent */}
        {showBiometricConsent ? (
          <Animated.View entering={FadeIn.duration(600)} style={styles.card}>
            <View style={styles.sectionLabelBadge}>
              <Text style={styles.sectionLabelText}>Biometric Data Notice</Text>
            </View>
            <Text style={styles.cardTitle}>Iris Photo Consent</Text>
            <Text style={styles.divider}>─── ✦ ───</Text>
            <Text style={styles.introText}>
              Iris photos are processed by AI for your Oracle reading and are never stored on our servers. By continuing, you consent to this analysis.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.proceedBtn, pressed && { opacity: 0.85 }]}
              onPress={() => setBiometricConsentGiven(true)}
              accessibilityLabel="I consent — continue to iris capture"
              accessibilityRole="button"
            >
              <Text style={styles.proceedBtnText}>I Understand & Consent</Text>
              <Feather name="arrow-right" size={16} color={Colors.bg} />
            </Pressable>
          </Animated.View>
        ) : currentStep.intro ? (
          <Animated.View entering={FadeIn.duration(600)} style={styles.card}>
            <GoldSigil size={80} style={{ marginBottom: 20, alignSelf: "center" }} />
            <Text style={styles.cardTitle}>{currentStep.title}</Text>
            <Text style={styles.divider}>─── ✦ ───</Text>
            <Text style={styles.introText}>
              The Oracle reads what is written in your body — your palm lines, your iris patterns, your facial structure. These images are the foundation of your reading. Take your time. Good light matters.
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
        ) : isConsent ? (
          <Animated.View entering={FadeIn.duration(600)} style={styles.card}>
            <Text style={styles.cardTitle}>Biometric Data Consent</Text>
            <Text style={styles.divider}>─── ✦ ───</Text>
            <Text style={styles.introText}>
              The next steps capture close-up images of your eyes (iris). These images are used solely for your Oracle reading and are never shared with third parties.
            </Text>
            <Text style={[styles.introText, { marginTop: 8 }]}>
              By proceeding, you consent to The Oracle capturing and processing your iris images for the purpose of generating your personalized iridology reading. You can delete your data at any time from the Vault.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.proceedBtn, bioConsentGiven ? { opacity: 0.5 } : {}, pressed && { opacity: 0.85 }]}
              onPress={() => setBioConsentGiven(true)}
              disabled={bioConsentGiven}
              accessibilityLabel="I consent to iris image capture"
            >
              <Feather name={bioConsentGiven ? "check-circle" : "shield"} size={16} color={Colors.bg} />
              <Text style={styles.proceedBtnText}>{bioConsentGiven ? "Consent Given" : "I Consent"}</Text>
            </Pressable>
            {bioConsentGiven && (
              <Pressable
                style={({ pressed }) => [styles.proceedBtn, { marginTop: 8 }, pressed && { opacity: 0.85 }]}
                onPress={handleNext}
                accessibilityLabel="Continue to iris capture"
              >
                <Text style={styles.proceedBtnText}>Continue</Text>
                <Feather name="arrow-right" size={16} color={Colors.bg} />
              </Pressable>
            )}
            <Pressable
              style={styles.skipBtn}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.selectionAsync();
                }
                const nextNonIris = STEPS.findIndex((s, i) => i > step && s.key !== "right_iris" && s.key !== "left_iris");
                setStep(nextNonIris >= 0 ? nextNonIris : step + 1);
              }}
              accessibilityLabel="Skip iris capture"
            >
              <Text style={styles.skipText}>Skip Iris Capture</Text>
              <Feather name="skip-forward" size={14} color={Colors.muted} />
            </Pressable>
          </Animated.View>
        ) : isReview ? (
          /* Review card */
          <Animated.View entering={FadeIn.duration(600)} style={styles.card}>
            <Text style={styles.cardTitle}>Review & Submit</Text>
            <Text style={styles.divider}>─── ✦ ───</Text>

            <View style={styles.photoGrid}>
              {(["right_palm","left_palm","right_iris","left_iris","face","face_front","face_left","face_right"] as (keyof OracleImages)[]).map(key => {
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
                      <Text style={styles.thumbSkipped}>Archetypal analysis</Text>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.userSummary}>
              <Text style={styles.summaryName}>{state.userData.name}</Text>
              <Text style={styles.summaryDetail}>
                Born {state.userData.dob}
              </Text>
            </View>

            <Text style={styles.generatingNote}>
              Your complete reading takes 60–90 seconds to generate.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.revealBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
              onPress={saveToVaultAndReveal}
              accessibilityLabel="Reveal My Reading — generate Oracle reading"
              accessibilityRole="button"
            >
              <Text style={styles.revealBtnText}>Reveal My Reading</Text>
              <Feather name="eye" size={18} color={Colors.bg} />
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
                {currentStep.diagram === "palm" && <PalmDiagram />}
                {currentStep.diagram === "iris" && <IrisDiagram />}
                {currentStep.diagram === "iridology" && <IridologyDiagram />}
                {currentStep.diagram === "face_chinese" && <ChineseFaceDiagram />}
                {currentStep.diagram === "face_profile" && <ChineseFaceProfileDiagram />}
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
            {currentStep.multishot ? (
              canProceed() ? (
                <View>
                  <View style={styles.multishotPreviews}>
                    {(["face_front", "face_left", "face_right"] as (keyof OracleImages)[]).map(k => {
                      const img = state.images[k];
                      const label = k === "face_front" ? "Front" : k === "face_left" ? "Left" : "Right";
                      return (
                        <View key={k} style={styles.multishotThumb}>
                          {img ? (
                            <Image source={{ uri: img.uri }} style={styles.multishotThumbImg} />
                          ) : (
                            <View style={[styles.multishotThumbImg, styles.thumbEmpty]}>
                              <Feather name="minus" size={14} color={Colors.muted} />
                            </View>
                          )}
                          <Text style={styles.multishotLabel}>{label}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <Pressable
                    style={styles.retakeBtn}
                    onPress={openMultishot}
                    accessibilityLabel="Retake face reading session"
                    accessibilityRole="button"
                  >
                    <Feather name="refresh-cw" size={14} color={Colors.gold} />
                    <Text style={styles.retakeText}>Retake Session</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.8 }]}
                  onPress={openMultishot}
                  accessibilityLabel="Begin Face Reading Session — open camera"
                  accessibilityRole="button"
                >
                  <Feather name="camera" size={20} color={Colors.bg} />
                  <Text style={styles.captureBtnText}>Begin Face Reading Session</Text>
                </Pressable>
              )
            ) : state.images[currentStep.key!] ? (
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
  multishotPreviews: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
    justifyContent: "center",
  },
  multishotThumb: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  multishotThumbImg: {
    width: "100%",
    aspectRatio: 0.75,
    borderRadius: 8,
    resizeMode: "cover",
  },
  multishotLabel: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 11,
    color: Colors.cream,
    opacity: 0.7,
    textAlign: "center",
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
