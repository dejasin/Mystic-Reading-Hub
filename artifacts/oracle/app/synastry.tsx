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
import ShareCardModal, { extractSynastryData } from "@/components/ShareCardModal";
import { useProfiles, OracleProfile } from "@/context/ProfileContext";
import { useJournal } from "@/context/JournalContext";
import { trackEvent, AnalyticsEvent } from "@/lib/analytics";
import { getApiUrl } from "@/lib/api";

let msgCount = 0;
function genId() { return `sm-${Date.now()}-${++msgCount}`; }

interface Message { id: string; role: "user" | "assistant"; content: string; }

// ── Profile Selector ──────────────────────────────────────────
function ProfileSelector({
  label,
  selected,
  profiles,
  onSelect,
}: {
  label: string;
  selected: OracleProfile | null;
  profiles: OracleProfile[];
  onSelect: (p: OracleProfile) => void;
}) {
  const [open, setOpen] = useState(false);
  const faceUri = selected?.photos.face;
  const initials = selected ? selected.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "";

  return (
    <View style={selStyles.container}>
      <Text style={selStyles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [selStyles.selector, pressed && { opacity: 0.85 }]}
        onPress={() => setOpen(!open)}
        accessibilityLabel={selected ? `${label}: ${selected.name}` : `${label}: Select a profile`}
        accessibilityRole="button"
      >
        {selected ? (
          <View style={selStyles.selectedRow}>
            {faceUri ? (
              <Image source={{ uri: faceUri }} style={selStyles.avatar} />
            ) : (
              <View style={selStyles.avatarPlaceholder}>
                <Text style={selStyles.initials}>{initials}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={selStyles.selectedName}>{selected.name}</Text>
              <Text style={selStyles.selectedDob}>{selected.dob}</Text>
            </View>
            <Feather name={open ? "chevron-up" : "chevron-down"} size={16} color={Colors.gold} />
          </View>
        ) : (
          <View style={selStyles.emptyRow}>
            <Feather name="user-plus" size={18} color={Colors.muted} />
            <Text style={selStyles.emptyText}>Select a profile</Text>
            <Feather name="chevron-down" size={16} color={Colors.muted} />
          </View>
        )}
      </Pressable>
      {open && (
        <View style={selStyles.dropdown}>
          {profiles.map(p => {
            const fi = p.photos.face;
            const ini = p.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <Pressable
                key={p.id}
                style={({ pressed }) => [selStyles.dropdownItem, pressed && { backgroundColor: "rgba(201,168,76,0.1)" }]}
                onPress={() => { onSelect(p); setOpen(false); }}
                accessibilityLabel={`Select ${p.name}`}
                accessibilityRole="menuitem"
              >
                {fi ? (
                  <Image source={{ uri: fi }} style={selStyles.dropAvatar} />
                ) : (
                  <View style={[selStyles.dropAvatar, { backgroundColor: "rgba(201,168,76,0.12)", alignItems: "center", justifyContent: "center" }]}>
                    <Text style={{ fontFamily: "CormorantGaramond_400Regular", fontSize: 12, color: Colors.gold }}>{ini}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={selStyles.dropName}>{p.name}</Text>
                  <Text style={selStyles.dropDob}>{p.dob}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const selStyles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontFamily: "EBGaramond_500Medium", fontSize: 12, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" },
  selector: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 12, padding: 12 },
  selectedRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: Colors.gold, resizeMode: "cover" },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(201,168,76,0.12)", borderWidth: 1, borderColor: Colors.gold, alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: "CormorantGaramond_400Regular", fontSize: 12, color: Colors.gold },
  selectedName: { fontFamily: "EBGaramond_500Medium", fontSize: 16, color: Colors.cream },
  selectedDob: { fontFamily: "EBGaramond_400Regular", fontSize: 12, color: Colors.muted },
  emptyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  emptyText: { flex: 1, fontFamily: "EBGaramond_400Regular", fontSize: 15, color: Colors.muted },
  dropdown: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: "rgba(201,168,76,0.2)", borderRadius: 12, overflow: "hidden" },
  dropdownItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "rgba(201,168,76,0.08)" },
  dropAvatar: { width: 32, height: 32, borderRadius: 16, resizeMode: "cover" },
  dropName: { fontFamily: "EBGaramond_500Medium", fontSize: 15, color: Colors.cream },
  dropDob: { fontFamily: "EBGaramond_400Regular", fontSize: 12, color: Colors.muted },
});

// ── SSE Reading View ──────────────────────────────────────────
function ReadingText({ text }: { text: string }) {
  if (!text) return null;
  return <Text style={readStyles.body}>{text}</Text>;
}
const readStyles = StyleSheet.create({
  body: { fontFamily: "EBGaramond_400Regular", fontSize: 17, color: Colors.cream, lineHeight: 30, opacity: 0.9 },
});

// ── Chat Bubble ───────────────────────────────────────────────
function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <Animated.View entering={FadeIn.duration(300)} style={[bubbleStyles.row, isUser ? bubbleStyles.userRow : bubbleStyles.oracleRow]}>
      {!isUser && <View style={bubbleStyles.avatar}><Text style={bubbleStyles.avatarSym}>✦</Text></View>}
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
  text: { fontSize: 16, lineHeight: 24 },
  userText: { fontFamily: "EBGaramond_400Regular", color: Colors.cream },
  oracleText: { fontFamily: "EBGaramond_400Regular", color: Colors.cream, opacity: 0.95 },
});

type Tab = "reading" | "chat";
type Phase = "select" | "loading" | "streaming" | "complete" | "error";

const STARTERS = [
  "How compatible are we really?",
  "What are our biggest challenges as a pair?",
  "What is the deeper purpose of this connection?",
  "How do our energies complement each other?",
  "What does The Oracle see for our future?",
];

export default function SynastryScreen() {
  const insets = useSafeAreaInsets();
  const { profiles } = useProfiles();
  const { addEntry: addJournalEntry } = useJournal();
  const params = useLocalSearchParams<{ profileId?: string }>();
  const journalSaved = useRef(false);

  const [profile1, setProfile1] = useState<OracleProfile | null>(
    params.profileId ? (profiles.find(p => p.id === params.profileId) ?? null) : null
  );
  const [profile2, setProfile2] = useState<OracleProfile | null>(null);
  const [phase, setPhase] = useState<Phase>("select");
  const [reading, setReading] = useState("");
  const [tab, setTab] = useState<Tab>("reading");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showShareCard, setShowShareCard] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const buildProfilePayload = (p: OracleProfile) => ({
    name: p.name,
    dob: p.dob,
    birthTime: p.birthTime ?? "",
    birthCity: p.birthCity ?? "",
    birthCountry: p.birthCountry ?? "",
    gender: p.gender ?? "",
    dominantHand: p.dominantHand ?? "",
    eyeColor: p.eyeColor ?? "",
    photos: Object.keys(p.photos).filter(k => p.photos[k as keyof typeof p.photos]),
  });

  const handleGenerate = async () => {
    if (!profile1 || !profile2) return;
    trackEvent(AnalyticsEvent.SYNASTRY_STARTED);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("loading");
    setReading("");
    setTab("reading");

    const baseUrl = getApiUrl();
    const payload = {
      profile1: buildProfilePayload(profile1),
      profile2: buildProfilePayload(profile2),
    };

    try {
      const response = await fetch(`${baseUrl}api/synastry`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("API error");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");
      setPhase("streaming");

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
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.event === "complete") { setPhase("complete"); return; }
            if (parsed.event === "error") { setErrorMsg(parsed.message); setPhase("error"); return; }
            if (parsed.chunk) {
              setReading(prev => prev + parsed.chunk);
              scrollRef.current?.scrollToEnd({ animated: true });
            }
          } catch (e) {
            console.warn("SSE parse error (synastry):", e);
          }
        }
      }
      trackEvent(AnalyticsEvent.SYNASTRY_READING_GENERATED);
      setPhase("complete");
    } catch {
      setErrorMsg("The Oracle could not complete this synastry session. Please try again.");
      setPhase("error");
    }
  };

  useEffect(() => {
    if (phase === "complete" && !journalSaved.current && reading.length > 0 && profile1 && profile2) {
      journalSaved.current = true;
      addJournalEntry({
        readingType: "Synastry",
        title: `${profile1.name} & ${profile2.name}`,
        preview: "",
        fullText: reading,
        metadata: { profileNames: [profile1.name, profile2.name] },
      });
    }
  }, [phase, reading, profile1, profile2, addJournalEntry]);

  const handleSendChat = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
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
      const response = await fetch(`${baseUrl}api/synastry/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          messages: [...history.map(m => ({ role: m.role, content: m.content })), { role: "user", content: trimmed }],
          readingSummary: reading.substring(0, 800),
          profile1: profile1 ? buildProfilePayload(profile1) : null,
          profile2: profile2 ? buildProfilePayload(profile2) : null,
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
                setMessages(prev => { const u = [...prev]; u[u.length - 1] = { ...u[u.length - 1], content: full }; return u; });
              }
            }
          } catch (e) {
            console.warn("SSE parse error (synastry chat):", e);
          }
        }
      }
    } catch {
      setShowTyping(false);
      setMessages(prev => [...prev, { id: genId(), role: "assistant", content: "The Oracle is temporarily unavailable. Please try again." }]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
    }
  };

  const p1Valid = !!profile1;
  const p2Valid = !!profile2 && profile2.id !== profile1?.id;
  const canGenerate = p1Valid && p2Valid;

  const availableForP2 = profiles.filter(p => p.id !== profile1?.id);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12} accessibilityLabel="Go back" accessibilityRole="button">
          <Feather name="arrow-left" size={20} color={Colors.gold} />
        </Pressable>
        <Text style={styles.headerTitle}>Synastry</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Selection Phase */}
      {(phase === "select" || phase === "error") && (
        <ScrollView contentContainerStyle={styles.selectContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeIn.duration(500)} style={styles.selectCard}>
            <GoldSigil size={64} style={{ alignSelf: "center", marginBottom: 16 }} />
            <Text style={styles.selectTitle}>Compare Two Profiles</Text>
            <Text style={styles.selectSubtitle}>
              The Oracle will surface the overlapping patterns, friction points, and dynamics between two people based on their profiles.
            </Text>
            <Text style={styles.divider}>─── ✦ ───</Text>

            {profiles.length < 2 ? (
              <View style={styles.notEnoughProfiles}>
                <Feather name="users" size={24} color={Colors.muted} />
                <Text style={styles.notEnoughText}>
                  You need at least 2 profiles in your vault to start a synastry session.
                </Text>
                <Pressable
                  style={styles.goToVaultBtn}
                  onPress={() => router.push("/profiles")}
                  accessibilityLabel="Open The Vault — add profiles"
                  accessibilityRole="button"
                >
                  <Text style={styles.goToVaultText}>Open The Vault</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <ProfileSelector
                  label="First Profile"
                  selected={profile1}
                  profiles={profiles}
                  onSelect={setProfile1}
                />
                <ProfileSelector
                  label="Second Profile"
                  selected={profile2}
                  profiles={availableForP2}
                  onSelect={setProfile2}
                />

                {phase === "error" && (
                  <Text style={styles.errorText}>{errorMsg}</Text>
                )}

                <Pressable
                  style={({ pressed }) => [styles.generateBtn, !canGenerate && styles.generateBtnDisabled, pressed && canGenerate && { opacity: 0.85 }]}
                  onPress={handleGenerate}
                  disabled={!canGenerate}
                  accessibilityLabel="Compare Profiles — generate compatibility session"
                  accessibilityRole="button"
                >
                  <Text style={[styles.generateBtnText, !canGenerate && { color: Colors.muted }]}>
                    Compare Profiles
                  </Text>
                  <Feather name="eye" size={18} color={canGenerate ? Colors.bg : Colors.muted} />
                </Pressable>
              </>
            )}
          </Animated.View>
          <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 24 }} />
        </ScrollView>
      )}

      {/* Loading */}
      {phase === "loading" && (
        <View style={styles.loadingContainer}>
          <GoldSigil size={100} />
          <Text style={styles.loadingText}>
            The Oracle is comparing the profiles of {profile1?.name} and {profile2?.name}...
          </Text>
        </View>
      )}

      {/* Streaming + Complete */}
      {(phase === "streaming" || phase === "complete") && (
        <>
          {/* Connection header */}
          <View style={styles.connectionBar}>
            {[profile1, profile2].map((p, i) => {
              const fi = p?.photos.face;
              const ini = p ? p.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
              return (
                <React.Fragment key={i}>
                  <View style={styles.connectionAvatar}>
                    {fi ? (
                      <Image source={{ uri: fi }} style={styles.connAvatarImg} />
                    ) : (
                      <View style={styles.connAvatarPlaceholder}>
                        <Text style={styles.connInitials}>{ini}</Text>
                      </View>
                    )}
                    <Text style={styles.connName} numberOfLines={1}>{p?.name}</Text>
                  </View>
                  {i === 0 && <Text style={styles.connSymbol}>✦ ✦</Text>}
                </React.Fragment>
              );
            })}
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            <Pressable style={[styles.tab, tab === "reading" && styles.tabActive]} onPress={() => setTab("reading")} accessibilityLabel="Session tab" accessibilityRole="tab" accessibilityState={{ selected: tab === "reading" }}>
              <Text style={[styles.tabText, tab === "reading" && styles.tabTextActive]}>Session</Text>
            </Pressable>
            <Pressable style={[styles.tab, tab === "chat" && styles.tabActive]} onPress={() => { setTab("chat"); trackEvent(AnalyticsEvent.SYNASTRY_CHAT_OPENED); }} accessibilityLabel="Ask The Oracle tab" accessibilityRole="tab" accessibilityState={{ selected: tab === "chat" }}>
              <Text style={[styles.tabText, tab === "chat" && styles.tabTextActive]}>Ask The Oracle</Text>
            </Pressable>
          </View>

          {tab === "reading" ? (
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={[styles.readingContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24 }]}
              showsVerticalScrollIndicator={false}
            >
              <ReadingText text={reading} />
              {phase === "streaming" && (
                <Text style={styles.streamingIndicator}>The Oracle is responding...</Text>
              )}
              {phase === "complete" && (
                <Animated.View entering={FadeIn.duration(600)} style={styles.completeActions}>
                  <Text style={styles.completeLabel}>─── ✦ Session Complete ✦ ───</Text>
                  <Pressable
                    style={styles.shareBtn}
                    onPress={() => setShowShareCard(true)}
                    accessibilityLabel="Share this session"
                    accessibilityRole="button"
                  >
                    <Feather name="share-2" size={16} color={Colors.gold} />
                    <Text style={styles.shareText}>Share this session</Text>
                  </Pressable>
                  <Pressable style={styles.switchToChatBtn} onPress={() => setTab("chat")} accessibilityLabel="Ask The Oracle — open chat" accessibilityRole="button">
                    <Feather name="message-circle" size={16} color={Colors.bg} />
                    <Text style={styles.switchToChatText}>Ask The Oracle</Text>
                  </Pressable>
                  <Pressable style={styles.newSynastryBtn} onPress={() => { setPhase("select"); setReading(""); setMessages([]); }} accessibilityLabel="Start a new comparison" accessibilityRole="button">
                    <Feather name="refresh-cw" size={14} color={Colors.muted} />
                    <Text style={styles.newSynastryText}>New Comparison</Text>
                  </Pressable>
                </Animated.View>
              )}
            </ScrollView>
          ) : (
            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
              <FlatList
                data={[...messages].reverse()}
                keyExtractor={m => m.id}
                inverted={messages.length > 0}
                renderItem={({ item }) => <Bubble msg={item} />}
                ListHeaderComponent={showTyping ? (
                  <View style={[bubbleStyles.row, bubbleStyles.oracleRow]}>
                    <View style={bubbleStyles.avatar}><Text style={bubbleStyles.avatarSym}>✦</Text></View>
                    <View style={[bubbleStyles.bubble, bubbleStyles.oracleBubble]}>
                      <Text style={{ fontFamily: "EBGaramond_400Regular", fontSize: 16, color: Colors.gold, letterSpacing: 4 }}>• • •</Text>
                    </View>
                  </View>
                ) : null}
                contentContainerStyle={styles.chatList}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
                ListFooterComponent={messages.length === 0 ? (
                  <View style={styles.startersWrap}>
                    <Text style={styles.startersLabel}>Ask about this connection...</Text>
                    <View style={styles.starters}>
                      {STARTERS.map((q, i) => (
                        <Pressable key={i} style={({ pressed }) => [styles.starter, pressed && { opacity: 0.75 }]} onPress={() => handleSendChat(q)} accessibilityLabel={q} accessibilityRole="button">
                          <Text style={styles.starterText}>{q}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}
              />
              <View style={[styles.inputBar, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 }]}>
                <TextInput
                  ref={inputRef}
                  style={styles.inputField}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask about this connection..."
                  placeholderTextColor={Colors.muted}
                  multiline
                  maxLength={500}
                  onSubmitEditing={() => { handleSendChat(input); inputRef.current?.focus(); }}
                />
                <Pressable
                  style={[styles.sendBtn, (!input.trim() || isStreaming) && styles.sendBtnDisabled]}
                  onPress={() => { handleSendChat(input); inputRef.current?.focus(); }}
                  disabled={!input.trim() || isStreaming}
                  accessibilityLabel="Send message"
                  accessibilityRole="button"
                >
                  <Feather name="send" size={18} color={input.trim() && !isStreaming ? Colors.bg : Colors.muted} />
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          )}
        </>
      )}
      <ShareCardModal
        visible={showShareCard}
        onClose={() => setShowShareCard(false)}
        data={extractSynastryData(
          reading,
          profile1?.name ?? "Profile 1",
          profile2?.name ?? "Profile 2",
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "CormorantGaramond_700Bold", fontSize: 15, color: Colors.gold, letterSpacing: 2 },
  selectContent: { paddingHorizontal: 20, paddingTop: 4 },
  selectCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "rgba(201,168,76,0.15)", gap: 16 },
  selectTitle: { fontFamily: "CormorantGaramond_400Regular", fontSize: 17, color: Colors.cream, textAlign: "center", letterSpacing: 0.5 },
  selectSubtitle: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 15, color: Colors.muted, textAlign: "center", lineHeight: 24 },
  divider: { fontFamily: "EBGaramond_400Regular", fontSize: 12, color: Colors.gold, textAlign: "center", letterSpacing: 4, opacity: 0.6 },
  notEnoughProfiles: { alignItems: "center", gap: 14, paddingVertical: 12 },
  notEnoughText: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 15, color: Colors.muted, textAlign: "center", lineHeight: 24 },
  goToVaultBtn: { borderWidth: 1, borderColor: Colors.gold, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
  goToVaultText: { fontFamily: "EBGaramond_500Medium", fontSize: 15, color: Colors.gold },
  errorText: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 14, color: Colors.error, textAlign: "center" },
  generateBtn: { backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 52 },
  generateBtnDisabled: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder },
  generateBtnText: { fontFamily: "CormorantGaramond_400Regular", fontSize: 13, color: Colors.bg, letterSpacing: 0.5 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 28, paddingHorizontal: 40 },
  loadingText: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 16, color: Colors.gold, textAlign: "center", lineHeight: 26 },
  connectionBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "rgba(201,168,76,0.1)" },
  connectionAvatar: { alignItems: "center", gap: 4, maxWidth: 100 },
  connAvatarImg: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.gold, resizeMode: "cover" },
  connAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(201,168,76,0.12)", borderWidth: 1.5, borderColor: Colors.gold, alignItems: "center", justifyContent: "center" },
  connInitials: { fontFamily: "CormorantGaramond_400Regular", fontSize: 13, color: Colors.gold },
  connName: { fontFamily: "EBGaramond_500Medium", fontSize: 12, color: Colors.cream, textAlign: "center" },
  connSymbol: { fontFamily: "EBGaramond_400Regular", fontSize: 16, color: Colors.gold, letterSpacing: 4 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "rgba(201,168,76,0.1)" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.gold },
  tabText: { fontFamily: "EBGaramond_500Medium", fontSize: 15, color: Colors.muted },
  tabTextActive: { color: Colors.gold },
  readingContent: { paddingHorizontal: 22, paddingTop: 16, gap: 8 },
  streamingIndicator: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 14, color: Colors.gold, opacity: 0.7, textAlign: "center", marginTop: 8 },
  completeActions: { alignItems: "center", gap: 14, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(201,168,76,0.1)" },
  completeLabel: { fontFamily: "EBGaramond_400Regular", fontSize: 13, color: Colors.gold, letterSpacing: 2, opacity: 0.7 },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: Colors.gold, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, minHeight: 48, width: "100%", justifyContent: "center" },
  shareText: { fontFamily: "EBGaramond_500Medium", fontSize: 15, color: Colors.gold },
  switchToChatBtn: { backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, flexDirection: "row", alignItems: "center", gap: 8, width: "100%", justifyContent: "center" },
  switchToChatText: { fontFamily: "CormorantGaramond_400Regular", fontSize: 13, color: Colors.bg, letterSpacing: 0.5 },
  newSynastryBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },
  newSynastryText: { fontFamily: "EBGaramond_400Regular", fontSize: 14, color: Colors.muted },
  chatList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, flexGrow: 1 },
  startersWrap: { paddingBottom: 16, alignItems: "center", gap: 12 },
  startersLabel: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 15, color: Colors.muted, marginTop: 20 },
  starters: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", paddingHorizontal: 8 },
  starter: { borderWidth: 1, borderColor: "rgba(201,168,76,0.3)", borderRadius: 20, paddingVertical: 9, paddingHorizontal: 14, backgroundColor: "rgba(201,168,76,0.05)", maxWidth: 260 },
  starterText: { fontFamily: "EBGaramond_400Regular", fontSize: 14, color: Colors.cream, textAlign: "center", opacity: 0.85 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(201,168,76,0.1)", backgroundColor: Colors.bg },
  inputField: { flex: 1, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, fontFamily: "EBGaramond_400Regular", fontSize: 16, color: Colors.cream, maxHeight: 120, minHeight: 48 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.gold, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sendBtnDisabled: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder },
});
