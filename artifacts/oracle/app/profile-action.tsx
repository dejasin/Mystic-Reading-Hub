import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import { useProfiles } from "@/context/ProfileContext";

function computeSunSign(dob: string): string {
  if (!dob || !dob.includes("-")) return "";
  const parts = dob.split("-");
  if (parts.length < 3) return "";
  const m = parseInt(parts[1] ?? "0");
  const d = parseInt(parts[2] ?? "0");
  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return "♈ Aries";
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return "♉ Taurus";
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return "♊ Gemini";
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return "♋ Cancer";
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return "♌ Leo";
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return "♍ Virgo";
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return "♎ Libra";
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return "♏ Scorpio";
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return "♐ Sagittarius";
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return "♑ Capricorn";
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return "♒ Aquarius";
  return "♓ Pisces";
}

export default function ProfileActionScreen() {
  const insets = useSafeAreaInsets();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const { profiles } = useProfiles();

  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <StarField />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Feather name="arrow-left" size={20} color={Colors.gold} />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profile not found.</Text>
        </View>
      </View>
    );
  }

  const sunSign = computeSunSign(profile.dob);
  const faceUri = profile.photos.face;
  const initials = profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={20} color={Colors.gold} />
        </Pressable>
        <Text style={styles.headerTitle}>The Vault</Text>
        <View style={{ width: 44 }} />
      </View>

      <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
        <View style={styles.profileHeader}>
          {faceUri ? (
            <Image source={{ uri: faceUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <Text style={styles.profileName}>{profile.name}</Text>
          {sunSign ? (
            <Text style={styles.profileSign}>{sunSign}</Text>
          ) : null}
          {profile.dob ? (
            <Text style={styles.profileDob}>{profile.dob}</Text>
          ) : null}
        </View>

        <Text style={styles.divider}>─── ✦ ───</Text>

        <Text style={styles.chooseLabel}>What would you like to explore?</Text>

        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.85 }]}
          onPress={() => router.push({ pathname: "/profile-reading", params: { profileId: profile.id } })}
        >
          <View style={styles.actionIconWrap}>
            <Feather name="book-open" size={22} color={Colors.gold} />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>View Reading</Text>
            <Text style={styles.actionSub}>Oracle-guided Q&A tailored to {profile.name}</Text>
          </View>
          <Feather name="arrow-right" size={18} color={Colors.gold} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.85 }]}
          onPress={() => router.push({ pathname: "/synastry", params: { profileId: profile.id } })}
        >
          <View style={styles.actionIconWrap}>
            <Feather name="users" size={22} color={Colors.gold} />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>View Synastry</Text>
            <Text style={styles.actionSub}>Compatibility reading with another soul</Text>
          </View>
          <Feather name="arrow-right" size={18} color={Colors.gold} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "CinzelDecorative_700Bold", fontSize: 15, color: Colors.gold, letterSpacing: 2 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16, gap: 20 },
  profileHeader: { alignItems: "center", gap: 10, paddingVertical: 16 },
  avatar: { width: 88, height: 88, borderRadius: 44, resizeMode: "cover", borderWidth: 2, borderColor: Colors.gold },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(201,168,76,0.12)", borderWidth: 2, borderColor: Colors.gold, alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontFamily: "CinzelDecorative_400Regular", fontSize: 26, color: Colors.gold },
  profileName: { fontFamily: "CinzelDecorative_400Regular", fontSize: 18, color: Colors.cream, letterSpacing: 0.5, textAlign: "center" },
  profileSign: { fontFamily: "EBGaramond_400Regular", fontSize: 16, color: Colors.gold },
  profileDob: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 14, color: Colors.muted },
  divider: { fontFamily: "EBGaramond_400Regular", fontSize: 13, color: Colors.gold, textAlign: "center", letterSpacing: 4, opacity: 0.6 },
  chooseLabel: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 16, color: Colors.muted, textAlign: "center" },
  actionCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: "rgba(201,168,76,0.25)" },
  actionIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(201,168,76,0.1)", borderWidth: 1, borderColor: "rgba(201,168,76,0.3)", alignItems: "center", justifyContent: "center" },
  actionInfo: { flex: 1, gap: 3 },
  actionTitle: { fontFamily: "CinzelDecorative_400Regular", fontSize: 14, color: Colors.cream, letterSpacing: 0.3 },
  actionSub: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 13, color: Colors.muted },
  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontFamily: "EBGaramond_400Regular", fontSize: 16, color: Colors.muted },
});
