import React, { createContext, useContext } from "react";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";
import { useMutation, useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";

const REVENUECAT_TEST_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = "full_reading";

// Product identifiers for RevenueCat / App Store Connect.
//
// These constants document the auto-renewable subscription product IDs the
// Oracle paywall expects to find. They MUST exist in BOTH places before a
// build is submitted, otherwise that tier's purchase will fail at runtime
// (and Apple will reject the build under guideline 2.1 — App Completeness):
//
//   1. App Store Connect → Subscriptions → "Oracle Pro" group
//        - oracle_monthly_999  ($9.99 / month, no intro offer)
//        - oracle_annual_4999  ($49.99 / year, no intro offer)
//   2. RevenueCat dashboard → Products  (same identifiers, attached to the
//      "default" offering as the MONTHLY and ANNUAL packages respectively).
//
// The paywall UI does NOT reference these strings directly — it reads the
// live `priceString` off the package returned by `Purchases.getOfferings()`
// so Apple's "displayed price must come from StoreKit" rule is honored.
// These constants exist for documentation, restore-purchase logic, and
// runtime verification (see the dev-only offerings log below).
export const MONTHLY_PRODUCT_ID = "oracle_monthly_999";
export const ANNUAL_PRODUCT_ID = "oracle_annual_4999";

let offeringsVerificationLogged = false;

let revenueCatInitialized = false;

function getRevenueCatApiKey(): string | null {
  if (__DEV__ || Platform.OS === "web" || Constants.executionEnvironment === "storeClient") {
    if (!REVENUECAT_TEST_API_KEY) {
      console.warn("RevenueCat: EXPO_PUBLIC_REVENUECAT_TEST_API_KEY is not set. Set it in the Replit Secrets panel to enable purchases.");
      return null;
    }
    return REVENUECAT_TEST_API_KEY;
  }

  if (Platform.OS === "ios") {
    if (!REVENUECAT_IOS_API_KEY) {
      console.warn("RevenueCat: EXPO_PUBLIC_REVENUECAT_IOS_API_KEY is not set. Set it in the Replit Secrets panel to enable purchases.");
      return null;
    }
    return REVENUECAT_IOS_API_KEY;
  }

  if (Platform.OS === "android") {
    if (!REVENUECAT_ANDROID_API_KEY) {
      console.warn("RevenueCat: EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY is not set. Set it in the Replit Secrets panel to enable purchases.");
      return null;
    }
    return REVENUECAT_ANDROID_API_KEY;
  }

  if (!REVENUECAT_TEST_API_KEY) {
    console.warn("RevenueCat: EXPO_PUBLIC_REVENUECAT_TEST_API_KEY is not set. Set it in the Replit Secrets panel to enable purchases.");
    return null;
  }
  return REVENUECAT_TEST_API_KEY;
}

export function initializeRevenueCat() {
  try {
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) {
      return;
    }

    Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.WARN);
    Purchases.configure({ apiKey });
    revenueCatInitialized = true;

    console.log("RevenueCat: configured successfully");
  } catch (e) {
    console.warn("RevenueCat: initialization failed —", e);
  }
}

function useSubscriptionContext() {
  const customerInfoQuery = useQuery({
    queryKey: ["revenuecat", "customer-info"],
    queryFn: async () => {
      if (!revenueCatInitialized) return null;
      const info = await Purchases.getCustomerInfo();
      return info;
    },
    staleTime: 60 * 1000,
  });

  const offeringsQuery = useQuery({
    queryKey: ["revenuecat", "offerings"],
    queryFn: async () => {
      if (!revenueCatInitialized) return null;
      const offerings = await Purchases.getOfferings();

      if (__DEV__ && !offeringsVerificationLogged) {
        offeringsVerificationLogged = true;
        const current = offerings?.current;
        const packages = current?.availablePackages ?? [];
        const ids = packages.map((p) => ({
          packageType: p.packageType,
          identifier: p.product?.identifier,
          priceString: p.product?.priceString,
        }));
        const monthlyOk = packages.some(
          (p) => p.product?.identifier === MONTHLY_PRODUCT_ID,
        );
        const annualOk = packages.some(
          (p) => p.product?.identifier === ANNUAL_PRODUCT_ID,
        );
        console.log(
          "[RevenueCat] offerings verification —",
          JSON.stringify(
            {
              currentOfferingId: current?.identifier ?? null,
              availablePackages: ids,
              monthlySkuFound: monthlyOk,
              annualSkuFound: annualOk,
              expected: { MONTHLY_PRODUCT_ID, ANNUAL_PRODUCT_ID },
            },
            null,
            2,
          ),
        );
        if (!monthlyOk || !annualOk) {
          console.warn(
            "[RevenueCat] One or both paywall SKUs are missing from the current offering. " +
              "Verify both products exist in App Store Connect AND in RevenueCat (default offering).",
          );
        }
      }

      return offerings;
    },
    staleTime: 300 * 1000,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageToPurchase: any) => {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    },
    onSuccess: () => customerInfoQuery.refetch(),
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      return Purchases.restorePurchases();
    },
    onSuccess: () => customerInfoQuery.refetch(),
  });

  const isSubscribed = customerInfoQuery.data?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;

  return {
    customerInfo: customerInfoQuery.data ?? null,
    offerings: offeringsQuery.data ?? null,
    isSubscribed,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    purchase: purchaseMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    purchaseError: purchaseMutation.error,
    isConfigured: revenueCatInitialized,
  };
}

type SubscriptionContextValue = ReturnType<typeof useSubscriptionContext>;
const Context = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const value = useSubscriptionContext();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSubscription() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return ctx;
}
