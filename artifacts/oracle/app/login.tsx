import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import StarField from "@/components/StarField";
import { useAuth } from "@/context/AuthContext";
import { customFetch } from "@workspace/api-client-react";

type Step = "email" | "code";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const codeInputRef = useRef<TextInput>(null);

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await customFetch("/api/auth/send-code", {
        method: "POST",
        body: JSON.stringify({ email: trimmed }),
        headers: { "Content-Type": "application/json" },
      });
      setStep("code");
      setTimeout(() => codeInputRef.current?.focus(), 300);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to send verification code.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit verification code.");
      return;
    }
    setLoading(true);
    try {
      const result = await customFetch<{
        success: boolean;
        token: string;
        user: { id: string; email: string };
      }>("/api/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
        headers: { "Content-Type": "application/json" },
      });
      await login(result.token, result.user);
      router.back();
    } catch (e) {
      let errorMsg = "Invalid or expired code. Please try again.";
      if (e && typeof e === "object" && "data" in e) {
        const data = (e as { data: { error?: string } }).data;
        if (data?.error) errorMsg = data.error;
      }
      Alert.alert("Verification Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCode("");
    setLoading(true);
    try {
      await customFetch("/api/auth/send-code", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        headers: { "Content-Type": "application/json" },
      });
      Alert.alert("Code Sent", "A new verification code has been sent.");
    } catch {
      Alert.alert("Error", "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StarField />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={20} color={Colors.gold} />
        </Pressable>
        <Text style={styles.headerTitle}>Sign In</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <Animated.View entering={FadeIn.duration(600)} style={styles.content}>
          <Text style={styles.sigil}>✦</Text>

          {step === "email" ? (
            <>
              <Text style={styles.title}>Enter Your Email</Text>
              <Text style={styles.subtitle}>
                We'll send you a verification code to sign in.
              </Text>

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                editable={!loading}
                onSubmitEditing={handleSendCode}
                returnKeyType="send"
              />

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && { opacity: 0.85 },
                  loading && { opacity: 0.6 },
                ]}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.bg} />
                ) : (
                  <Text style={styles.primaryBtnText}>Send Code</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Enter Verification Code</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to{"\n"}
                <Text style={styles.emailHighlight}>{email.trim().toLowerCase()}</Text>
              </Text>

              <TextInput
                ref={codeInputRef}
                style={[styles.input, styles.codeInput]}
                value={code}
                onChangeText={(t) => setCode(t.replace(/[^0-9]/g, "").slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={Colors.muted}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                onSubmitEditing={handleVerifyCode}
                returnKeyType="done"
              />

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && { opacity: 0.85 },
                  loading && { opacity: 0.6 },
                ]}
                onPress={handleVerifyCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.bg} />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify & Sign In</Text>
                )}
              </Pressable>

              <View style={styles.secondaryRow}>
                <Pressable onPress={handleResend} disabled={loading}>
                  <Text style={styles.linkText}>Resend code</Text>
                </Pressable>
                <Text style={styles.dotSep}>·</Text>
                <Pressable onPress={() => { setStep("email"); setCode(""); }}>
                  <Text style={styles.linkText}>Change email</Text>
                </Pressable>
              </View>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
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
    fontSize: 15,
    color: Colors.gold,
    letterSpacing: 2,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  sigil: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 32,
    color: Colors.gold,
    marginBottom: 24,
  },
  title: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 18,
    color: Colors.cream,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emailHighlight: {
    color: Colors.gold,
    fontFamily: "EBGaramond_500Medium",
  },
  input: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "EBGaramond_400Regular",
    fontSize: 17,
    color: Colors.cream,
    marginBottom: 20,
  },
  codeInput: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    fontFamily: "EBGaramond_500Medium",
  },
  primaryBtn: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  primaryBtnText: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 14,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 12,
  },
  linkText: {
    fontFamily: "EBGaramond_500Medium",
    fontSize: 15,
    color: Colors.gold,
  },
  dotSep: {
    color: Colors.muted,
    fontSize: 14,
  },
});
