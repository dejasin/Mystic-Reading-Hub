import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import { useOracle, UserData } from "@/context/OracleContext";
import { trackEvent, AnalyticsEvent } from "@/lib/analytics";
import { useReferral } from "@/context/ReferralContext";

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const HAND_OPTIONS = ["Right", "Left", "Ambidextrous"];

function SelectOption({
  options,
  value,
  onSelect,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={selectStyles.container}>
      {options.map(opt => (
        <Pressable
          key={opt}
          style={[selectStyles.option, value === opt && selectStyles.selected]}
          onPress={() => onSelect(opt)}
          accessibilityLabel={opt}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === opt }}
        >
          <Text style={[selectStyles.optionText, value === opt && selectStyles.selectedText]}>
            {opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const selectStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.inputBg,
  },
  selected: {
    borderColor: Colors.gold,
    backgroundColor: "rgba(201,168,76,0.15)",
  },
  optionText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.muted,
  },
  selectedText: {
    color: Colors.gold,
  },
});

interface FieldProps {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}

function Field({ label, optional, children }: FieldProps) {
  return (
    <View style={fieldStyles.container}>
      <View style={fieldStyles.labelRow}>
        <Text style={fieldStyles.label}>{label}</Text>
        {optional && <Text style={fieldStyles.optional}>(optional)</Text>}
      </View>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  container: { gap: 10 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 14,
    color: Colors.cream,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    opacity: 0.7,
  },
  optional: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 12,
    color: Colors.muted,
  },
});

function StyledInput({
  value,
  onChangeText,
  placeholder,
  multiline,
  type,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.muted}
      multiline={multiline}
      keyboardType={type === "date" ? "numbers-and-punctuation" : "default"}
      style={[
        inputStyles.input,
        focused && inputStyles.focused,
        multiline && inputStyles.multiline,
      ]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

const inputStyles = StyleSheet.create({
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.cream,
    minHeight: 48,
  },
  focused: {
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 14,
  },
});

export default function IntakeScreen() {
  const insets = useSafeAreaInsets();
  const { setUserData, state: oracleState } = useOracle();
  const { pendingReferralCode, redeemReferralCode, clearPendingReferralCode } = useReferral();

  const [referralCode, setReferralCode] = useState(pendingReferralCode ?? "");
  const [gender, setGender] = useState("");
  const [dominantHand, setDominantHand] = useState("");
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");

  const handleSubmit = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (referralCode.trim()) {
      const result = await redeemReferralCode(referralCode.trim());
      if (result.success) {
        Alert.alert("Referral Applied", result.message);
      } else {
        Alert.alert("Referral Code", result.message);
      }
    }

    // Task #65 — birth date / time / city / country are no longer
    // collected here. The behavioral questionnaire is the real
    // personalization signal.
    const userData: UserData = {
      name: "",
      gender,
      dominantHand,
      eyeColor: "",
      q1,
      q2,
      q3,
    };
    setUserData(userData);
    trackEvent(AnalyticsEvent.INTAKE_COMPLETED, {
      questions_answered: [q1, q2, q3].filter(q => q.trim()).length,
    });
    // Task #60 — first-time users go through the 8-question questionnaire
    // before the ritual. Returning users (questionnaireAnswers already
    // stored) skip straight to the ritual.
    if (oracleState.questionnaireAnswers) {
      router.push("/ritual");
    } else {
      router.push("/questionnaire");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12} accessibilityLabel="Go back" accessibilityRole="button">
          <Feather name="arrow-left" size={20} color={Colors.gold} />
        </Pressable>
        <Text style={styles.headerTitle}>Prepare for Your Behavioral Analysis</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Referral Code" optional>
          <View style={styles.referralRow}>
            <View style={{ flex: 1 }}>
              <StyledInput
                value={referralCode}
                onChangeText={(v) => setReferralCode(v.toUpperCase())}
                placeholder="Enter a friend's code"
              />
            </View>
            {referralCode.trim() !== "" && (
              <Pressable
                onPress={() => {
                  setReferralCode("");
                  clearPendingReferralCode();
                }}
                style={styles.referralClearBtn}
                hitSlop={8}
              >
                <Feather name="x" size={16} color={Colors.muted} />
              </Pressable>
            )}
          </View>
        </Field>

        <Text style={styles.divider}>─── ✦ ───</Text>

        <Field label="Gender" optional>
          <SelectOption options={GENDER_OPTIONS} value={gender} onSelect={setGender} />
        </Field>

        <Field label="Dominant Hand" optional>
          <SelectOption options={HAND_OPTIONS} value={dominantHand} onSelect={setDominantHand} />
        </Field>

        <Text style={styles.divider}>─── ✦ ───</Text>
        <Text style={styles.questionsHeader}>Life Questions</Text>
        <Text style={styles.questionsSubtext}>
          What do you most want Oracle to help you with?
        </Text>

        <Field label="Question 1" optional>
          <StyledInput
            value={q1}
            onChangeText={setQ1}
            placeholder="What do you most want to understand?"
            multiline
          />
        </Field>

        <Field label="Question 2" optional>
          <StyledInput
            value={q2}
            onChangeText={setQ2}
            placeholder="What pattern keeps repeating in your life?"
            multiline
          />
        </Field>

        <Field label="Question 3" optional>
          <StyledInput
            value={q3}
            onChangeText={setQ3}
            placeholder="What decision are you approaching?"
            multiline
          />
        </Field>

        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
          onPress={handleSubmit}
          accessibilityLabel="Begin Behavioral Capture — proceed to photo capture"
          accessibilityRole="button"
        >
          <Text style={styles.submitText}>Begin Behavioral Capture</Text>
          <Feather name="arrow-right" size={18} color={Colors.bg} />
        </Pressable>

        <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 14,
    color: Colors.cream,
    flex: 1,
    letterSpacing: 0.5,
  },
  form: {
    paddingHorizontal: 24,
    gap: 24,
    paddingBottom: 20,
  },
  divider: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 4,
    opacity: 0.7,
    marginVertical: 4,
  },
  questionsHeader: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 15,
    color: Colors.gold,
    letterSpacing: 1,
    textAlign: "center",
  },
  questionsSubtext: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    marginTop: -8,
  },
  submitBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
    minHeight: 56,
  },
  submitText: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 13,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  referralRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  referralClearBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
