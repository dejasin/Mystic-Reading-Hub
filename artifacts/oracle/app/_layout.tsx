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
import Colors from "@/constants/colors";

setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

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
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ProfileProvider>
            <OracleProvider>
              <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg }}>
                <KeyboardProvider>
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
                  </Stack>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </OracleProvider>
          </ProfileProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
