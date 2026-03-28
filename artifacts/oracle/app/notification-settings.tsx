import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  Platform,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import { getDeviceId } from "@/lib/notifications";

interface Preferences {
  dailyPrompts: boolean;
  weeklyForecasts: boolean;
  reEngagement: boolean;
}

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>({
    dailyPrompts: true,
    weeklyForecasts: true,
    reEngagement: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const deviceId = await getDeviceId();
      const baseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
      const response = await fetch(`${baseUrl}/api/notifications/preferences/${deviceId}`);
      if (response.ok) {
        const data = await response.json();
        setPrefs({
          dailyPrompts: data.dailyPrompts,
          weeklyForecasts: data.weeklyForecasts,
          reEngagement: data.reEngagement,
        });
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updatePreference(key: keyof Preferences, value: boolean) {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    setSaving(true);
    try {
      const deviceId = await getDeviceId();
      const baseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
      await fetch(`${baseUrl}/api/notifications/preferences/${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      console.error("Failed to update preference:", error);
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  }

  const NOTIFICATION_TYPES = [
    {
      key: "dailyPrompts" as const,
      title: "Daily Mystical Prompts",
      description: "Receive a daily cosmic insight crafted for your unique energy signature.",
      icon: "sun" as const,
    },
    {
      key: "weeklyForecasts" as const,
      title: "Weekly Cosmic Forecasts",
      description: "A weekly overview of the celestial currents shaping your path ahead.",
      icon: "calendar" as const,
    },
    {
      key: "reEngagement" as const,
      title: "Cosmic Reminders",
      description: "Gentle nudges when the stars have shifted and new patterns await your discovery.",
      icon: "star" as const,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color={Colors.gold} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : (
        <Animated.View entering={FadeIn.duration(600)} style={styles.content}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          <Text style={styles.sectionDescription}>
            Choose which cosmic transmissions you wish to receive.
          </Text>

          <View style={styles.toggleList}>
            {NOTIFICATION_TYPES.map((item) => (
              <View key={item.key} style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <View style={styles.toggleTitleRow}>
                    <Feather name={item.icon} size={16} color={Colors.gold} />
                    <Text style={styles.toggleTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.toggleDescription}>{item.description}</Text>
                </View>
                <Switch
                  value={prefs[item.key]}
                  onValueChange={(val) => updatePreference(item.key, val)}
                  trackColor={{ false: Colors.inputBg, true: Colors.glowStrong }}
                  thumbColor={prefs[item.key] ? Colors.gold : Colors.muted}
                  ios_backgroundColor={Colors.inputBg}
                />
              </View>
            ))}
          </View>

          {saving && (
            <Text style={styles.savingText}>Saving...</Text>
          )}
        </Animated.View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 18,
    color: Colors.gold,
    letterSpacing: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  sectionTitle: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 16,
    color: Colors.cream,
    marginBottom: 8,
    letterSpacing: 1,
  },
  sectionDescription: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 15,
    color: Colors.muted,
    marginBottom: 32,
    lineHeight: 22,
  },
  toggleList: {
    gap: 24,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  toggleTitle: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 16,
    color: Colors.cream,
  },
  toggleDescription: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 20,
    paddingLeft: 24,
  },
  savingText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    marginTop: 16,
  },
});
