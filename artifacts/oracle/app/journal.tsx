import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import { useJournal, JournalEntry, ReadingType } from "@/context/JournalContext";

const TYPE_CONFIG: Record<ReadingType, { icon: React.ComponentProps<typeof Feather>["name"]; color: string }> = {
  "Full Reading": { icon: "eye", color: Colors.gold },
  "Deep Dive": { icon: "compass", color: "#8b9fd4" },
  "Synastry": { icon: "heart", color: "#b87b7b" },
  "Profile Reading": { icon: "user", color: "#7bc4a0" },
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function EntryCard({ entry, onPress, onToggleFavorite }: {
  entry: JournalEntry;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const config = TYPE_CONFIG[entry.readingType];

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
        onPress={onPress}
        accessibilityLabel={`${entry.readingType} from ${formatDate(entry.date)}`}
        accessibilityRole="button"
      >
        <View style={styles.cardHeader}>
          <View style={styles.typeBadge}>
            <Feather name={config.icon} size={12} color={config.color} />
            <Text style={[styles.typeText, { color: config.color }]}>{entry.readingType}</Text>
          </View>
          <Pressable
            onPress={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            hitSlop={12}
            style={styles.favBtn}
            accessibilityLabel={entry.favorite ? "Remove from favorites" : "Add to favorites"}
            accessibilityRole="button"
          >
            <Feather
              name={entry.favorite ? "star" : "star"}
              size={18}
              color={entry.favorite ? Colors.gold : Colors.muted}
              style={entry.favorite ? { opacity: 1 } : { opacity: 0.5 }}
            />
          </Pressable>
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>{entry.title}</Text>
        <Text style={styles.cardPreview} numberOfLines={2}>{entry.preview}</Text>

        {entry.metadata?.profileNames && entry.metadata.profileNames.length === 2 && (
          <View style={styles.profilesRow}>
            <Feather name="users" size={12} color={Colors.muted} />
            <Text style={styles.profilesText}>
              {entry.metadata.profileNames[0]} & {entry.metadata.profileNames[1]}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
          <Text style={styles.timeText}>{formatTime(entry.date)}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { entries, toggleFavorite } = useJournal();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filteredEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.date - a.date);
    if (showFavoritesOnly) return sorted.filter(e => e.favorite);
    return sorted;
  }, [entries, showFavoritesOnly]);

  const favoriteCount = useMemo(() => entries.filter(e => e.favorite).length, [entries]);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={20} color={Colors.gold} />
        </Pressable>
        <Text style={styles.headerTitle}>Journal</Text>
        <Pressable
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          style={styles.filterBtn}
          hitSlop={12}
          accessibilityLabel={showFavoritesOnly ? "Show all readings" : "Show favorites only"}
          accessibilityRole="button"
        >
          <Feather
            name="star"
            size={20}
            color={showFavoritesOnly ? Colors.gold : Colors.muted}
          />
          {favoriteCount > 0 && showFavoritesOnly && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{favoriteCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {filteredEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="book-open" size={48} color={Colors.muted} style={{ opacity: 0.4 }} />
          <Text style={styles.emptyTitle}>
            {showFavoritesOnly ? "No Favorites Yet" : "Your Journal Awaits"}
          </Text>
          <Text style={styles.emptyText}>
            {showFavoritesOnly
              ? "Star your most meaningful readings to find them here."
              : "Complete a reading and it will appear here — a record of everything The Oracle has revealed to you."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={e => e.id}
          renderItem={({ item }) => (
            <EntryCard
              entry={item}
              onPress={() => router.push({ pathname: "/journal-detail", params: { entryId: item.id } })}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 18,
    color: Colors.cream,
    letterSpacing: 1,
  },
  filterBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: Colors.gold,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 10,
    color: Colors.bg,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.15)",
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(201,168,76,0.08)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  favBtn: {
    padding: 4,
  },
  cardTitle: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 14,
    color: Colors.cream,
    letterSpacing: 0.3,
  },
  cardPreview: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 20,
  },
  profilesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profilesText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 13,
    color: Colors.muted,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  dateText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 12,
    color: Colors.muted,
    opacity: 0.7,
  },
  timeText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 12,
    color: Colors.muted,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 18,
    color: Colors.cream,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  emptyText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 15,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 24,
  },
});
