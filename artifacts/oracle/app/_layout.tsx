import {
  CormorantGaramond_400Regular,
  CormorantGaramond_700Bold,
  CormorantGaramond_400Regular_Italic,
  useFonts as useCormorantFonts,
} from "@expo-google-fonts/cormorant-garamond";
import {
  EBGaramond_400Regular,
  EBGaramond_500Medium,
  EBGaramond_400Regular_Italic,
  useFonts as useGaramondFonts,
} from "@expo-google-fonts/eb-garamond";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl } from "@workspace/api-client-react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DeepLinkHandler } from "@/components/DeepLinkHandler";
import { OracleProvider } from "@/context/OracleContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { AuthProvider } from "@/context/AuthContext";
import { JournalProvider } from "@/context/JournalContext";
import { ReferralProvider } from "@/context/ReferralContext";
import Colors from "@/constants/colors";
import { initializeRevenueCat, SubscriptionProvider } from "@/lib/revenuecat";
import { initAnalytics, trackFunnelStep } from "@/lib/analytics";
import { recordActivity, parseNotificationRoute } from "@/lib/notifications";

setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
initializeRevenueCat();
initAnalytics();

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [cormorantLoaded, cormorantError] = useCormorantFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_700Bold,
    CormorantGaramond_400Regular_Italic,
  });

  const [garamondLoaded, garamondError] = useGaramondFonts({
    EBGaramond_400Regular,
    EBGaramond_500Medium,
    EBGaramond_400Regular_Italic,
  });

  const fontsLoaded = cormorantLoaded && garamondLoaded;
  const fontError = cormorantError || garamondError;

  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      trackFunnelStep("app_open");
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    recordActivity();

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = parseNotificationRoute(response.notification);
      if (route) {
        const screenMap: Record<string, string> = {
          index: "/",
          intake: "/intake",
          reading: "/reading",
          chat: "/chat",
          profiles: "/profiles",
        };
        const path = screenMap[route.screen] ?? "/";
        try {
          router.push(path as any);
        } catch {
          router.push("/");
        }
      }
    });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
    };
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SubscriptionProvider>
          <AuthProvider>
          <ProfileProvider>
            <JournalProvider>
            <ReferralProvider>
            <DeepLinkHandler />
            <OracleProvider>
              <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg }}>
                <KeyboardProvider>
                  <ErrorBoundary>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: Colors.bg },
                        animation: "fade",
                      }}
                    >
                      <Stack.Screen name="index" />
                      <Stack.Screen name="onboarding" options={{ animation: "fade", gestureEnabled: false }} />
                      <Stack.Screen name="intake" />
                      <Stack.Screen name="ritual" />
                      <Stack.Screen name="reading" />
                      <Stack.Screen name="chat" />
                      <Stack.Screen name="profiles" />
                      <Stack.Screen name="synastry" />
                      <Stack.Screen name="profile-action" />
                      <Stack.Screen name="profile-reading" />
                      <Stack.Screen name="login" />
                      <Stack.Screen name="journal" />
                      <Stack.Screen name="journal-detail" />
                      <Stack.Screen name="daily-history" />
                      <Stack.Screen name="settings" />
                      <Stack.Screen name="referral" />
                      <Stack.Screen name="notification-settings" />
                    </Stack>
                  </ErrorBoundary>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </OracleProvider>
            </ReferralProvider>
            </JournalProvider>
          </ProfileProvider>
          </AuthProvider>
          </SubscriptionProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
