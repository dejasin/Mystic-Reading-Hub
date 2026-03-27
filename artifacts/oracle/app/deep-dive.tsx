import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { fetch } from "expo/fetch";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import ExpandableParagraph from "@/components/ExpandableParagraph";
import { useOracle, DeepDiveCategory } from "@/context/OracleContext";
import { useProfiles } from "@/context/ProfileContext";
import { useSubscription } from "@/lib/revenuecat";

type CategoryKey = DeepDiveCategory;
type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface CategoryConfig {
  label: string;
  icon: FeatherIconName;
  color: string;
  description: string;
  fields: FieldConfig[];
}

interface FieldConfig {
  key: string;
  label: string;
  placeholder?: string;
  optional?: boolean;
  type: "text" | "select" | "multiline";
  options?: string[];
}

const CATEGORIES: Record<CategoryKey, CategoryConfig> = {
  career: {
    label: "Career",
    icon: "briefcase",
    color: "#c9a84c",
    description: "Your path, purpose & professional destiny",
    fields: [
      { key: "occupation", label: "Current Occupation / Industry", placeholder: "e.g. Software engineer, healthcare, freelance", type: "text" },
      { key: "goal", label: "Career Goal", placeholder: "What do you most want to achieve professionally?", type: "multiline" },
      { key: "challenge", label: "Biggest Challenge at Work", placeholder: "What is holding you back or creating friction?", type: "multiline" },
      { key: "timeline", label: "Timeline for Change", placeholder: "e.g. Within 6 months, within 2 years", type: "text", optional: true },
    ],
  },
  relationship: {
    label: "Relationship",
    icon: "heart",
    color: "#b87b7b",
    description: "The patterns, bonds & love that shape you",
    fields: [
      { key: "status", label: "Relationship Status", type: "select", options: ["Single", "Partnered", "Married", "It's complicated"] },
      { key: "partnerName", label: "Partner's Name", placeholder: "If applicable", type: "text", optional: true },
      { key: "goal", label: "Relationship Goal", placeholder: "What do you want most in love right now?", type: "multiline" },
      { key: "pattern", label: "Recurring Pattern in Love", placeholder: "What keeps repeating across relationships?", type: "multiline" },
    ],
  },
  finances: {
    label: "Finances",
    icon: "trending-up",
    color: "#7bc4a0",
    description: "Wealth, flow & your relationship with money",
    fields: [
      { key: "situation", label: "Current Financial Situation", type: "select", options: ["Stable", "Growing", "Struggling", "Rebuilding"] },
      { key: "goal", label: "Primary Financial Goal", placeholder: "What does financial success look like for you?", type: "multiline" },
      { key: "block", label: "Biggest Money Block", placeholder: "What pattern keeps limiting your financial growth?", type: "multiline" },
      { key: "timeline", label: "Timeline Goal", placeholder: "e.g. Debt-free in 1 year, six figures by 30", type: "text", optional: true },
    ],
  },
  fitness: {
    label: "Fitness",
    icon: "activity",
    color: "#8b9fd4",
    description: "Vitality, body wisdom & physical potential",
    fields: [
      { key: "routine", label: "Current Routine", type: "select", options: ["None", "Light", "Moderate", "Intense"] },
      { key: "goal", label: "Primary Fitness Goal", placeholder: "What do you want to achieve physically?", type: "multiline" },
      { key: "concerns", label: "Health Concerns", placeholder: "Any limitations, injuries or health conditions?", type: "text", optional: true },
      { key: "lifestyle", label: "Desired Lifestyle Change", placeholder: "How do you want your relationship with your body to change?", type: "multiline" },
    ],
  },
  family: {
    label: "Family",
    icon: "users",
    color: "#c9a04c",
    description: "Roots, bonds & the legacy you carry",
    fields: [
      { key: "children", label: "Children & Ages", placeholder: "e.g. Two kids, ages 4 and 7 / None / Expecting", type: "text", optional: true },
      { key: "role", label: "Family Role", type: "select", options: ["Parent", "Sibling", "Caregiver", "Building a family"] },
      { key: "challenge", label: "Biggest Family Challenge", placeholder: "What pattern or tension is most present right now?", type: "multiline" },
      { key: "goal", label: "Family Goal", placeholder: "What do you most want to heal, build, or create in your family?", type: "multiline" },
    ],
  },
};

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
  container: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
  selectedText: { color: Colors.gold },
});

function StyledInput({
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.muted}
      multiline={multiline}
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

interface ReadingSectionProps {
  text: string;
  sessionId?: string;
  userData?: string;
  isSubscribed?: boolean;
}

function ReadingSection({ text, sessionId, userData, isSubscribed }: ReadingSectionProps) {
  if (!text) return null;
  const sections = text.split(/(?=✦\s)/);
  return (
    <>
      {sections.map((section, i) => {
        if (!section.trim()) return null;
        const lines = section.trim().split("\n");
        const heading = lines[0].startsWith("✦") ? lines[0] : null;
        const body = heading ? lines.slice(1).join("\n").trim() : section.trim();
        // Split body into individual paragraphs for per-paragraph long-press
        const paragraphs = body.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
        return (
          <Animated.View key={i} entering={FadeIn.duration(600).delay(i * 100)} style={sectionStyles.container}>
            {heading && <Text style={sectionStyles.heading}>{heading}</Text>}
            <Text style={sectionStyles.divider}>─── ✦ ───</Text>
            {sessionId && userData ? (
              paragraphs.map((para, j) => (
                <ExpandableParagraph
                  key={j}
                  text={para}
                  sessionId={sessionId}
                  userData={userData}
                  isSubscribed={isSubscribed ?? false}
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

export default function DeepDiveScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();
  const { state, appendDeepDive, clearDeepDive } = useOracle();
  const { profiles, updateProfile } = useProfiles();
  const { customerInfo } = useSubscription();

  const VALID_CATEGORIES: CategoryKey[] = ["career", "relationship", "finances", "fitness", "family"];
  const rawCat = params.category as string | undefined;
  const initCat: CategoryKey | null = rawCat && VALID_CATEGORIES.includes(rawCat as CategoryKey)
    ? (rawCat as CategoryKey)
    : null;
  const existingContent = initCat ? (state.deepDives[initCat] ?? "") : "";

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(initCat);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState(existingContent);
  const [isDone, setIsDone] = useState(existingContent.length > 0);
  const [errorMsg, setErrorMsg] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const getApiUrl = () => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (domain) return `https://${domain}/`;
    return "/";
  };

  const saveDeepDiveToVault = async (category: DeepDiveCategory, text: string) => {
    const { name, dob } = state.userData;
    if (!name || !dob) return;
    const profile = profiles.find(
      p => p.name.trim().toLowerCase() === name.trim().toLowerCase() && p.dob === dob
    );
    if (profile) {
      await updateProfile(profile.id, {
        deepDives: { ...(profile.deepDives ?? {}), [category]: text },
      });
    }
  };

  const handleCategorySelect = (cat: CategoryKey) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    const stored = state.deepDives[cat] ?? "";
    setSelectedCategory(cat);
    setFormValues({});
    setStreamedText(stored);
    setIsDone(stored.length > 0);
    setErrorMsg("");
  };

  const handleBack = () => {
    if (isDone || isStreaming) {
      setSelectedCategory(null);
      setStreamedText("");
      setIsDone(false);
      setIsStreaming(false);
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setFormValues({});
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategory) return;
    const config = CATEGORIES[selectedCategory];

    const requiredFields = config.fields.filter(f => !f.optional);
    for (const field of requiredFields) {
      if (!formValues[field.key]?.trim()) {
        setErrorMsg(`Please fill in: ${field.label}`);
        return;
      }
    }
    setErrorMsg("");

    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    clearDeepDive(selectedCategory);
    setStreamedText("");
    setIsStreaming(true);
    setIsDone(false);

    const baseUrl = getApiUrl();
    let accumulatedText = "";

    try {
      const response = await fetch(`${baseUrl}api/deep-dive`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          category: selectedCategory,
          categoryData: formValues,
          userData: state.userData,
        }),
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
              setErrorMsg(parsed.message ?? "The Oracle could not complete this reading.");
              setIsStreaming(false);
              return;
            }
            if (parsed.event === "complete") {
              setIsStreaming(false);
              setIsDone(true);
              await saveDeepDiveToVault(selectedCategory, accumulatedText);
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              return;
            }
            if (parsed.chunk) {
              accumulatedText += parsed.chunk;
              appendDeepDive(selectedCategory, parsed.chunk);
              setStreamedText(prev => prev + parsed.chunk);
              scrollRef.current?.scrollToEnd({ animated: true });
            }
          } catch (e) {
            console.warn("SSE parse error (deep dive):", e);
          }
        }
      }

      setIsStreaming(false);
      setIsDone(true);
      await saveDeepDiveToVault(selectedCategory, accumulatedText);
    } catch {
      setErrorMsg("The Oracle is temporarily unavailable. Please try again.");
      setIsStreaming(false);
    }
  };

  const cat = selectedCategory ? CATEGORIES[selectedCategory] : null;
  const showReading = isStreaming || streamedText.length > 0;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={20} color={Colors.gold} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {selectedCategory && showReading
            ? `${cat?.label} Deep Dive`
            : selectedCategory
            ? `${cat?.label} — Your Context`
            : "Explore Further"}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!selectedCategory && (
          <Animated.View entering={FadeIn.duration(600)}>
            <Text style={styles.sectionTitle}>Deep Dive</Text>
            <Text style={styles.sectionSubtitle}>
              Select a life area for a targeted reading woven from your Oracle profile.
            </Text>
            <Text style={styles.divider}>─── ✦ ───</Text>

            <View style={styles.categoryGrid}>
              {(Object.keys(CATEGORIES) as CategoryKey[]).map((key, i) => {
                const c = CATEGORIES[key];
                const isDone = (state.deepDives[key]?.length ?? 0) > 0;
                return (
                  <Animated.View key={key} entering={FadeInDown.duration(400).delay(i * 80)} style={styles.categoryCardWrapper}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.categoryCard,
                        isDone && styles.categoryCardDone,
                        pressed && styles.categoryCardPressed,
                      ]}
                      onPress={() => handleCategorySelect(key)}
                    >
                      <Feather name={c.icon} size={22} color={isDone ? Colors.bg : Colors.gold} />
                      <Text style={[styles.categoryLabel, isDone && styles.categoryLabelDone]}>{c.label}</Text>
                      <Text style={[styles.categoryDesc, isDone && styles.categoryDescDone]} numberOfLines={2}>
                        {isDone ? "Tap to revisit" : c.description}
                      </Text>
                      {isDone && (
                        <View style={styles.doneTag}>
                          <Feather name="check" size={11} color={Colors.bg} />
                          <Text style={styles.doneTagText}>Done</Text>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {selectedCategory && !showReading && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.formContainer}>
            <View style={styles.categoryHeaderRow}>
              <Feather name={cat!.icon} size={20} color={Colors.gold} />
              <Text style={styles.formTitle}>{cat!.label}</Text>
            </View>
            <Text style={styles.formSubtitle}>{cat!.description}</Text>
            <Text style={styles.divider}>─── ✦ ───</Text>
            <Text style={styles.formInstructions}>
              Give The Oracle context to weave a precise reading for this area of your life.
            </Text>

            <View style={styles.fields}>
              {cat!.fields.map(field => (
                <View key={field.key} style={styles.fieldContainer}>
                  <View style={styles.fieldLabelRow}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    {field.optional && <Text style={styles.fieldOptional}>(optional)</Text>}
                  </View>
                  {field.type === "select" ? (
                    <SelectOption
                      options={field.options!}
                      value={formValues[field.key] ?? ""}
                      onSelect={v => setFormValues(prev => ({ ...prev, [field.key]: v }))}
                    />
                  ) : (
                    <StyledInput
                      value={formValues[field.key] ?? ""}
                      onChangeText={v => setFormValues(prev => ({ ...prev, [field.key]: v }))}
                      placeholder={field.placeholder}
                      multiline={field.type === "multiline"}
                    />
                  )}
                </View>
              ))}
            </View>

            {errorMsg ? (
              <Text style={styles.errorText}>{errorMsg}</Text>
            ) : null}

            <Pressable
              style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
              onPress={handleSubmit}
            >
              <Feather name="eye" size={17} color={Colors.bg} />
              <Text style={styles.submitText}>Reveal My {cat!.label} Reading</Text>
            </Pressable>
          </Animated.View>
        )}

        {selectedCategory && showReading && (
          <Animated.View entering={FadeIn.duration(600)} style={styles.readingContainer}>
            <Text style={styles.readingHeader}>{cat!.label.toUpperCase()} DEEP DIVE</Text>
            <Text style={styles.readingSubheader}>{state.userData.name}</Text>
            <Text style={styles.divider}>─── ✦ ───</Text>

            {streamedText.length > 0 && (
              <ReadingSection
                text={streamedText}
                sessionId={state.sessionId}
                userData={JSON.stringify(state.userData)}
                isSubscribed={!!(customerInfo?.entitlements?.active?.["full_reading"])}
              />
            )}

            {isStreaming && (
              <View style={styles.streamingRow}>
                <Text style={styles.streamingText}>The Oracle speaks...</Text>
              </View>
            )}

            {isDone && (
              <Animated.View entering={FadeIn.duration(600)} style={styles.doneActions}>
                <Text style={styles.divider}>─── ✦ ───</Text>
                <Pressable
                  style={({ pressed }) => [styles.anotherBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Feather name="grid" size={16} color={Colors.gold} />
                  <Text style={styles.anotherBtnText}>Explore Another Area</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.reReadBtn, pressed && { opacity: 0.75 }]}
                  onPress={() => {
                    setStreamedText("");
                    setIsDone(false);
                    setFormValues({});
                  }}
                >
                  <Feather name="refresh-cw" size={14} color={Colors.muted} />
                  <Text style={styles.reReadText}>Update Context & Re-Read</Text>
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>
        )}
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
    paddingVertical: 14,
    justifyContent: "space-between",
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 13,
    color: Colors.cream,
    letterSpacing: 0.5,
    flex: 1,
    textAlign: "center",
  },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 8,
    gap: 16,
  },
  sectionTitle: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 18,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 1,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 15,
    color: Colors.muted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 24,
  },
  divider: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 13,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 4,
    opacity: 0.6,
    marginVertical: 8,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  categoryCardWrapper: {
    width: "47%",
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    padding: 18,
    gap: 8,
    minHeight: 130,
    alignItems: "flex-start",
  },
  categoryCardDone: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  categoryCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  categoryLabel: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 12,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  categoryLabelDone: {
    color: Colors.bg,
  },
  categoryDesc: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 19,
  },
  categoryDescDone: {
    color: Colors.bg,
    opacity: 0.8,
  },
  doneTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  doneTagText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 12,
    color: Colors.bg,
  },
  formContainer: {
    gap: 16,
    paddingTop: 4,
  },
  categoryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
  },
  formTitle: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 16,
    color: Colors.gold,
    letterSpacing: 1,
  },
  formSubtitle: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  formInstructions: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 15,
    color: Colors.cream,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 24,
  },
  fields: { gap: 20 },
  fieldContainer: { gap: 10 },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fieldLabel: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 14,
    color: Colors.cream,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    opacity: 0.7,
  },
  fieldOptional: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 12,
    color: Colors.muted,
  },
  errorText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    color: Colors.error,
    textAlign: "center",
  },
  submitBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
    minHeight: 56,
  },
  submitText: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 12,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  readingContainer: { gap: 8, paddingTop: 4 },
  readingHeader: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 13,
    color: Colors.gold,
    letterSpacing: 3,
    textAlign: "center",
  },
  readingSubheader: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 15,
    color: Colors.muted,
    textAlign: "center",
    marginTop: 2,
  },
  streamingRow: {
    alignItems: "center",
    paddingVertical: 12,
  },
  streamingText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    color: Colors.gold,
    opacity: 0.7,
  },
  doneActions: {
    alignItems: "center",
    gap: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
  anotherBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
  },
  anotherBtnText: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 12,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  reReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  reReadText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.muted,
  },
});
