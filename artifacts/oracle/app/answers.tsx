import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import { useOracle } from "@/context/OracleContext";
import { QUESTIONNAIRE_QUESTIONS } from "@/lib/questionnaireData";

// Review screen — shows the seeker every saved questionnaire answer at
// once and lets them tap any single answer to re-open just that question
// for editing. Saved edits update the AsyncStorage record (in
// OracleContext) but do NOT touch any existing reading text, archetype,
// or deep-dive content, so past readings remain intact.
export default function AnswersScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useOracle();
  const answers = state.questionnaireAnswers;

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    router.back();
  };

  const goToQuestion = (field: string) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    router.push({
      pathname: "/questionnaire",
      params: { field, returnTo: "/answers" },
    });
  };

  const goToFullRetake = () => {
    router.push("/questionnaire");
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 67 : insets.top },
      ]}
    >
      <StarField />

      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={12}
        >
          <Feather name="arrow-left" size={22} color={Colors.gold} />
        </Pressable>
        <Text style={styles.headerTitle}>Your Answers</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(500)} style={styles.intro}>
          <Text style={styles.introText}>
            These are the answers shaping your readings. Tap any one to
            update it — your past readings stay exactly as they were.
          </Text>
        </Animated.View>

        {!answers ? (
          <Animated.View
            entering={FadeIn.duration(500).delay(100)}
            style={styles.emptyCard}
          >
            <Feather name="edit-3" size={20} color={Colors.gold} />
            <Text style={styles.emptyTitle}>No answers saved yet</Text>
            <Text style={styles.emptyBody}>
              Take the 8-question questionnaire so your readings can be
              tailored to you.
            </Text>
            <Pressable
              onPress={goToFullRetake}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityLabel="Take questionnaire"
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>Take Questionnaire</Text>
              <Feather name="arrow-right" size={16} color={Colors.bg} />
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.list}>
            {QUESTIONNAIRE_QUESTIONS.map((q, i) => {
              const value = answers[q.field];
              const selected = q.options.find((o) => o.value === value);
              return (
                <Animated.View
                  key={q.field}
                  entering={FadeIn.duration(400).delay(60 * i)}
                >
                  <Pressable
                    onPress={() => goToQuestion(q.field)}
                    style={({ pressed }) => [
                      styles.answerCard,
                      pressed && { opacity: 0.85 },
                    ]}
                    accessibilityLabel={`Edit answer to: ${q.prompt}. Current answer: ${value || "not set"}`}
                    accessibilityRole="button"
                  >
                    <View style={styles.answerLeft}>
                      <Text style={styles.questionText}>{q.prompt}</Text>
                      <View style={styles.answerRow}>
                        {selected ? (
                          <View style={styles.iconWrap}>
                            <Feather
                              name={selected.icon as any}
                              size={14}
                              color={Colors.gold}
                            />
                          </View>
                        ) : null}
                        <Text
                          style={[
                            styles.answerText,
                            !value && styles.answerMissing,
                          ]}
                        >
                          {value || "No answer yet — tap to choose"}
                        </Text>
                      </View>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={Colors.muted}
                    />
                  </Pressable>
                </Animated.View>
              );
            })}

            <Animated.View entering={FadeIn.duration(400).delay(540)}>
              <Pressable
                onPress={goToFullRetake}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityLabel="Retake the entire questionnaire from the start"
                accessibilityRole="button"
              >
                <Feather name="refresh-cw" size={14} color={Colors.gold} />
                <Text style={styles.secondaryBtnText}>
                  Retake from the start
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        )}

        <View
          style={{
            height: Platform.OS === "web" ? 34 : insets.bottom + 20,
          }}
        />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 20,
    color: Colors.gold,
    letterSpacing: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  intro: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 16,
  },
  introText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 15,
    lineHeight: 22,
    color: Colors.muted,
    textAlign: "center",
  },
  list: {
    gap: 12,
  },
  answerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    minHeight: 72,
  },
  answerLeft: {
    flex: 1,
    gap: 8,
  },
  questionText: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 16,
    color: Colors.cream,
    lineHeight: 22,
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(201,168,76,0.12)",
  },
  answerText: {
    flex: 1,
    fontFamily: "EBGaramond_500Medium",
    fontSize: 14,
    color: Colors.gold,
    lineHeight: 20,
  },
  answerMissing: {
    color: Colors.muted,
    fontStyle: "italic",
    fontFamily: "EBGaramond_400Regular_Italic",
  },
  secondaryBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.surface,
  },
  secondaryBtnText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 14,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 18,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  emptyBody: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.cream,
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.85,
  },
  primaryBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: Colors.gold,
  },
  primaryBtnText: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 14,
    color: Colors.bg,
    letterSpacing: 1,
  },
});
