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
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import { useJournal, ReadingType } from "@/context/JournalContext";

const TYPE_CONFIG: Record<ReadingType, { icon: React.ComponentProps<typeof Feather>["name"]; color: string; label: string }> = {
  "Full Reading": { icon: "eye", color: Colors.gold, label: "Full Session" },
  "Deep Dive": { icon: "compass", color: "#8b9fd4", label: "Deep Dive" },
  "Synastry": { icon: "heart", color: "#b87b7b", label: "Synastry" },
  "Profile Reading": { icon: "user", color: "#7bc4a0", label: "Profile Session" },
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function ReadingContent({ text }: { text: string }) {
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
          <Animated.View key={i} entering={FadeIn.duration(600).delay(i * 80)} style={contentStyles.section}>
            {heading && <Text style={contentStyles.heading}>{heading}</Text>}
            {heading && <Text style={contentStyles.divider}>─── ✦ ───</Text>}
            {paragraphs.map((para, j) => (
              <Text key={j} style={contentStyles.paragraph}>{para}</Text>
            ))}
          </Animated.View>
        );
      })}
    </>
  );
}

const contentStyles = StyleSheet.create({
  section: {
    gap: 12,
    marginBottom: 24,
  },
  heading: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 15,
    color: Colors.gold,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  divider: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 13,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 4,
    opacity: 0.5,
    marginVertical: 4,
  },
  paragraph: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 17,
    color: Colors.cream,
    lineHeight: 28,
    opacity: 0.92,
  },
});

export default function JournalDetailScreen() {
  const insets = useSafeAreaInsets();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const { getEntry, toggleFavorite } = useJournal();

  const entry = entryId ? getEntry(entryId) : undefined;

  if (!entry) {
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <StarField />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12} accessibilityLabel="Go back" accessibilityRole="button">
            <Feather name="arrow-left" size={20} color={Colors.gold} />
          </Pressable>
          <Text style={styles.headerTitle}>Journal</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Entry not found.</Text>
        </View>
      </View>
    );
  }

  const config = TYPE_CONFIG[entry.readingType];

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12} accessibilityLabel="Go back" accessibilityRole="button">
          <Feather name="arrow-left" size={20} color={Colors.gold} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{entry.title}</Text>
        <Pressable
          onPress={() => toggleFavorite(entry.id)}
          style={styles.favBtn}
          hitSlop={12}
          accessibilityLabel={entry.favorite ? "Remove from favorites" : "Add to favorites"}
          accessibilityRole="button"
        >
          <Feather
            name="star"
            size={20}
            color={entry.favorite ? Colors.gold : Colors.muted}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(600)} style={styles.meta}>
          <View style={styles.typeBadge}>
            <Feather name={config.icon} size={13} color={config.color} />
            <Text style={[styles.typeText, { color: config.color }]}>{config.label}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
          {entry.metadata?.category && (
            <Text style={styles.categoryText}>{entry.metadata.category}</Text>
          )}
          {entry.metadata?.profileNames && entry.metadata.profileNames.length === 2 && (
            <View style={styles.profilesRow}>
              <Feather name="users" size={13} color={Colors.muted} />
              <Text style={styles.profilesText}>
                {entry.metadata.profileNames[0]} & {entry.metadata.profileNames[1]}
              </Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.dividerLine} />

        <ReadingContent text={entry.fullText} />
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 14,
    color: Colors.cream,
    letterSpacing: 0.3,
    textAlign: "center",
    marginHorizontal: 8,
  },
  favBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  meta: {
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(201,168,76,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  typeText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  dateText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.muted,
  },
  categoryText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    color: Colors.gold,
    opacity: 0.8,
  },
  profilesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profilesText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    color: Colors.muted,
  },
  dividerLine: {
    height: 1,
    backgroundColor: "rgba(201,168,76,0.15)",
    marginVertical: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.muted,
  },
});
