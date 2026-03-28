import {
  CinzelDecorative_400Regular,
  CinzelDecorative_700Bold,
  useFonts as useCinzelFonts,
} from "@expo-google-fonts/cinzel-decorative";
import {
  EBGaramond_400Regular,
  EBGaramond_500Medium,
  EBGaramond_400Regular_Italic,
  useFonts as useGaramondFonts,
} from "@expo-google-fonts/eb-garamond";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl } from "@workspace/api-client-react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OracleProvider } from "@/context/OracleContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { AuthProvider } from "@/context/AuthContext";
import { JournalProvider } from "@/context/JournalContext";
import Colors from "@/constants/colors";
import { initializeRevenueCat, SubscriptionProvider } from "@/lib/revenuecat";
import { initAnalytics, trackFunnelStep } from "@/lib/analytics";

setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
initializeRevenueCat();
initAnalytics();

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [cinzelLoaded, cinzelError] = useCinzelFonts({
    CinzelDecorative_400Regular,
    CinzelDecorative_700Bold,
  });

  const [garamondLoaded, garamondError] = useGaramondFonts({
    EBGaramond_400Regular,
    EBGaramond_500Medium,
    EBGaramond_400Regular_Italic,
  });

  const fontsLoaded = cinzelLoaded && garamondLoaded;
  const fontError = cinzelError || garamondError;

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      trackFunnelStep("app_open");
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SubscriptionProvider>
          <AuthProvider>
          <ProfileProvider>
            <JournalProvider>
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
                    </Stack>
                  </ErrorBoundary>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </OracleProvider>
            </JournalProvider>
          </ProfileProvider>
          </AuthProvider>
          </SubscriptionProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
