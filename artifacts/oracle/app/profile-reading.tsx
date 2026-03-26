import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  TextInput,
  Image,
  Platform,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { fetch } from "expo/fetch";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import GoldSigil from "@/components/GoldSigil";
import { useProfiles, OracleProfile } from "@/context/ProfileContext";

let msgCount = 0;
function genId() { return `pm-${Date.now()}-${++msgCount}`; }

interface Message { id: string; role: "user" | "assistant"; content: string; }

const LIFE_CATEGORIES = [
  { label: "Love & Relationships", icon: "heart" },
  { label: "Career & Purpose", icon: "briefcase" },
  { label: "Health & Vitality", icon: "activity" },
  { label: "Spiritual Growth", icon: "star" },
  { label: "Finances & Abundance", icon: "trending-up" },
  { label: "Family & Roots", icon: "home" },
];

function computeSunSign(dob: string): string {
  if (!dob || !dob.includes("-")) return "";
  const parts = dob.split("-");
  if (parts.length < 3) return "";
  const m = parseInt(parts[1] ?? "0");
  const d = parseInt(parts[2] ?? "0");
  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return "Aries";
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return "Taurus";
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return "Gemini";
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return "Cancer";
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return "Leo";
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return "Virgo";
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return "Libra";
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return "Scorpio";
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return "Sagittarius";
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return "Capricorn";
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return "Aquarius";
  return "Pisces";
}

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <Animated.View entering={FadeIn.duration(300)} style={[bubbleStyles.row, isUser ? bubbleStyles.userRow : bubbleStyles.oracleRow]}>
      {!isUser && (
        <View style={bubbleStyles.avatar}>
          <Text style={bubbleStyles.avatarSym}>✦</Text>
        </View>
      )}
      <View style={[bubbleStyles.bubble, isUser ? bubbleStyles.userBubble : bubbleStyles.oracleBubble]}>
        <Text style={[bubbleStyles.text, isUser ? bubbleStyles.userText : bubbleStyles.oracleText]}>{msg.content}</Text>
      </View>
    </Animated.View>
  );
}

const bubbleStyles = StyleSheet.create({
  row: { flexDirection: "row", marginBottom: 12, maxWidth: "85%", alignItems: "flex-end", gap: 8 },
  userRow: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  oracleRow: { alignSelf: "flex-start" },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(201,168,76,0.15)", borderWidth: 1, borderColor: Colors.gold, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarSym: { fontFamily: "EBGaramond_400Regular", fontSize: 11, color: Colors.gold },
  bubble: { borderRadius: 16, paddingVertical: 11, paddingHorizontal: 15, maxWidth: "100%" },
  userBubble: { backgroundColor: Colors.userBubble, borderWidth: 1, borderColor: "rgba(201,168,76,0.3)", borderBottomRightRadius: 4 },
  oracleBubble: { backgroundColor: Colors.oracleBubble, borderWidth: 1, borderColor: "rgba(201,168,76,0.1)", borderBottomLeftRadius: 4 },
  text: { fontSize: 16, lineHeight: 26 },
  userText: { fontFamily: "EBGaramond_400Regular", color: Colors.cream },
  oracleText: { fontFamily: "EBGaramond_400Regular", color: Colors.cream, opacity: 0.95 },
});

type Phase = "greeting" | "category" | "reading" | "chat";

export default function ProfileReadingScreen() {
  const insets = useSafeAreaInsets();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const { profiles } = useProfiles();

  const profile = profiles.find(p => p.id === profileId) ?? null;
  const sunSign = profile ? computeSunSign(profile.dob) : "";

  const [phase, setPhase] = useState<Phase>("greeting");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const getApiUrl = () => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    return domain ? `https://${domain}/` : "/";
  };

  const buildProfilePayload = (p: OracleProfile) => ({
    name: p.name,
    dob: p.dob,
    birthTime: p.birthTime ?? "",
    birthCity: p.birthCity ?? "",
    birthCountry: p.birthCountry ?? "",
    gender: p.gender ?? "",
    dominantHand: p.dominantHand ?? "",
    eyeColor: p.eyeColor ?? "",
    notes: p.notes ?? "",
    photos: Object.keys(p.photos).filter(k => p.photos[k as keyof typeof p.photos]),
  });

  useEffect(() => {
    if (profile && phase === "greeting") {
      const greetMsg: Message = {
        id: genId(),
        role: "assistant",
        content: `I see ${profile.name} before me — ${sunSign ? `a ${sunSign}` : "a soul"} carrying patterns written long before this moment.\n\nWhich area of life shall we illuminate today?`,
      };
      setMessages([greetMsg]);
      setPhase("category");
    }
  }, []);

  const handleSelectCategory = async (category: string) => {
    if (isStreaming) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();

    setReadError(null);
    setSelectedCategory(category);
    const userMsg: Message = { id: genId(), role: "user", content: category };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setPhase("reading");
    setIsStreaming(true);
    setShowTyping(true);

    if (!profile) return;

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/profile-reading`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          profile: buildProfilePayload(profile),
          category,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("API error");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      let added = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.event === "complete") {
              setPhase("chat");
              break;
            }
            if (parsed.chunk) {
              full += parsed.chunk;
              if (!added) {
                setShowTyping(false);
                setMessages(prev => [...prev, { id: genId(), role: "assistant", content: full }]);
                added = true;
              } else {
                setMessages(prev => {
                  const u = [...prev];
                  u[u.length - 1] = { ...u[u.length - 1], content: full };
                  return u;
                });
              }
              scrollRef.current?.scrollToEnd({ animated: true });
            }
          } catch (e) {
            console.warn("SSE parse error (profile reading):", e);
          }
        }
      }

      setPhase("chat");
    } catch (err) {
      setShowTyping(false);
      const isNetwork = err instanceof TypeError || String(err).includes("fetch");
      setReadError(
        isNetwork
          ? "The connection was severed. Check your network and try again."
          : "The Oracle could not reach this reading. Try selecting a category again."
      );
      // Remove the user's category message and go back to category selection
      setMessages(prev => prev.filter(m => m.content !== category || m.role !== "user"));
      setPhase("category");
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
    }
  };

  const handleSendChat = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming || !profile) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();

    const history = [...messages];
    const userMsg: Message = { id: genId(), role: "user", content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);
    setShowTyping(true);
    inputRef.current?.focus();

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/profile-reading/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          profile: buildProfilePayload(profile),
          category: selectedCategory,
          messages: [...history.map(m => ({ role: m.role, content: m.content })), { role: "user", content: trimmed }],
        }),
      });

      if (!response.ok) throw new Error("API error");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      let added = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.content) {
              full += parsed.content;
              if (!added) {
                setShowTyping(false);
                setMessages(prev => [...prev, { id: genId(), role: "assistant", content: full }]);
                added = true;
              } else {
                setMessages(prev => {
                  const u = [...prev];
                  u[u.length - 1] = { ...u[u.length - 1], content: full };
                  return u;
                });
              }
            }
          } catch (e) {
            console.warn("SSE parse error (profile chat):", e);
          }
        }
      }
    } catch {
      setShowTyping(false);
      setMessages(prev => [...prev, { id: genId(), role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
    }
  };

  if (!profile) {
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <StarField />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12} accessibilityLabel="Go back" accessibilityRole="button">
            <Feather name="arrow-left" size={20} color={Colors.gold} />
          </Pressable>
          <Text style={styles.headerTitle}>Reading</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profile not found.</Text>
        </View>
      </View>
    );
  }

  const faceUri = profile.photos.face;
  const initials = profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12} accessibilityLabel="Go back" accessibilityRole="button">
          <Feather name="arrow-left" size={20} color={Colors.gold} />
        </Pressable>
        <View style={styles.headerCenter}>
          {faceUri ? (
            <Image source={{ uri: faceUri }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarInitials}>{initials}</Text>
            </View>
          )}
          <View>
            <Text style={styles.headerTitle}>{profile.name}</Text>
            {sunSign ? <Text style={styles.headerSign}>{sunSign}</Text> : null}
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          ref={scrollRef as any}
          data={[...messages].reverse()}
          keyExtractor={m => m.id}
          inverted={messages.length > 0}
          renderItem={({ item }) => <Bubble msg={item} />}
          ListHeaderComponent={showTyping ? (
            <View style={[bubbleStyles.row, bubbleStyles.oracleRow]}>
              <View style={bubbleStyles.avatar}>
                <Text style={bubbleStyles.avatarSym}>✦</Text>
              </View>
              <View style={[bubbleStyles.bubble, bubbleStyles.oracleBubble]}>
                <Text style={{ fontFamily: "EBGaramond_400Regular", fontSize: 16, color: Colors.gold, letterSpacing: 4 }}>• • •</Text>
              </View>
            </View>
          ) : null}
          ListFooterComponent={phase === "category" ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.categoriesWrap}>
              {readError && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.readErrorBox}>
                  <Feather name="alert-circle" size={14} color={Colors.error} />
                  <Text style={styles.readErrorText}>{readError}</Text>
                  <Pressable onPress={() => setReadError(null)} hitSlop={8} accessibilityLabel="Dismiss error message" accessibilityRole="button">
                    <Feather name="x" size={13} color={Colors.muted} />
                  </Pressable>
                </Animated.View>
              )}
              <Text style={styles.categoriesLabel}>Choose a life area...</Text>
              <View style={styles.categories}>
                {LIFE_CATEGORIES.map(cat => (
                  <Pressable
                    key={cat.label}
                    style={({ pressed }) => [styles.categoryChip, pressed && { opacity: 0.75 }]}
                    onPress={() => handleSelectCategory(cat.label)}
                    accessibilityLabel={cat.label}
                    accessibilityRole="button"
                  >
                    <Feather name={cat.icon as any} size={14} color={Colors.gold} />
                    <Text style={styles.categoryChipText}>{cat.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          ) : null}
          contentContainerStyle={styles.chatList}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />

        {phase === "chat" && (
          <Animated.View entering={FadeIn.duration(300)} style={[styles.inputRow, { paddingBottom: Platform.OS === "web" ? 20 : insets.bottom + 8 }]}>
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder="Ask The Oracle..."
              placeholderTextColor={Colors.muted}
              style={styles.input}
              onSubmitEditing={() => handleSendChat(input)}
              returnKeyType="send"
              multiline={false}
            />
            <Pressable
              style={({ pressed }) => [styles.sendBtn, (!input.trim() || isStreaming) && styles.sendBtnDisabled, pressed && input.trim() && !isStreaming && { opacity: 0.8 }]}
              onPress={() => handleSendChat(input)}
              disabled={!input.trim() || isStreaming}
              accessibilityLabel="Send message"
              accessibilityRole="button"
            >
              <Feather name="send" size={18} color={input.trim() && !isStreaming ? Colors.bg : Colors.muted} />
            </Pressable>
          </Animated.View>
        )}

        {phase === "reading" && isStreaming && (
          <View style={[styles.streamingBar, { paddingBottom: Platform.OS === "web" ? 20 : insets.bottom + 8 }]}>
            <GoldSigil size={18} />
            <Text style={styles.streamingText}>The Oracle is reading...</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, resizeMode: "cover", borderWidth: 1.5, borderColor: Colors.gold },
  headerAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(201,168,76,0.12)", borderWidth: 1.5, borderColor: Colors.gold, alignItems: "center", justifyContent: "center" },
  headerAvatarInitials: { fontFamily: "CinzelDecorative_400Regular", fontSize: 12, color: Colors.gold },
  headerTitle: { fontFamily: "CinzelDecorative_400Regular", fontSize: 14, color: Colors.cream, letterSpacing: 0.3 },
  headerSign: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 12, color: Colors.muted },
  chatList: { paddingHorizontal: 16, paddingTop: 12, flexGrow: 1, justifyContent: "flex-end" },
  categoriesWrap: { paddingTop: 12, paddingBottom: 8, gap: 12 },
  readErrorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(204,68,68,0.1)", borderWidth: 1, borderColor: "rgba(204,68,68,0.25)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  readErrorText: { flex: 1, fontFamily: "EBGaramond_400Regular_Italic", fontSize: 13, color: Colors.error, lineHeight: 18 },
  categoriesLabel: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 15, color: Colors.muted, textAlign: "center" },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(201,168,76,0.08)", borderWidth: 1, borderColor: "rgba(201,168,76,0.3)", borderRadius: 20, paddingVertical: 9, paddingHorizontal: 14 },
  categoryChipText: { fontFamily: "EBGaramond_500Medium", fontSize: 14, color: Colors.gold },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(201,168,76,0.1)", backgroundColor: Colors.bg },
  input: { flex: 1, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, fontFamily: "EBGaramond_400Regular", fontSize: 16, color: Colors.cream, minHeight: 44, maxHeight: 110 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gold, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.inputBorder },
  streamingBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(201,168,76,0.1)" },
  streamingText: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 14, color: Colors.gold },
  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontFamily: "EBGaramond_400Regular", fontSize: 16, color: Colors.muted },
});
