import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  Alert,
  Platform,
  TextInput,
  ScrollView,
  Modal,
} from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { safeOpenURL } from "@/lib/safeOpenURL";
import StarField from "@/components/StarField";
import { useProfiles, OracleProfile, ProfilePhoto } from "@/context/ProfileContext";
import { useSubscription } from "@/lib/revenuecat";
import { trackEvent, AnalyticsEvent } from "@/lib/analytics";

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const HAND_OPTIONS = ["Right", "Left", "Ambidextrous"];
const EYE_OPTIONS = ["Brown", "Blue", "Green", "Hazel", "Gray", "Dark Brown", "Other"];


// Behavioral indicator derived from the questionnaire's coreMotivation answer.
// Falls back to "Seeker" for unknown values, and to a neutral symbol with no
// label when the questionnaire hasn't been completed yet.
type ProfileIndicator = { label: string; symbol: string };
function getProfileIndicator(profile: OracleProfile): ProfileIndicator {
  const motivation = (profile.coreMotivation ?? "").trim().toLowerCase();
  if (!motivation) {
    return { label: "", symbol: "✦" };
  }
  if (motivation.startsWith("creator")) return { label: "Creator", symbol: "✦" };
  if (motivation.startsWith("analyst")) return { label: "Analyst", symbol: "◈" };
  if (motivation.startsWith("connector")) return { label: "Connector", symbol: "⊕" };
  if (motivation.startsWith("explorer")) return { label: "Explorer", symbol: "◎" };
  return { label: "Seeker", symbol: "✧" };
}

const PHOTO_SLOTS: { key: keyof ProfilePhoto; label: string; icon: string }[] = [
  { key: "face", label: "Face", icon: "user" },
  { key: "right_palm", label: "Right Hand", icon: "hand" },
  { key: "left_palm", label: "Left Hand", icon: "hand" },
  { key: "right_iris", label: "Right Iris", icon: "eye" },
  { key: "left_iris", label: "Left Iris", icon: "eye" },
];

// ── Profile Card ──────────────────────────────────────────────
function ProfileCard({
  profile,
  onPress,
  onLongPress,
}: {
  profile: OracleProfile;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const faceUri = profile.photos.face;
  const initials = profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const indicator = getProfileIndicator(profile);

  return (
    <Animated.View entering={FadeIn.duration(300)} layout={Layout.springify()}>
      <Pressable
        style={({ pressed }) => [styles.profileCard, pressed && { opacity: 0.85 }]}
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityLabel={`${profile.name}, born ${profile.dob}`}
        accessibilityRole="button"
        accessibilityHint="Double tap to view, long press for more options"
      >
        {faceUri ? (
          <Image source={{ uri: faceUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{profile.name}</Text>
          <Text style={styles.cardIndicator}>
            <Text style={styles.cardIndicatorSymbol}>{indicator.symbol}</Text>
            {indicator.label ? ` ${indicator.label}` : ""}
          </Text>
          <Text style={styles.cardDob}>{profile.dob}</Text>
          {profile.notes ? (
            <Text style={styles.cardNotes} numberOfLines={1}>{profile.notes}</Text>
          ) : null}
        </View>
        <View style={styles.photoCount}>
          <Text style={styles.photoCountNum}>
            {Object.values(profile.photos).filter(Boolean).length}
          </Text>
          <Text style={styles.photoCountLabel}>photos</Text>
        </View>
        <Feather name="chevron-right" size={16} color={Colors.muted} />
      </Pressable>
    </Animated.View>
  );
}

// ── Chip selector ─────────────────────────────────────────────
function ChipSelect({ options, value, onSelect }: { options: string[]; value: string; onSelect: (v: string) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map(opt => (
        <Pressable
          key={opt}
          style={[chipStyles.chip, value === opt && chipStyles.selected]}
          onPress={() => onSelect(opt)}
          accessibilityLabel={opt}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === opt }}
        >
          <Text style={[chipStyles.text, value === opt && chipStyles.selectedText]}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}
const chipStyles = StyleSheet.create({
  chip: { borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: Colors.inputBg },
  selected: { borderColor: Colors.gold, backgroundColor: "rgba(201,168,76,0.15)" },
  text: { fontFamily: "EBGaramond_400Regular", fontSize: 14, color: Colors.muted },
  selectedText: { color: Colors.gold },
});

// ── Styled Input ──────────────────────────────────────────────
function SInput({ value, onChangeText, placeholder, multiline }: { value: string; onChangeText: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.muted}
      multiline={multiline}
      style={[inputStyles.input, focused && inputStyles.focused, multiline && { minHeight: 70, textAlignVertical: "top", paddingTop: 12 }]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}
const inputStyles = StyleSheet.create({
  input: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "EBGaramond_400Regular", fontSize: 16, color: Colors.cream, minHeight: 48 },
  focused: { borderColor: Colors.gold },
});

// ── Profile Form Modal ────────────────────────────────────────
function ProfileFormModal({
  visible,
  initial,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial?: OracleProfile;
  onSave: (data: Omit<OracleProfile, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [dob, setDob] = useState(initial?.dob ?? "");
  const [birthTime, setBirthTime] = useState(initial?.birthTime ?? "");
  const [birthCity, setBirthCity] = useState(initial?.birthCity ?? "");
  const [birthCountry, setBirthCountry] = useState(initial?.birthCountry ?? "");
  const [gender, setGender] = useState(initial?.gender ?? "");
  const [dominantHand, setDominantHand] = useState(initial?.dominantHand ?? "");
  const [eyeColor, setEyeColor] = useState(initial?.eyeColor ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [photos, setPhotos] = useState<ProfilePhoto>(initial?.photos ?? {});

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? "");
      setDob(initial?.dob ?? "");
      setBirthTime(initial?.birthTime ?? "");
      setBirthCity(initial?.birthCity ?? "");
      setBirthCountry(initial?.birthCountry ?? "");
      setGender(initial?.gender ?? "");
      setDominantHand(initial?.dominantHand ?? "");
      setEyeColor(initial?.eyeColor ?? "");
      setNotes(initial?.notes ?? "");
      setPhotos(initial?.photos ?? {});
    }
  }, [visible, initial]);

  const handlePickPhoto = async (key: keyof ProfilePhoto) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    let result;
    if (perm.granted) {
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.85 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    }
    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => ({ ...prev, [key]: result.assets[0].uri }));
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Name is required.");
      return;
    }
    if (!dob.trim()) {
      Alert.alert("Date of birth is required.");
      return;
    }
    onSave({ name: name.trim(), dob, birthTime, birthCity, birthCountry, gender, dominantHand, eyeColor, notes, photos });
  };

  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[modalStyles.container, { paddingTop: Platform.OS === "web" ? 20 : insets.top }]}>
        <View style={modalStyles.header}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Cancel" accessibilityRole="button">
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={modalStyles.title}>{initial ? "Edit Profile" : "New Profile"}</Text>
          <Pressable onPress={handleSave} hitSlop={12} accessibilityLabel="Save profile" accessibilityRole="button">
            <Text style={modalStyles.saveText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={modalStyles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Photos */}
          <Text style={modalStyles.sectionLabel}>PHOTOS</Text>
          <View style={modalStyles.photoRow}>
            {PHOTO_SLOTS.map(slot => {
              const uri = photos[slot.key];
              return (
                <Pressable key={slot.key} style={modalStyles.photoSlot} onPress={() => handlePickPhoto(slot.key)} accessibilityLabel={`Add ${slot.label} photo`} accessibilityRole="button">
                  {uri ? (
                    <Image source={{ uri }} style={modalStyles.photoThumb} />
                  ) : (
                    <View style={modalStyles.photoEmpty}>
                      <Feather name={slot.icon as any} size={16} color={Colors.muted} />
                    </View>
                  )}
                  <Text style={modalStyles.photoLabel}>{slot.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={modalStyles.sectionLabel}>NAME *</Text>
          <SInput value={name} onChangeText={setName} placeholder="Full name" />

          <Text style={modalStyles.sectionLabel}>DATE OF BIRTH *</Text>
          <SInput value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" />

          <Text style={modalStyles.sectionLabel}>TIME OF BIRTH</Text>
          <SInput value={birthTime} onChangeText={setBirthTime} placeholder="HH:MM (optional)" />

          <Text style={modalStyles.sectionLabel}>CITY OF BIRTH</Text>
          <SInput value={birthCity} onChangeText={setBirthCity} placeholder="City (optional)" />

          <Text style={modalStyles.sectionLabel}>COUNTRY</Text>
          <SInput value={birthCountry} onChangeText={setBirthCountry} placeholder="Country (optional)" />

          <Text style={modalStyles.sectionLabel}>GENDER</Text>
          <ChipSelect options={GENDER_OPTIONS} value={gender} onSelect={setGender} />

          <Text style={modalStyles.sectionLabel}>DOMINANT HAND</Text>
          <ChipSelect options={HAND_OPTIONS} value={dominantHand} onSelect={setDominantHand} />

          <Text style={modalStyles.sectionLabel}>EYE COLOR</Text>
          <ChipSelect options={EYE_OPTIONS} value={eyeColor} onSelect={setEyeColor} />

          <Text style={modalStyles.sectionLabel}>NOTES</Text>
          <SInput value={notes} onChangeText={setNotes} placeholder="Add any notes (optional)" multiline />

          <Pressable style={({ pressed }) => [modalStyles.saveBtn, pressed && { opacity: 0.85 }]} onPress={handleSave} accessibilityLabel={initial ? "Save Changes" : "Add to Vault"} accessibilityRole="button">
            <Text style={modalStyles.saveBtnText}>{initial ? "Save Changes" : "Add to Vault"}</Text>
          </Pressable>

          <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 24 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(201,168,76,0.12)" },
  title: { fontFamily: "CormorantGaramond_400Regular", fontSize: 14, color: Colors.cream, letterSpacing: 0.5 },
  cancelText: { fontFamily: "EBGaramond_400Regular", fontSize: 16, color: Colors.muted },
  saveText: { fontFamily: "EBGaramond_500Medium", fontSize: 16, color: Colors.gold },
  form: { padding: 20, gap: 12 },
  sectionLabel: { fontFamily: "EBGaramond_500Medium", fontSize: 12, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 8 },
  photoRow: { flexDirection: "row", gap: 8 },
  photoSlot: { flex: 1, alignItems: "center", gap: 4 },
  photoThumb: { width: "100%", aspectRatio: 1, borderRadius: 8, resizeMode: "cover" },
  photoEmpty: { width: "100%", aspectRatio: 1, borderRadius: 8, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, alignItems: "center", justifyContent: "center" },
  photoLabel: { fontFamily: "EBGaramond_400Regular", fontSize: 9, color: Colors.muted, textAlign: "center" },
  saveBtn: { backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 16, alignItems: "center", justifyContent: "center", marginTop: 16, minHeight: 52 },
  saveBtnText: { fontFamily: "CormorantGaramond_400Regular", fontSize: 13, color: Colors.bg, letterSpacing: 0.5 },
});

// ── Main screen ────────────────────────────────────────────────
export default function ProfilesScreen() {
  const insets = useSafeAreaInsets();
  const { profiles, isPaid, maxProfiles, addProfile, updateProfile, deleteProfile } = useProfiles();
  const { restore, isRestoring, isConfigured } = useSubscription();
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<OracleProfile | undefined>();

  useEffect(() => {
    trackEvent(AnalyticsEvent.VAULT_OPENED, { profile_count: profiles.length });
  }, []);

  const handleRestorePurchases = async () => {
    if (!isConfigured) return;
    try {
      const info = await restore();
      if (info?.entitlements?.active?.["full_reading"]) {
        Alert.alert("Restored", "Your subscription has been restored.");
      } else {
        Alert.alert("No Subscription Found", "No active subscription was found for this account.");
      }
    } catch {
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    }
  };

  const handleAddNew = () => {
    if (!isPaid && profiles.length >= 15) {
      Alert.alert(
        "Profile Vault Full",
        "Upgrade to The Oracle paid plan for unlimited profiles.",
        [{ text: "OK" }]
      );
      return;
    }
    setEditingProfile(undefined);
    setShowForm(true);
  };

  const handleSave = async (data: Omit<OracleProfile, "id" | "createdAt">) => {
    if (editingProfile) {
      await updateProfile(editingProfile.id, data);
      trackEvent(AnalyticsEvent.VAULT_PROFILE_EDITED);
    } else {
      await addProfile(data);
      trackEvent(AnalyticsEvent.VAULT_PROFILE_CREATED, { profile_count: profiles.length + 1 });
    }
    setShowForm(false);
    setEditingProfile(undefined);
  };

  const handleLongPress = (profile: OracleProfile) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(profile.name, "What would you like to do?", [
      { text: "Edit", onPress: () => { setEditingProfile(profile); setShowForm(true); } },
      {
        text: "Delete", style: "destructive",
        onPress: () => Alert.alert("Delete Profile?", `Remove ${profile.name} from your vault?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => { deleteProfile(profile.id); trackEvent(AnalyticsEvent.VAULT_PROFILE_DELETED); } },
        ]),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleProfilePress = (profile: OracleProfile) => {
    router.push({ pathname: "/profile-action", params: { profileId: profile.id } });
  };

  const canStartSynastry = profiles.length >= 2;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12} accessibilityLabel="Go back" accessibilityRole="button">
          <Feather name="arrow-left" size={20} color={Colors.gold} />
        </Pressable>
        <Text style={styles.headerTitle}>The Vault</Text>
        <Pressable onPress={handleAddNew} style={styles.addBtn} hitSlop={12} accessibilityLabel="Add new profile" accessibilityRole="button">
          <Feather name="plus" size={22} color={Colors.gold} />
        </Pressable>
      </View>

      {/* Synastry entry */}
      {canStartSynastry && (
        <Animated.View entering={FadeIn.duration(500)} style={styles.synastryBanner}>
          <Pressable
            style={({ pressed }) => [styles.synastryBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.push("/synastry")}
            accessibilityLabel="Open Synastry — compare two profiles"
            accessibilityRole="button"
          >
            <View style={styles.synastryBtnLeft}>
              <Text style={styles.synastryIcon}>✦ ✦</Text>
              <View>
                <Text style={styles.synastryBtnTitle}>Synastry</Text>
                <Text style={styles.synastryBtnSub}>Compare two profiles for compatibility</Text>
              </View>
            </View>
            <Feather name="arrow-right" size={16} color={Colors.gold} />
          </Pressable>
        </Animated.View>
      )}

      {/* Counter */}
      <View style={styles.counterRow}>
        <Text style={styles.counterText}>
          {profiles.length} profile{profiles.length !== 1 ? "s" : ""}
          {!isPaid && ` · ${15 - profiles.length} free slots remaining`}
          {isPaid && " · Unlimited"}
        </Text>
      </View>

      {profiles.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyTitle}>Your vault is empty.</Text>
          <Text style={styles.emptyText}>
            Add the people in your life — partners, family, friends — to unlock profile comparisons and synastry sessions.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.emptyAddBtn, pressed && { opacity: 0.85 }]}
            onPress={handleAddNew}
            accessibilityLabel="Add First Profile"
            accessibilityRole="button"
          >
            <Feather name="plus" size={16} color={Colors.bg} />
            <Text style={styles.emptyAddText}>Add First Profile</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={p => p.id}
          renderItem={({ item }) => (
            <ProfileCard
              profile={item}
              onPress={() => handleProfilePress(item)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 24 }} />
          }
        />
      )}

      <View style={styles.accountSection}>
        <Pressable
          style={styles.accountBtn}
          onPress={() => safeOpenURL("https://apps.apple.com/account/subscriptions")}
          accessibilityLabel="Manage your subscription"
        >
          <Feather name="credit-card" size={14} color={Colors.muted} />
          <Text style={styles.accountBtnText}>Manage Subscription</Text>
        </Pressable>
        <Text style={styles.accountSep}>·</Text>
        <Pressable
          style={styles.accountBtn}
          onPress={handleRestorePurchases}
          disabled={isRestoring}
          accessibilityLabel="Restore previous purchases"
        >
          <Feather name="refresh-cw" size={14} color={Colors.muted} />
          <Text style={styles.accountBtnText}>{isRestoring ? "Restoring..." : "Restore Purchases"}</Text>
        </Pressable>
      </View>

      <ProfileFormModal
        visible={showForm}
        initial={editingProfile}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditingProfile(undefined); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  addBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "CormorantGaramond_700Bold", fontSize: 15, color: Colors.gold, letterSpacing: 2 },
  synastryBanner: { marginHorizontal: 16, marginBottom: 8 },
  synastryBtn: { backgroundColor: "rgba(201,168,76,0.08)", borderWidth: 1, borderColor: "rgba(201,168,76,0.3)", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  synastryBtnLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  synastryIcon: { fontFamily: "EBGaramond_400Regular", fontSize: 16, color: Colors.gold, letterSpacing: 4 },
  synastryBtnTitle: { fontFamily: "CormorantGaramond_400Regular", fontSize: 13, color: Colors.gold, letterSpacing: 0.5 },
  synastryBtnSub: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 12, color: Colors.muted, marginTop: 2 },
  counterRow: { paddingHorizontal: 20, paddingBottom: 8 },
  counterText: { fontFamily: "EBGaramond_400Regular", fontSize: 13, color: Colors.muted, fontStyle: "italic" },
  list: { paddingHorizontal: 16, gap: 10 },
  profileCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(201,168,76,0.1)" },
  avatar: { width: 52, height: 52, borderRadius: 26, resizeMode: "cover", borderWidth: 1.5, borderColor: Colors.gold },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(201,168,76,0.12)", borderWidth: 1.5, borderColor: Colors.gold, alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontFamily: "CormorantGaramond_400Regular", fontSize: 16, color: Colors.gold },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontFamily: "EBGaramond_500Medium", fontSize: 17, color: Colors.cream },
  cardDob: { fontFamily: "EBGaramond_400Regular", fontSize: 13, color: Colors.muted },
  cardIndicator: { fontFamily: "EBGaramond_500Medium", fontSize: 12, color: "#f59e0b", marginTop: 1 },
  cardIndicatorSymbol: { color: "#f59e0b" },
  cardNotes: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 12, color: Colors.muted, marginTop: 2 },
  photoCount: { alignItems: "center", gap: 1, marginRight: 4 },
  photoCountNum: { fontFamily: "CormorantGaramond_400Regular", fontSize: 14, color: Colors.gold },
  photoCountLabel: { fontFamily: "EBGaramond_400Regular", fontSize: 10, color: Colors.muted },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16 },
  emptyIcon: { fontFamily: "EBGaramond_400Regular", fontSize: 28, color: Colors.gold, opacity: 0.5 },
  emptyTitle: { fontFamily: "CormorantGaramond_400Regular", fontSize: 16, color: Colors.cream, textAlign: "center" },
  emptyText: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 15, color: Colors.muted, textAlign: "center", lineHeight: 24 },
  emptyAddBtn: { backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  emptyAddText: { fontFamily: "CormorantGaramond_400Regular", fontSize: 13, color: Colors.bg },
  accountSection: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8, borderTopWidth: 1, borderTopColor: "rgba(201,168,76,0.1)", marginHorizontal: 20, marginTop: 8 },
  accountBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 8 },
  accountBtnText: { fontFamily: "EBGaramond_400Regular", fontSize: 12, color: Colors.muted, textDecorationLine: "underline" },
  accountSep: { fontFamily: "EBGaramond_400Regular", fontSize: 12, color: Colors.muted },
});
