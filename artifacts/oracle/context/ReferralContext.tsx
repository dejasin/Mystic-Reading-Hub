import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetch } from "expo/fetch";
import * as Crypto from "expo-crypto";

const DEVICE_ID_KEY = "@oracle_device_id";
const REFERRAL_CODE_PENDING_KEY = "@oracle_pending_referral";

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  return `https://${domain}`;
}

interface ReferralState {
  deviceId: string | null;
  referralCode: string | null;
  referralCount: number;
  freeDeepDives: number;
  pendingReferralCode: string | null;
  loading: boolean;
}

interface ReferralContextValue extends ReferralState {
  fetchReferralCode: () => Promise<void>;
  redeemReferralCode: (code: string) => Promise<{ success: boolean; message: string }>;
  setPendingReferralCode: (code: string) => void;
  clearPendingReferralCode: () => void;
  useReward: () => Promise<boolean>;
  refreshStats: () => Promise<void>;
}

const ReferralContext = createContext<ReferralContextValue | null>(null);

export function useReferral() {
  const ctx = useContext(ReferralContext);
  if (!ctx) throw new Error("useReferral must be used within ReferralProvider");
  return ctx;
}

async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function ReferralProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ReferralState>({
    deviceId: null,
    referralCode: null,
    referralCount: 0,
    freeDeepDives: 0,
    pendingReferralCode: null,
    loading: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const deviceId = await getOrCreateDeviceId();
        const pending = await AsyncStorage.getItem(REFERRAL_CODE_PENDING_KEY);
        setState(prev => ({ ...prev, deviceId, pendingReferralCode: pending, loading: false }));
      } catch (e) {
        console.error("Failed to initialize referral context:", e);
        setState(prev => ({ ...prev, loading: false }));
      }
    })();
  }, []);

  const fetchReferralCode = useCallback(async () => {
    if (!state.deviceId) return;
    try {
      const res = await fetch(`${getApiBase()}/api/referral/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: state.deviceId }),
      });
      const data = await res.json();
      if (data.referralCode) {
        setState(prev => ({
          ...prev,
          referralCode: data.referralCode,
          referralCount: data.referralCount ?? 0,
        }));
      }
    } catch (e) {
      console.error("Failed to fetch referral code:", e);
    }
  }, [state.deviceId]);

  const refreshStats = useCallback(async () => {
    if (!state.deviceId) return;
    try {
      const res = await fetch(`${getApiBase()}/api/referral/stats/${state.deviceId}`);
      const data = await res.json();
      setState(prev => ({
        ...prev,
        referralCode: data.referralCode ?? prev.referralCode,
        referralCount: data.referralCount ?? 0,
        freeDeepDives: data.freeDeepDives ?? 0,
      }));
    } catch (e) {
      console.error("Failed to refresh referral stats:", e);
    }
  }, [state.deviceId]);

  const redeemReferralCode = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!state.deviceId) return { success: false, message: "Device not ready" };
    try {
      const res = await fetch(`${getApiBase()}/api/referral/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: code, deviceId: state.deviceId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await AsyncStorage.removeItem(REFERRAL_CODE_PENDING_KEY);
        setState(prev => ({ ...prev, pendingReferralCode: null }));
        await refreshStats();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || data.message || "Failed to redeem" };
    } catch (e) {
      console.error("Failed to redeem referral code:", e);
      return { success: false, message: "Network error" };
    }
  }, [state.deviceId, refreshStats]);

  const setPendingReferralCode = useCallback((code: string) => {
    AsyncStorage.setItem(REFERRAL_CODE_PENDING_KEY, code);
    setState(prev => ({ ...prev, pendingReferralCode: code }));
  }, []);

  const clearPendingReferralCode = useCallback(() => {
    AsyncStorage.removeItem(REFERRAL_CODE_PENDING_KEY);
    setState(prev => ({ ...prev, pendingReferralCode: null }));
  }, []);

  const useReward = useCallback(async (): Promise<boolean> => {
    if (!state.deviceId) return false;
    try {
      const res = await fetch(`${getApiBase()}/api/referral/use-reward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: state.deviceId }),
      });
      const data = await res.json();
      if (data.success) {
        setState(prev => ({ ...prev, freeDeepDives: Math.max(0, prev.freeDeepDives - 1) }));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to use reward:", e);
      return false;
    }
  }, [state.deviceId]);

  useEffect(() => {
    if (state.deviceId) {
      fetchReferralCode();
      refreshStats();
    }
  }, [state.deviceId]);

  return (
    <ReferralContext.Provider
      value={{
        ...state,
        fetchReferralCode,
        redeemReferralCode,
        setPendingReferralCode,
        clearPendingReferralCode,
        useReward,
        refreshStats,
      }}
    >
      {children}
    </ReferralContext.Provider>
  );
}
