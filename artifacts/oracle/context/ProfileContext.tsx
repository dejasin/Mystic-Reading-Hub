import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { DeepDiveCategory } from "./OracleContext";
import { useAuth } from "./AuthContext";
import { customFetch } from "@workspace/api-client-react";

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
  serverId?: string;
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
  // Optional behavioral indicator captured by the questionnaire (Task #60).
  // Typed here so the profiles screen indicator helper can read it without
  // breaking existing profiles that pre-date the questionnaire.
  coreMotivation?: string;
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

interface ServerProfile {
  id: string;
  localId: string | null;
  name: string;
  dob: string;
  birthTime?: string | null;
  birthTimeUnknown?: boolean | null;
  birthCity?: string | null;
  birthCountry?: string | null;
  gender?: string | null;
  dominantHand?: string | null;
  eyeColor?: string | null;
  notes?: string | null;
  mainReading?: string | null;
  deepDives?: Partial<Record<DeepDiveCategory, string>>;
  createdAt: number;
  updatedAt: number;
}

function profileToServerPayload(p: OracleProfile) {
  return {
    serverId: p.serverId || undefined,
    localId: p.id,
    name: p.name,
    dob: p.dob,
    birthTime: p.birthTime || undefined,
    birthTimeUnknown: p.birthTimeUnknown || false,
    birthCity: p.birthCity || undefined,
    birthCountry: p.birthCountry || undefined,
    gender: p.gender || undefined,
    dominantHand: p.dominantHand || undefined,
    eyeColor: p.eyeColor || undefined,
    notes: p.notes || undefined,
    mainReading: p.mainReading || undefined,
    deepDives: p.deepDives || undefined,
  };
}

function serverProfileToLocal(sp: ServerProfile): OracleProfile {
  return {
    id: sp.localId || sp.id,
    serverId: sp.id,
    name: sp.name,
    dob: sp.dob,
    birthTime: sp.birthTime || undefined,
    birthTimeUnknown: sp.birthTimeUnknown || undefined,
    birthCity: sp.birthCity || undefined,
    birthCountry: sp.birthCountry || undefined,
    gender: sp.gender || undefined,
    dominantHand: sp.dominantHand || undefined,
    eyeColor: sp.eyeColor || undefined,
    notes: sp.notes || undefined,
    mainReading: sp.mainReading || undefined,
    deepDives: sp.deepDives || undefined,
    photos: {},
    createdAt: sp.createdAt,
  };
}

function deduplicateProfiles(local: OracleProfile[], server: OracleProfile[]): OracleProfile[] {
  const merged = local.map((lp) => {
    const matchingServer = server.find(
      (sp) =>
        sp.id === lp.id ||
        (`${sp.name.toLowerCase().trim()}|${sp.dob}` === `${lp.name.toLowerCase().trim()}|${lp.dob}`),
    );
    if (matchingServer && !lp.serverId) {
      return { ...lp, serverId: matchingServer.serverId };
    }
    return lp;
  });

  const seenKeys = new Set(merged.map((p) => `${p.name.toLowerCase().trim()}|${p.dob}`));
  const seenIds = new Set(merged.map((p) => p.id));
  const seenServerIds = new Set(merged.filter((p) => p.serverId).map((p) => p.serverId));

  for (const sp of server) {
    const key = `${sp.name.toLowerCase().trim()}|${sp.dob}`;
    if (!seenKeys.has(key) && !seenIds.has(sp.id) && !seenServerIds.has(sp.serverId)) {
      merged.push(sp);
      seenKeys.add(key);
      seenIds.add(sp.id);
      if (sp.serverId) seenServerIds.add(sp.serverId);
    }
  }
  return merged;
}

async function syncProfileToServer(
  profile: OracleProfile,
  onServerIdReceived?: (localId: string, serverId: string) => void,
) {
  try {
    const result = await customFetch<{ profile: { id: string } }>("/api/profiles", {
      method: "POST",
      body: JSON.stringify(profileToServerPayload(profile)),
      headers: { "Content-Type": "application/json" },
    });
    if (result.profile?.id && onServerIdReceived) {
      onServerIdReceived(profile.id, result.profile.id);
    }
  } catch (e) {
    console.error("Failed to sync profile to server:", e);
  }
}

async function deleteProfileFromServer(profile: OracleProfile) {
  try {
    if (profile.serverId) {
      await customFetch(`/api/profiles/${profile.serverId}`, { method: "DELETE" });
      return;
    }
    const result = await customFetch<{ profiles: ServerProfile[] }>("/api/profiles", {
      method: "GET",
    });
    const serverProfile = result.profiles.find(
      (sp) => sp.localId === profile.id || sp.id === profile.id,
    );
    if (serverProfile) {
      await customFetch(`/api/profiles/${serverProfile.id}`, { method: "DELETE" });
    }
  } catch (e) {
    console.error("Failed to delete profile from server:", e);
  }
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<OracleProfile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const hasSynced = useRef(false);

  const maxProfiles = isPaid ? Infinity : FREE_MAX;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw === null) {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      } else {
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

  const handleServerIdReceived = useCallback((localId: string, serverId: string) => {
    setProfiles((prev) => {
      const updated = prev.map((p) =>
        p.id === localId && !p.serverId ? { ...p, serverId } : p,
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  useEffect(() => {
    if (!isLoaded || authLoading) return;

    if (isLoggedIn && !hasSynced.current) {
      hasSynced.current = true;
      (async () => {
        try {
          const result = await customFetch<{ profiles: ServerProfile[] }>("/api/profiles", {
            method: "GET",
          });
          const serverProfiles = result.profiles.map(serverProfileToLocal);

          setProfiles((current) => {
            const merged = deduplicateProfiles(current, serverProfiles);

            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch(console.error);

            for (const local of current) {
              const existsOnServer = result.profiles.some(
                (sp) => sp.localId === local.id || (`${sp.name.toLowerCase().trim()}|${sp.dob}` === `${local.name.toLowerCase().trim()}|${local.dob}`)
              );
              if (!existsOnServer) {
                syncProfileToServer(local, handleServerIdReceived);
              }
            }

            return merged;
          });
        } catch (e) {
          console.error("Failed to sync profiles on login:", e);
        }
      })();
    }

    if (!isLoggedIn && hasSynced.current) {
      hasSynced.current = false;
      setProfiles([]);
      AsyncStorage.removeItem(STORAGE_KEY).catch(console.error);
    }
  }, [isLoggedIn, isLoaded, authLoading, handleServerIdReceived]);

  const addProfile = useCallback(async (p: Omit<OracleProfile, "id" | "createdAt">) => {
    if (!isPaid && profiles.length >= FREE_MAX) return null;
    const newProfile: OracleProfile = {
      ...p,
      id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: Date.now(),
    };
    await persist([...profiles, newProfile]);
    if (isLoggedIn) {
      syncProfileToServer(newProfile, handleServerIdReceived);
    }
    return newProfile;
  }, [profiles, isPaid, persist, isLoggedIn, handleServerIdReceived]);

  const updateProfile = useCallback(async (id: string, updates: Partial<OracleProfile>) => {
    const updated = profiles.map(p => p.id === id ? { ...p, ...updates } : p);
    await persist(updated);
    if (isLoggedIn) {
      const profile = updated.find(p => p.id === id);
      if (profile) syncProfileToServer(profile, handleServerIdReceived);
    }
  }, [profiles, persist, isLoggedIn, handleServerIdReceived]);

  const deleteProfile = useCallback(async (id: string) => {
    const profileToDelete = profiles.find(p => p.id === id);
    await persist(profiles.filter(p => p.id !== id));
    if (isLoggedIn && profileToDelete) {
      deleteProfileFromServer(profileToDelete);
    }
  }, [profiles, persist, isLoggedIn]);

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
