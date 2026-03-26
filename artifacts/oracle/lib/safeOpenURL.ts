import { Alert, Linking } from "react-native";

export async function safeOpenURL(url: string): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Cannot Open Link", "Your device is unable to open this link.");
      return;
    }
    await Linking.openURL(url);
  } catch (e) {
    console.error("Failed to open URL:", url, e);
    Alert.alert("Error", "Something went wrong while opening the link.");
  }
}
