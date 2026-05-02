import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import { getApiUrl } from "@/lib/api";

interface DailyEntry {
  content: string;
  date: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${dayNames[d.getUTCDay()]}, ${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function isToday(dateStr: string): boolean {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return dateStr === today;
}

export default function DailyHistoryScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ profileId: string; profileName: string }>();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const baseUrl = getApiUrl();
        const resp = await fetch(`${baseUrl}api/daily-history/${params.profileId}`);
        if (!resp.ok) throw new Error("Failed");
        const data = await resp.json();
        setEntries(data.entries);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [params.profileId]);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={22} color={Colors.gold} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Daily History</Text>
          {params.profileName && (
            <Text style={styles.headerSubtitle}>For {params.profileName}</Text>
          )}
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.gold} />
            <Text style={styles.loadingText}>Loading past entries…</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Could not retrieve your oracle history.</Text>
          </View>
        )}

        {!loading && !error && entries.length === 0 && (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyTitle}>No Messages Yet</Text>
            <Text style={styles.emptyText}>
              Return to the home screen to receive your first Daily Oracle message. A new check-in arrives each day.
            </Text>
          </View>
        )}

        {!loading && !error && entries.map((entry, idx) => (
          <Animated.View
            key={entry.date}
            entering={FadeInDown.duration(500).delay(idx * 80)}
            style={[styles.entryCard, isToday(entry.date) && styles.entryCardToday]}
          >
            <View style={styles.entryDateRow}>
              <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
              {isToday(entry.date) && <Text style={styles.todayBadge}>Today</Text>}
            </View>
            <Text style={styles.entryContent}>{entry.content}</Text>
          </Animated.View>
        ))}

        <View style={{ height: insets.bottom + 24 }} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 18,
    color: Colors.gold,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 13,
    color: Colors.muted,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  centerContainer: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 15,
    color: Colors.muted,
  },
  errorText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.muted,
    textAlign: "center",
  },
  emptyTitle: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 18,
    color: Colors.gold,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.1)",
    padding: 18,
    marginBottom: 14,
  },
  entryCardToday: {
    borderColor: "rgba(201,168,76,0.3)",
  },
  entryDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  entryDate: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 13,
    color: Colors.muted,
  },
  todayBadge: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 11,
    color: Colors.gold,
    backgroundColor: "rgba(201,168,76,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  entryContent: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.cream,
    lineHeight: 26,
    opacity: 0.92,
  },
});
