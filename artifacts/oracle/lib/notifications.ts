import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVICE_ID_KEY = "oracle_device_id";
const NOTIFICATION_PROMPTED_KEY = "oracle_notification_prompted";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function getDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export async function hasBeenPromptedForNotifications(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIFICATION_PROMPTED_KEY);
  return val === "true";
}

export async function markNotificationPrompted(): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_PROMPTED_KEY, "true");
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("oracle-notifications", {
      name: "Oracle Notifications",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#c9a84c",
    });
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    });
    return tokenData.data;
  } catch (error) {
    console.error("Failed to get push token:", error);
    return null;
  }
}

export async function registerTokenWithServer(token: string): Promise<void> {
  const deviceId = await getDeviceId();
  const baseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

  try {
    await fetch(`${baseUrl}/api/notifications/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        token,
        platform: Platform.OS,
      }),
    });
  } catch (error) {
    console.error("Failed to register token with server:", error);
  }
}

export async function recordActivity(): Promise<void> {
  const deviceId = await getDeviceId();
  const baseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

  try {
    await fetch(`${baseUrl}/api/notifications/activity/${deviceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
  }
}

export async function requestAndRegisterNotifications(): Promise<boolean> {
  await markNotificationPrompted();
  const token = await registerForPushNotifications();
  if (token) {
    await registerTokenWithServer(token);
    return true;
  }
  return false;
}

export type NotificationRoute = {
  screen: string;
  type: string;
};

export function parseNotificationRoute(notification: Notifications.Notification): NotificationRoute | null {
  const data = notification.request.content.data;
  if (data && typeof data.screen === "string") {
    return {
      screen: data.screen,
      type: (data.type as string) ?? "unknown",
    };
  }
  return null;
}
