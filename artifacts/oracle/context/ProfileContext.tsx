import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { DeepDiveCategory } from "./OracleContext";

export interface ProfilePhoto {
  right_palm?: string;
  left_palm?: string;
  right_iris?: string;
  left_iris?: string;
  face?: string;
  face_front?: string;
  face_left?: string;
  face_right?: string;
}

export interface OracleProfile {
  id: string;
  name: string;
  dob: string;
  birthTime?: string;
  birthTimeUnknown?: boolean;
  birthCity?: string;
  birthCountry?: string;
  gender?: string;
  dominantHand?: string;
  eyeColor?: string;
  photos: ProfilePhoto;
  notes?: string;
  mainReading?: string;
  deepDives?: Partial<Record<DeepDiveCategory, string>>;
  createdAt: number;
}

interface ProfileContextValue {
  profiles: OracleProfile[];
  isLoaded: boolean;
  isPaid: boolean;
  maxProfiles: number;
  addProfile: (p: Omit<OracleProfile, "id" | "createdAt">) => Promise<OracleProfile | null>;
  updateProfile: (id: string, updates: Partial<OracleProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  getProfile: (id: string) => OracleProfile | undefined;
  setIsPaid: (v: boolean) => void;
}

const STORAGE_KEY = "oracle_profiles_v1";
const FREE_MAX = 15;

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<OracleProfile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const maxProfiles = isPaid ? Infinity : FREE_MAX;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setProfiles(parsed);
        } catch (e) {
          console.error("Failed to parse saved profiles:", e);
          Alert.alert("Data Error", "Your saved profiles could not be loaded. They may have been corrupted.");
        }
      }
    }).catch(e => {
      console.error("Failed to read profiles from storage:", e);
      Alert.alert("Storage Error", "Could not access saved data. Please restart the app.");
    }).finally(() => {
      setIsLoaded(true);
    });
  }, []);

  const persist = useCallback(async (updated: OracleProfile[]) => {
    setProfiles(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save profiles:", e);
      Alert.alert("Save Failed", "Your profile changes could not be saved. Please try again.");
    }
  }, []);

  const addProfile = useCallback(async (p: Omit<OracleProfile, "id" | "createdAt">) => {
    if (!isPaid && profiles.length >= FREE_MAX) return null;
    const newProfile: OracleProfile = {
      ...p,
      id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: Date.now(),
    };
    await persist([...profiles, newProfile]);
    return newProfile;
  }, [profiles, isPaid, persist]);

  const updateProfile = useCallback(async (id: string, updates: Partial<OracleProfile>) => {
    await persist(profiles.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [profiles, persist]);

  const deleteProfile = useCallback(async (id: string) => {
    await persist(profiles.filter(p => p.id !== id));
  }, [profiles, persist]);

  const getProfile = useCallback((id: string) => profiles.find(p => p.id === id), [profiles]);

  return (
    <ProfileContext.Provider value={{
      profiles, isLoaded, isPaid, maxProfiles,
      addProfile, updateProfile, deleteProfile, getProfile, setIsPaid,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfiles() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfiles must be used inside ProfileProvider");
  return ctx;
}
