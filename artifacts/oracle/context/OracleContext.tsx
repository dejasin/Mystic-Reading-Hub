import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export interface UserData {
  name: string;
  dob: string;
  birthTime: string;
  birthTimeUnknown: boolean;
  birthCity: string;
  birthCountry: string;
  gender: string;
  dominantHand: string;
  eyeColor: string;
  q1: string;
  q2: string;
  q3: string;
}

export interface CapturedImage {
  uri: string;
  base64?: string;
}

export type DeepDiveCategory = "career" | "relationship" | "finances" | "fitness" | "family";

export interface BehavioralScores {
  intuition: number;
  emotionalDepth: number;
  drive: number;
  adaptability: number;
  innerKnowing: number;
  expression: number;
}

export interface OracleState {
  sessionId: string;
  userData: UserData;
  images: {
    right_palm?: CapturedImage;
    left_palm?: CapturedImage;
  };
  freeReading: string;
  paidReading: string;
  archetypeReading: string;
  readingComplete: boolean;
  isPaid: boolean;
  deepDives: Partial<Record<DeepDiveCategory, string>>;
  behavioralScores: BehavioralScores | null;
  behavioralScoresUpdatedAt: number | null;
}

interface OracleContextValue {
  state: OracleState;
  setUserData: (data: UserData) => void;
  updateUserData: (partial: Partial<UserData>) => void;
  setImage: (key: keyof OracleState["images"], img: CapturedImage | undefined) => void;
  appendFreeReading: (text: string) => void;
  appendPaidReading: (text: string) => void;
  appendArchetype: (text: string) => void;
  resetFreeReading: () => void;
  resetPaidReading: () => void;
  setReadingComplete: (v: boolean) => void;
  setPaid: (v: boolean) => void;
  appendDeepDive: (category: DeepDiveCategory, text: string) => void;
  clearDeepDive: (category: DeepDiveCategory) => void;
  setBehavioralScores: (scores: BehavioralScores | null) => void;
  resetAll: () => void;
}

const defaultUserData: UserData = {
  name: "",
  dob: "",
  birthTime: "",
  birthTimeUnknown: false,
  birthCity: "",
  birthCountry: "",
  gender: "",
  dominantHand: "",
  eyeColor: "",
  q1: "",
  q2: "",
  q3: "",
};

const defaultState: OracleState = {
  sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  userData: defaultUserData,
  images: {},
  freeReading: "",
  paidReading: "",
  archetypeReading: "",
  readingComplete: false,
  isPaid: false,
  deepDives: {},
  behavioralScores: null,
  behavioralScoresUpdatedAt: null,
};

const BEHAVIORAL_SCORES_KEY = "oracle_behavioral_scores";

const OracleContext = createContext<OracleContextValue | null>(null);

export function OracleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OracleState>(defaultState);
  const hydratedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(BEHAVIORAL_SCORES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.scores && typeof parsed.scores.intuition === "number") {
            setState(prev => ({
              ...prev,
              behavioralScores: parsed.scores,
              behavioralScoresUpdatedAt: parsed.updatedAt ?? null,
            }));
          }
        }
      } catch (e) {
        console.warn("Failed to hydrate behavioral scores:", e);
      } finally {
        hydratedRef.current = true;
      }
    })();
  }, []);

  const setUserData = (data: UserData) => {
    setState(prev => ({
      ...prev,
      userData: data,
      images: {},
      freeReading: "",
      paidReading: "",
      archetypeReading: "",
      readingComplete: false,
      isPaid: false,
      deepDives: {},
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }));
  };

  const updateUserData = (partial: Partial<UserData>) => {
    setState(prev => ({ ...prev, userData: { ...prev.userData, ...partial } }));
  };

  const setImage = (key: keyof OracleState["images"], img: CapturedImage | undefined) => {
    setState(prev => ({ ...prev, images: { ...prev.images, [key]: img } }));
  };

  const appendFreeReading = (text: string) => {
    setState(prev => ({ ...prev, freeReading: prev.freeReading + text }));
  };

  const appendPaidReading = (text: string) => {
    setState(prev => ({ ...prev, paidReading: prev.paidReading + text }));
  };

  const appendArchetype = (text: string) => {
    setState(prev => ({ ...prev, archetypeReading: prev.archetypeReading + text }));
  };

  const resetFreeReading = () => {
    setState(prev => ({ ...prev, freeReading: "" }));
  };

  const resetPaidReading = () => {
    setState(prev => ({
      ...prev,
      paidReading: "",
      archetypeReading: "",
    }));
  };

  const setReadingComplete = (v: boolean) => {
    setState(prev => ({ ...prev, readingComplete: v }));
  };

  const setPaid = (v: boolean) => {
    setState(prev => ({ ...prev, isPaid: v }));
  };

  const appendDeepDive = (category: DeepDiveCategory, text: string) => {
    setState(prev => ({
      ...prev,
      deepDives: {
        ...prev.deepDives,
        [category]: (prev.deepDives[category] ?? "") + text,
      },
    }));
  };

  const clearDeepDive = (category: DeepDiveCategory) => {
    setState(prev => ({
      ...prev,
      deepDives: { ...prev.deepDives, [category]: "" },
    }));
  };

  const setBehavioralScores = (scores: BehavioralScores | null) => {
    const updatedAt = scores ? Date.now() : null;
    setState(prev => ({
      ...prev,
      behavioralScores: scores,
      behavioralScoresUpdatedAt: updatedAt,
    }));
    (async () => {
      try {
        if (scores) {
          await AsyncStorage.setItem(
            BEHAVIORAL_SCORES_KEY,
            JSON.stringify({ scores, updatedAt }),
          );
        } else {
          await AsyncStorage.removeItem(BEHAVIORAL_SCORES_KEY);
        }
      } catch (e) {
        console.warn("Failed to persist behavioral scores:", e);
      }
    })();
  };

  const resetAll = () => {
    setState({
      ...defaultState,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  };

  return (
    <OracleContext.Provider value={{
      state, setUserData, updateUserData, setImage,
      appendFreeReading, appendPaidReading, appendArchetype,
      resetFreeReading, resetPaidReading,
      setReadingComplete, setPaid,
      appendDeepDive, clearDeepDive,
      setBehavioralScores,
      resetAll,
    }}>
      {children}
    </OracleContext.Provider>
  );
}

export function useOracle() {
  const ctx = useContext(OracleContext);
  if (!ctx) throw new Error("useOracle must be used inside OracleProvider");
  return ctx;
}
