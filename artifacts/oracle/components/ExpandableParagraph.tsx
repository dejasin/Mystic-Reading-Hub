import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Animated as RNAnimated,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { fetch } from "expo/fetch";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";

interface ExpandableParagraphProps {
  text: string;
  sessionId: string;
  userData: string;
  isSubscribed: boolean;
  style?: object;
}

interface Layout {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getApiUrl() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/`;
  return "/";
}

export default function ExpandableParagraph({
  text,
  sessionId,
  userData,
  isSubscribed,
  style,
}: ExpandableParagraphProps) {
  const [selected, setSelected] = useState(false);
  const [paragraphLayout, setParagraphLayout] = useState<Layout | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [mode, setMode] = useState<"go_deeper" | "expand">("go_deeper");
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const slideAnim = useRef(new RNAnimated.Value(400)).current;
  const wrapperRef = useRef<View>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleLongPress = useCallback(() => {
    if (!isSubscribed) return;
    wrapperRef.current?.measureInWindow((x, y, width, height) => {
      setParagraphLayout({ x, y, width, height });
      setSelected(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    });
  }, [isSubscribed]);

  const dismissSelected = useCallback(() => {
    setSelected(false);
  }, []);

  const openSheet = useCallback(async (chosenMode: "go_deeper" | "expand") => {
    setMode(chosenMode);
    setStreamedText("");
    setErrorMsg("");
    setIsStreaming(true);
    setSelected(false);
    slideAnim.setValue(400);
    setSheetVisible(true);

    RNAnimated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/expand`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        signal: controller.signal,
        body: JSON.stringify({
          sessionId,
          userData,
          selectedText: text,
          mode: chosenMode,
        }),
      });

      if (!response.ok) {
        setErrorMsg("The Oracle is unavailable. Please try again.");
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setErrorMsg("Stream unavailable.");
        setIsStreaming(false);
        return;
      }

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
            if (parsed.chunk) {
              setStreamedText(prev => prev + parsed.chunk);
            } else if (parsed.event === "done") {
              setIsStreaming(false);
            } else if (parsed.event === "error") {
              setErrorMsg(parsed.message ?? "An error occurred.");
              setIsStreaming(false);
            }
          } catch (e) {
            console.warn("SSE parse error:", e);
          }
        }
      }
      setIsStreaming(false);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setIsStreaming(false);
        return;
      }
      setErrorMsg("The Oracle must rest. Please try again.");
      setIsStreaming(false);
    }
  }, [text, sessionId, userData]);

  const closeSheet = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    RNAnimated.timing(slideAnim, {
      toValue: 400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSheetVisible(false);
      setStreamedText("");
      setErrorMsg("");
      setIsStreaming(false);
    });
  }, [slideAnim]);

  // Calculate action bar position: just below the paragraph
  const getActionBarTop = () => {
    if (!paragraphLayout) return 200;
    const below = paragraphLayout.y + paragraphLayout.height + 8;
    return below;
  };

  return (
    <>
      <Pressable onLongPress={handleLongPress} delayLongPress={400}>
        <View
          ref={wrapperRef}
          style={[styles.paragraphWrapper, selected && styles.paragraphSelected, style]}
        >
          <Text style={styles.body}>{text}</Text>
        </View>
      </Pressable>

      {/* Selection modal: contextual action bar anchored below the paragraph */}
      <Modal
        visible={selected}
        transparent
        animationType="none"
        onRequestClose={dismissSelected}
      >
        {/* Tap-outside dismiss — no dim so reading remains fully visible */}
        <TouchableWithoutFeedback onPress={dismissSelected}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* Action bar positioned at paragraph's bottom edge */}
        {paragraphLayout && (
          <View
            style={[
              styles.actionBarPositioned,
              {
                top: getActionBarTop(),
                left: paragraphLayout.x,
                width: paragraphLayout.width,
              },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.actionBar}>
              <Pressable style={styles.actionBtn} onPress={() => openSheet("go_deeper")}>
                <Feather name="layers" size={13} color={Colors.bg} />
                <Text style={styles.actionBtnText}>Go Deeper</Text>
              </Pressable>
              <View style={styles.actionSep} />
              <Pressable style={styles.actionBtn} onPress={() => openSheet("expand")}>
                <Feather name="maximize-2" size={13} color={Colors.bg} />
                <Text style={styles.actionBtnText}>Expand on This</Text>
              </Pressable>
              <View style={styles.actionSep} />
              <Pressable style={styles.actionCloseBtn} onPress={dismissSelected} hitSlop={8}>
                <Feather name="x" size={14} color={Colors.bg} />
              </Pressable>
            </View>
          </View>
        )}
      </Modal>

      {/* Expansion bottom sheet */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeSheet}
      >
        <TouchableWithoutFeedback onPress={closeSheet}>
          <View style={styles.sheetOverlay} />
        </TouchableWithoutFeedback>

        <RNAnimated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetInner}>
            <StarField />

            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <Feather
                  name={mode === "go_deeper" ? "layers" : "maximize-2"}
                  size={14}
                  color={Colors.gold}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.sheetTitle}>
                  {mode === "go_deeper" ? "Go Deeper" : "Expand on This"}
                </Text>
              </View>
              <Pressable onPress={closeSheet} hitSlop={12}>
                <Feather name="x" size={20} color={Colors.muted} />
              </Pressable>
            </View>

            <Text style={styles.divider}>─── ✦ ───</Text>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {isStreaming && streamedText.length === 0 && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={Colors.gold} />
                  <Text style={styles.loadingText}>The Oracle is reaching deeper...</Text>
                </View>
              )}
              {errorMsg ? (
                <Text style={styles.errorText}>{errorMsg}</Text>
              ) : (
                <Text style={styles.expansionText}>{streamedText}</Text>
              )}
              {isStreaming && streamedText.length > 0 && (
                <ActivityIndicator size="small" color={Colors.gold} style={{ marginTop: 12 }} />
              )}
            </ScrollView>
          </View>
        </RNAnimated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  paragraphWrapper: {
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  paragraphSelected: {
    backgroundColor: "rgba(201,168,76,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.4)",
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },
  body: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 17,
    color: Colors.cream,
    lineHeight: 30,
    opacity: 0.9,
  },
  actionBarPositioned: {
    position: "absolute",
    alignItems: "center",
  },
  actionBar: {
    flexDirection: "row",
    backgroundColor: Colors.gold,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 8,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  actionBtnText: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 11,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  actionSep: {
    width: 1,
    backgroundColor: "rgba(4,4,15,0.25)",
    marginVertical: 8,
  },
  actionCloseBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4,4,15,0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "75%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  sheetInner: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: "rgba(201,168,76,0.2)",
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(201,168,76,0.3)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sheetTitle: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 13,
    color: Colors.gold,
    letterSpacing: 1,
  },
  divider: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 12,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 4,
    opacity: 0.5,
    marginVertical: 12,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  loadingText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 15,
    color: Colors.gold,
    opacity: 0.7,
  },
  errorText: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 15,
    color: Colors.error,
    textAlign: "center",
    paddingVertical: 20,
  },
  expansionText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 17,
    color: Colors.cream,
    lineHeight: 30,
    opacity: 0.9,
  },
});
