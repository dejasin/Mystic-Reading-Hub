import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Platform,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { fetch } from "expo/fetch";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import { useOracle } from "@/context/OracleContext";

let messageCounter = 0;
function generateId(): string {
  messageCounter++;
  return `msg-${Date.now()}-${messageCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTER_QUESTIONS = [
  "When will I find love?",
  "What is blocking my success?",
  "What career path suits me?",
  "Why do I keep repeating this pattern?",
  "What is coming in the next 6 months?",
];

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowOracle]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarSymbol}>✦</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleOracle]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextOracle]}>
          {msg.content}
        </Text>
      </View>
    </Animated.View>
  );
}

function TypingIndicator() {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowOracle]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarSymbol}>✦</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleOracle, styles.typingBubble]}>
        <Text style={styles.typingDots}>• • •</Text>
      </View>
    </View>
  );
}

function FollowupChips({
  chips,
  onChipPress,
}: {
  chips: string[];
  onChipPress: (chip: string) => void;
}) {
  if (chips.length === 0) return null;
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.followupContainer}>
      {chips.map((chip, i) => (
        <Pressable
          key={i}
          style={({ pressed }) => [styles.followupChip, pressed && { opacity: 0.7 }]}
          onPress={() => onChipPress(chip)}
          accessibilityLabel={chip}
          accessibilityRole="button"
        >
          <Text style={styles.followupChipText}>{chip}</Text>
        </Pressable>
      ))}
    </Animated.View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useOracle();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [followupChips, setFollowupChips] = useState<string[]>([]);
  const followupAbortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<TextInput>(null);

  const getApiUrl = () => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (domain) return `https://${domain}/`;
    return "/";
  };

  const fetchFollowups = async (lastResponse: string, conversationContext: string) => {
    followupAbortRef.current?.abort();
    const controller = new AbortController();
    followupAbortRef.current = controller;

    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}api/chat/followups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastResponse, conversationContext }),
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (!res.ok) return;
      const data = await res.json() as { followups?: string[] };
      if (controller.signal.aborted) return;
      if (Array.isArray(data.followups) && data.followups.length > 0) {
        setFollowupChips(data.followups);
      }
    } catch {
    }
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    if (Platform.OS !== "web") {
      await Haptics.selectionAsync();
    }

    setFollowupChips([]);
    followupAbortRef.current?.abort();

    const currentMessages = [...messages];
    const userMsg: Message = { id: generateId(), role: "user", content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);
    setShowTyping(true);
    inputRef.current?.focus();

    let finalContent = "";

    try {
      const baseUrl = getApiUrl();
      const readingSummary = [state.freeReading, state.paidReading, state.archetypeReading]
        .filter(Boolean)
        .join("\n")
        .substring(0, 800);

      const chatHistory = [
        ...currentMessages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: trimmed },
      ];

      const response = await fetch(`${baseUrl}api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          messages: chatHistory,
          readingSummary,
          sessionId: state.sessionId,
        }),
      });

      if (!response.ok) throw new Error("API error");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let assistantAdded = false;

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
            if (parsed.event === "done") continue;
            if (parsed.content) {
              fullContent += parsed.content;
              if (!assistantAdded) {
                setShowTyping(false);
                setMessages(prev => [...prev, { id: generateId(), role: "assistant", content: fullContent }]);
                assistantAdded = true;
              } else {
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullContent };
                  return updated;
                });
              }
            }
          } catch {}
        }
      }

      finalContent = fullContent;
    } catch {
      setShowTyping(false);
      setMessages(prev => [
        ...prev,
        { id: generateId(), role: "assistant", content: "The Oracle is temporarily unavailable. Please try again." },
      ]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
    }

    if (finalContent) {
      const conversationContext = [
        ...currentMessages.slice(-4).map(m => `${m.role}: ${m.content}`),
        `user: ${trimmed}`,
      ].join("\n");
      fetchFollowups(finalContent, conversationContext);
    }
  };

  const handleChipPress = (chip: string) => {
    setFollowupChips([]);
    handleSend(chip);
  };

  const handleInputChange = (text: string) => {
    if (followupChips.length > 0 && text.length > 0) {
      setFollowupChips([]);
    }
    setInput(text);
  };

  const reversedMessages = [...messages].reverse();
  const showStarters = messages.length === 0 && !isStreaming;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12} accessibilityLabel="Go back" accessibilityRole="button">
          <Feather name="arrow-left" size={20} color={Colors.gold} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSymbol}>✦</Text>
          <Text style={styles.headerTitle}>THE ORACLE</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          data={reversedMessages}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <>
              <MessageBubble msg={item} />
              {index === 0 && item.role === "assistant" && followupChips.length > 0 && !isStreaming && (
                <FollowupChips chips={followupChips} onChipPress={handleChipPress} />
              )}
            </>
          )}
          inverted={messages.length > 0}
          ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.messageList}
          ListFooterComponent={
            showStarters ? (
              <View style={styles.startersContainer}>
                <Text style={styles.startersTitle}>Ask The Oracle anything...</Text>
                <View style={styles.starterChips}>
                  {STARTER_QUESTIONS.map((q, i) => (
                    <Pressable
                      key={i}
                      style={({ pressed }) => [styles.chip, pressed && { opacity: 0.75 }]}
                      onPress={() => handleSend(q)}
                      accessibilityLabel={q}
                      accessibilityRole="button"
                    >
                      <Text style={styles.chipText}>{q}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null
          }
        />

        {/* Input */}
        <View style={[styles.inputBar, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 }]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={handleInputChange}
            placeholder="Ask The Oracle..."
            placeholderTextColor={Colors.muted}
            multiline
            maxLength={500}
            blurOnSubmit={false}
            onSubmitEditing={() => handleSend(input)}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              (!input.trim() || isStreaming) && styles.sendBtnDisabled,
              pressed && input.trim() && !isStreaming && { opacity: 0.8 },
            ]}
            onPress={() => {
              handleSend(input);
              inputRef.current?.focus();
            }}
            disabled={!input.trim() || isStreaming}
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            <Feather
              name="send"
              size={18}
              color={input.trim() && !isStreaming ? Colors.bg : Colors.muted}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(201,168,76,0.12)",
    backgroundColor: Colors.bg,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerSymbol: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.gold,
  },
  headerTitle: {
    fontFamily: "CinzelDecorative_700Bold",
    fontSize: 14,
    color: Colors.gold,
    letterSpacing: 2,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexGrow: 1,
  },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: 14,
    maxWidth: "85%",
    alignItems: "flex-end",
    gap: 8,
  },
  bubbleRowUser: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  bubbleRowOracle: {
    alignSelf: "flex-start",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(201,168,76,0.15)",
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarSymbol: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 11,
    color: Colors.gold,
  },
  bubble: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: "100%",
  },
  bubbleUser: {
    backgroundColor: Colors.userBubble,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.3)",
    borderBottomRightRadius: 4,
  },
  bubbleOracle: {
    backgroundColor: Colors.oracleBubble,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.1)",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    lineHeight: 22,
    fontSize: 16,
  },
  bubbleTextUser: {
    fontFamily: "EBGaramond_400Regular",
    color: Colors.cream,
  },
  bubbleTextOracle: {
    fontFamily: "EBGaramond_400Regular",
    color: Colors.cream,
    opacity: 0.95,
  },
  typingBubble: { paddingVertical: 14 },
  typingDots: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.gold,
    letterSpacing: 4,
  },
  followupContainer: {
    marginTop: -6,
    marginBottom: 14,
    marginLeft: 36,
    gap: 8,
    alignItems: "flex-start",
  },
  followupChip: {
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.25)",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "rgba(201,168,76,0.04)",
    maxWidth: 280,
  },
  followupChipText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 13,
    color: Colors.cream,
    opacity: 0.8,
    lineHeight: 18,
  },
  startersContainer: {
    paddingBottom: 24,
    alignItems: "center",
    gap: 16,
  },
  startersTitle: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 15,
    color: Colors.muted,
    textAlign: "center",
    marginTop: 24,
  },
  starterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.3)",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(201,168,76,0.05)",
    maxWidth: 280,
  },
  chipText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    color: Colors.cream,
    textAlign: "center",
    opacity: 0.85,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(201,168,76,0.1)",
    backgroundColor: Colors.bg,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.cream,
    maxHeight: 120,
    minHeight: 48,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
});
