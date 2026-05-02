import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import { safeOpenURL } from "@/lib/safeOpenURL";

const IS_ITEMS = [
  "An AI life advisor that uses biometric reference images and a short questionnaire to build a six-dimension behavioral profile of how you make decisions.",
  "A grounded conversation partner you can come back to for clarity on real decisions — career, relationships, money, family.",
  "A self-reflection and self-understanding tool, powered by Anthropic Claude, that uses your profile as ongoing context.",
];

const IS_NOT_ITEMS = [
  "Fortune telling, divination, or palm-reading in the supernatural sense.",
  "A predictor of future events.",
  "Medical, psychological, legal, or financial advice.",
  "A replacement for professional support when you need it — therapist, doctor, lawyer, advisor.",
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    router.back();
  };

  const handleSendFeedback = () => {
    safeOpenURL("mailto:support@theoracleapp.com?subject=Oracle%20Feedback");
  };

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
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Go back to settings"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color={Colors.gold} />
        </Pressable>
        <Text style={styles.headerTitle}>About Oracle</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 48 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(600)} style={styles.titleBlock}>
          <Text style={styles.title}>What Oracle Is — and Isn't</Text>
          <Text style={styles.divider}>─── ✦ ───</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(600).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>What Oracle Is</Text>
          {IS_ITEMS.map((line, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bullet}>✦</Text>
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeIn.duration(600).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>What Oracle Is NOT</Text>
          {IS_NOT_ITEMS.map((line, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bullet}>✦</Text>
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeIn.duration(600).delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>How the Hand Analysis Works</Text>
          <Text style={styles.body}>
            Oracle uses photos of your hands as one input among several. The
            images, your answers to a short behavioral questionnaire, and the
            context you choose to share are sent to Anthropic Claude, which
            generates a six-dimension behavioral profile — a description of
            how you tend to think, decide, and respond under pressure.
          </Text>
          <Text style={styles.body}>
            The hand photos are biometric reference data. They are not read
            for fate or fortune. Images are not retained after your session
            is generated.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(600).delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>A Note on Predictions</Text>
          <Text style={styles.body}>
            Oracle does not predict the future. The behavioral profile and
            the chat that follows are intended for personal reflection and
            decision support only. Any choice you make remains yours, and
            for serious life decisions you should consult a qualified
            professional.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(600).delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Powered By</Text>
          <Text style={styles.body}>
            All of Oracle's responses are generated by Anthropic Claude. Your
            biometric reference images and questionnaire answers are sent to
            Anthropic for processing. Subscriptions are handled by Apple via
            in-app purchase — Oracle never sees or stores your payment
            details.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(600).delay(600)} style={styles.feedbackBlock}>
          <Pressable
            onPress={handleSendFeedback}
            style={({ pressed }) => [
              styles.feedbackBtn,
              pressed && { opacity: 0.75 },
            ]}
            accessibilityLabel="Send feedback to Oracle support"
            accessibilityRole="button"
          >
            <Feather name="mail" size={16} color={Colors.gold} />
            <Text style={styles.feedbackText}>Send Feedback</Text>
          </Pressable>
        </Animated.View>
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
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: Colors.cream,
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 20,
  },
  titleBlock: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  title: {
    color: Colors.cream,
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  divider: {
    color: Colors.gold,
    fontSize: 14,
    marginTop: 8,
    opacity: 0.6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  bullet: {
    color: Colors.gold,
    fontSize: 14,
    lineHeight: 22,
    width: 18,
  },
  bulletText: {
    flex: 1,
    color: Colors.cream,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.92,
  },
  body: {
    color: Colors.cream,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.92,
    marginBottom: 10,
  },
  feedbackBlock: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  feedbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  feedbackText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
