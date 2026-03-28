import { useEffect } from "react";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useReferral } from "@/context/ReferralContext";

function extractReferralCode(url: string): string | null {
  try {
    const patterns = [
      /\/invite\/([A-Za-z0-9]+)/,
      /[?&]ref=([A-Za-z0-9]+)/,
      /oracle:\/\/invite\/([A-Za-z0-9]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) return match[1].toUpperCase();
    }
  } catch {}
  return null;
}

export function DeepLinkHandler() {
  const { setPendingReferralCode } = useReferral();

  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      const code = extractReferralCode(event.url);
      if (code) {
        setPendingReferralCode(code);
        router.push("/intake");
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    const sub = Linking.addEventListener("url", handleUrl);
    return () => sub.remove();
  }, [setPendingReferralCode]);

  return null;
}
