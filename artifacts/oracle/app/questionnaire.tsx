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
import { QUESTIONNAIRE_QUESTIONS } from "@/lib/questionnaireData";

type IconName = React.ComponentProps<typeof Feather>["name"];

const QUESTIONS = QUESTIONNAIRE_QUESTIONS;

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
