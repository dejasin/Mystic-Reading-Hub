import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import { useSubscription } from "@/lib/revenuecat";
import { safeOpenURL } from "@/lib/safeOpenURL";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "";

interface SectionItem {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}

function SettingsSection({ title, items }: { title: string; items: SectionItem[] }) {
  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {items.map((item, i) => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [
              styles.row,
              pressed && item.onPress && { opacity: 0.7 },
              i < items.length - 1 && styles.rowBorder,
            ]}
            onPress={item.onPress}
            disabled={!item.onPress}
          >
            <Feather
              name={item.icon}
              size={18}
              color={item.destructive ? Colors.error : Colors.gold}
              style={styles.rowIcon}
            />
            <Text
              style={[
                styles.rowLabel,
                item.destructive && { color: Colors.error },
              ]}
            >
              {item.label}
            </Text>
            {item.rightElement ? (
              item.rightElement
            ) : item.onPress ? (
              <Feather name="chevron-right" size={16} color={Colors.muted} />
            ) : null}
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isSubscribed, restore, isRestoring, isConfigured, customerInfo } =
    useSubscription();
  const [isDeleting, setIsDeleting] = useState(false);

  const [notifReadings, setNotifReadings] = useState(true);
  const [notifUpdates, setNotifUpdates] = useState(true);

  const planLabel = isSubscribed ? "Oracle Pro" : "Free";

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "This will clear all local data and return you to the landing screen. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              router.replace("/");
            } catch {
              Alert.alert("Error", "Could not sign out. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete all your data including saved profiles and sessions. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "All your Oracle profiles, sessions, and preferences will be permanently erased.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete My Account",
                  style: "destructive",
                  onPress: performAccountDeletion,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const performAccountDeletion = async () => {
    setIsDeleting(true);
    try {
      if (!DOMAIN) {
        throw new Error("Server domain not configured");
      }
      const baseUrl = `https://${DOMAIN}`;
      const res = await fetch(`${baseUrl}/api/account/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: Constants.installationId ?? "unknown",
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || "Server error");
      }

      await AsyncStorage.clear();

      Alert.alert(
        "Account Deleted",
        "All your data has been removed.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/"),
          },
        ]
      );
    } catch (e) {
      console.error("Account deletion failed:", e);
      Alert.alert(
        "Deletion Failed",
        "Could not delete your account. Please try again later."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!isConfigured) return;
    try {
      const info = await restore();
      if (info?.entitlements?.active?.["full_reading"]) {
        Alert.alert(
          "Purchase Restored",
          "Your full session has been restored."
        );
      } else {
        Alert.alert(
          "No Purchase Found",
          "No previous purchase was found for this account."
        );
      }
    } catch {
      Alert.alert(
        "Restore Failed",
        "Could not restore purchase. Please try again."
      );
    }
  };

  const handleManageSubscription = () => {
    if (!isSubscribed) {
      router.push("/reading");
      return;
    }
    if (Platform.OS === "ios") {
      safeOpenURL("https://apps.apple.com/account/subscriptions");
    } else if (Platform.OS === "android") {
      safeOpenURL(
        "https://play.google.com/store/account/subscriptions"
      );
    } else {
      Alert.alert(
        "Manage Subscription",
        "Please manage your subscription through the App Store or Google Play Store."
      );
    }
  };

  const handleContactSupport = () => {
    safeOpenURL("mailto:support@theoracle.app?subject=The Oracle — Support Request");
  };

  const handlePrivacyPolicy = () => {
    if (!DOMAIN) {
      Alert.alert("Unavailable", "Privacy Policy link is not available right now.");
      return;
    }
    safeOpenURL(`https://${DOMAIN}/api/privacy`);
  };

  const handleTermsOfUse = () => {
    if (!DOMAIN) {
      Alert.alert("Unavailable", "Terms of Use link is not available right now.");
      return;
    }
    safeOpenURL(`https://${DOMAIN}/api/terms`);
  };

  const accountItems: SectionItem[] = [
    {
      label: "Sign Out",
      icon: "log-out",
      onPress: handleSignOut,
    },
    {
      label: isDeleting ? "Deleting Account…" : "Delete Account",
      icon: "trash-2",
      onPress: isDeleting ? undefined : handleDeleteAccount,
      destructive: true,
      rightElement: isDeleting ? (
        <ActivityIndicator size="small" color={Colors.error} />
      ) : undefined,
    },
  ];

  const subscriptionItems: SectionItem[] = [
    {
      label: `Current Plan: ${planLabel}`,
      icon: "star",
    },
    ...(isSubscribed
      ? [
          {
            label: "Oracle Pro — Active",
            icon: "check-circle" as const,
          },
        ]
      : [
          {
            label: "Upgrade to Oracle Pro",
            icon: "star" as const,
            onPress: () => router.push("/reading"),
          },
        ]),
    {
      label: "Manage Subscription",
      icon: "external-link",
      onPress: handleManageSubscription,
    },
    {
      label: isRestoring ? "Restoring…" : "Restore Purchases",
      icon: "refresh-cw",
      onPress: isRestoring ? undefined : handleRestorePurchases,
      rightElement: isRestoring ? (
        <ActivityIndicator size="small" color={Colors.gold} />
      ) : undefined,
    },
  ];

  const notificationItems: SectionItem[] = [
    {
      label: "Session Notifications",
      icon: "bell",
      rightElement: (
        <Switch
          value={notifReadings}
          onValueChange={setNotifReadings}
          trackColor={{ false: Colors.inputBg, true: Colors.gold }}
          thumbColor={Colors.cream}
        />
      ),
    },
    {
      label: "App Updates",
      icon: "bell",
      rightElement: (
        <Switch
          value={notifUpdates}
          onValueChange={setNotifUpdates}
          trackColor={{ false: Colors.inputBg, true: Colors.gold }}
          thumbColor={Colors.cream}
        />
      ),
    },
  ];

  const legalItems: SectionItem[] = [
    {
      label: "Privacy Policy",
      icon: "shield",
      onPress: handlePrivacyPolicy,
    },
    {
      label: "Terms of Use",
      icon: "file-text",
      onPress: handleTermsOfUse,
    },
  ];

  const supportItems: SectionItem[] = [
    {
      label: "Contact Support",
      icon: "mail",
      onPress: handleContactSupport,
    },
  ];

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
          style={({ pressed }) => [
            styles.backBtn,
            pressed && { opacity: 0.7 },
          ]}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color={Colors.gold} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection title="Account" items={accountItems} />
        <SettingsSection title="Subscription" items={subscriptionItems} />
        <SettingsSection title="Notifications" items={notificationItems} />
        <SettingsSection title="Legal" items={legalItems} />
        <SettingsSection title="Support" items={supportItems} />

        <Animated.View entering={FadeIn.duration(600)} style={styles.versionContainer}>
          <Text style={styles.versionText}>The Oracle v{APP_VERSION}</Text>
        </Animated.View>

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
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 13,
    color: Colors.muted,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 10,
    paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.inputBorder,
  },
  rowIcon: {
    marginRight: 14,
    width: 20,
    textAlign: "center",
  },
  rowLabel: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.cream,
    flex: 1,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  versionText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 13,
    color: Colors.muted,
    fontStyle: "italic",
  },
});
