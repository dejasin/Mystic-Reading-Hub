import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import { useOracle, QuestionnaireAnswers } from "@/context/OracleContext";

type IconName = React.ComponentProps<typeof Feather>["name"];

interface Option {
  label: string;
  value: string;
  icon: IconName;
}

interface Question {
  field: keyof QuestionnaireAnswers;
  prompt: string;
  options: Option[];
}

// Task #60 — eight visual multiple-choice questions. Icons drawn from
// Feather (already in the app) chosen for closest visual match to the spec.
// `coreMotivation` values intentionally start with one of: Creator / Analyst
// / Connector / Explorer to match the indicator helper in profiles.tsx.
const QUESTIONS: Question[] = [
  {
    field: "decisionStyle",
    prompt: "How do you usually make important decisions?",
    options: [
      { label: "Trust my gut, decide fast", value: "Trust my gut, decide fast", icon: "zap" },
      { label: "Research everything first", value: "Research everything first", icon: "search" },
      { label: "Talk it through with people I trust", value: "Talk it through with people I trust", icon: "message-circle" },
      { label: "Wait until the answer feels obvious", value: "Wait until the answer feels obvious", icon: "clock" },
    ],
  },
  {
    field: "pressureResponse",
    prompt: "How do you tend to respond under real pressure?",
    options: [
      { label: "Push through, harder", value: "Push through, harder", icon: "shield" },
      { label: "Step back and observe", value: "Step back and observe", icon: "eye" },
      { label: "Reach out for support", value: "Reach out for support", icon: "users" },
      { label: "Withdraw to recharge alone", value: "Withdraw to recharge alone", icon: "moon" },
    ],
  },
  {
    field: "relationshipPattern",
    prompt: "What is your usual pattern in close relationships?",
    options: [
      { label: "I fall in fast and deep", value: "I fall in fast and deep", icon: "heart" },
      { label: "I keep my walls up at first", value: "I keep my walls up at first", icon: "lock" },
      { label: "I love completely once I'm in", value: "I love completely once I'm in", icon: "user-plus" },
      { label: "I keep one foot out the door", value: "I keep one foot out the door", icon: "star" },
    ],
  },
  {
    field: "coreMotivation",
    prompt: "What drives you most?",
    options: [
      { label: "Creator — Creating something meaningful", value: "Creator — Creating something meaningful", icon: "feather" },
      { label: "Analyst — Understanding how things work", value: "Analyst — Understanding how things work", icon: "settings" },
      { label: "Connector — Connecting deeply with others", value: "Connector — Connecting deeply with others", icon: "link-2" },
      { label: "Explorer — Living freely on my own terms", value: "Explorer — Living freely on my own terms", icon: "wind" },
    ],
  },
  {
    field: "biggestChallenge",
    prompt: "What's your biggest internal challenge right now?",
    options: [
      { label: "Fixing what feels broken", value: "Fixing what feels broken", icon: "tool" },
      { label: "Quieting overthinking", value: "Quieting overthinking", icon: "rotate-cw" },
      { label: "Holding onto hope", value: "Holding onto hope", icon: "sun" },
      { label: "Finishing what I start", value: "Finishing what I start", icon: "circle" },
    ],
  },
  {
    field: "energyStyle",
    prompt: "How does your energy move through the day?",
    options: [
      { label: "Bursts — intense, then crash", value: "Bursts — intense, then crash", icon: "zap" },
      { label: "Steady current — even all day", value: "Steady current — even all day", icon: "trending-up" },
      { label: "Waves — peaks and troughs", value: "Waves — peaks and troughs", icon: "activity" },
      { label: "Slow build — warms up over time", value: "Slow build — warms up over time", icon: "thermometer" },
    ],
  },
  {
    field: "currentNeed",
    prompt: "What do you most need right now?",
    options: [
      { label: "Connection with the right people", value: "Connection with the right people", icon: "users" },
      { label: "Direction — to know which way", value: "Direction — to know which way", icon: "compass" },
      { label: "Peace — to settle inside", value: "Peace — to settle inside", icon: "sun" },
      { label: "Freedom — to break a pattern", value: "Freedom — to break a pattern", icon: "unlock" },
    ],
  },
  {
    field: "selfPerception",
    prompt: "How do others see you vs. how you see yourself?",
    options: [
      { label: "They see a mask I wear well", value: "They see a mask I wear well", icon: "user" },
      { label: "They see half of who I am", value: "They see half of who I am", icon: "minimize-2" },
      { label: "They see clearly through me", value: "They see clearly through me", icon: "eye" },
      { label: "I'm not sure who they see", value: "I'm not sure who they see", icon: "help-circle" },
    ],
  },
];

export default function QuestionnaireScreen() {
  const insets = useSafeAreaInsets();
  const { setQuestionnaireAnswers } = useOracle();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({});
  const [building, setBuilding] = useState(false);

  const q = QUESTIONS[step];
  const total = QUESTIONS.length;
  const selectedValue = answers[q.field];

  const handleSelect = async (value: string) => {
    if (Platform.OS !== "web") {
      await Haptics.selectionAsync().catch(() => {});
    }
    setAnswers(prev => ({ ...prev, [q.field]: value }));
  };

  const handleNext = async () => {
    if (!selectedValue) return;
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (step < total - 1) {
      setStep(s => s + 1);
      return;
    }
    setBuilding(true);
    setQuestionnaireAnswers(answers as QuestionnaireAnswers);
    setTimeout(() => {
      router.replace("/ritual");
    }, 2000);
  };

  const handleBack = () => {
    if (step === 0) {
      router.back();
      return;
    }
    setStep(s => s - 1);
  };

  if (building) {
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <StarField />
        <Animated.View entering={FadeIn.duration(400)} style={styles.buildingContainer}>
          <Text style={styles.sigil}>✦</Text>
          <ActivityIndicator color={Colors.gold} size="large" style={{ marginVertical: 24 }} />
          <Text style={styles.buildingText}>Building your profile…</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12} accessibilityLabel="Go back" accessibilityRole="button">
          <Feather name="arrow-left" size={20} color={Colors.gold} />
        </Pressable>
        <Text style={styles.progress}>{step + 1} of {total}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${((step + 1) / total) * 100}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          key={`q-${step}`}
          entering={SlideInRight.duration(280)}
          exiting={FadeOut.duration(120)}
          style={styles.questionBlock}
        >
          <Text style={styles.prompt}>{q.prompt}</Text>

          <View style={styles.options}>
            {q.options.map((opt) => {
              const selected = selectedValue === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleSelect(opt.value)}
                  style={({ pressed }) => [
                    styles.optionCard,
                    selected && styles.optionCardSelected,
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityLabel={opt.label}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                    <Feather name={opt.icon} size={20} color={selected ? Colors.bg : Colors.gold} />
                  </View>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  {selected ? (
                    <Feather name="check" size={16} color={Colors.gold} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Pressable
          onPress={handleNext}
          disabled={!selectedValue}
          style={({ pressed }) => [
            styles.nextBtn,
            !selectedValue && styles.nextBtnDisabled,
            pressed && selectedValue && { opacity: 0.85 },
          ]}
          accessibilityLabel={step === total - 1 ? "Complete questionnaire" : "Next question"}
          accessibilityRole="button"
        >
          <Text style={[styles.nextText, !selectedValue && { color: Colors.muted }]}>
            {step === total - 1 ? "Complete" : "Next"}
          </Text>
          <Feather name="arrow-right" size={18} color={selectedValue ? Colors.bg : Colors.muted} />
        </Pressable>

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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  progress: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 13,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  progressBarTrack: {
    height: 2,
    marginHorizontal: 24,
    backgroundColor: Colors.inputBorder,
    borderRadius: 1,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.gold,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 24,
  },
  questionBlock: { gap: 24 },
  prompt: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 24,
    color: Colors.cream,
    textAlign: "center",
    lineHeight: 32,
  },
  options: { gap: 12 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    minHeight: 60,
  },
  optionCardSelected: {
    borderColor: Colors.gold,
    backgroundColor: "rgba(201,168,76,0.08)",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.inputBg,
  },
  iconWrapSelected: {
    backgroundColor: Colors.gold,
  },
  optionLabel: {
    flex: 1,
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.cream,
  },
  optionLabelSelected: {
    color: Colors.gold,
    fontFamily: "EBGaramond_500Medium",
  },
  nextBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
    minHeight: 54,
  },
  nextBtnDisabled: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  nextText: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 14,
    color: Colors.bg,
    letterSpacing: 1,
  },
  buildingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sigil: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 36,
    color: Colors.gold,
  },
  buildingText: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 18,
    color: Colors.cream,
    letterSpacing: 1,
  },
});
