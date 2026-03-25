import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState, useRef } from "react";

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

export interface OracleState {
  sessionId: string;
  userData: UserData;
  images: {
    right_palm?: CapturedImage;
    left_palm?: CapturedImage;
    right_iris?: CapturedImage;
    left_iris?: CapturedImage;
    face?: CapturedImage;
    face_front?: CapturedImage;
    face_left?: CapturedImage;
    face_right?: CapturedImage;
  };
  freeReading: string;
  paidReading: string;
  archetypeReading: string;
  chineseFaceReading: string;
  iridologyReading: string;
  readingComplete: boolean;
  isPaid: boolean;
  deepDives: Partial<Record<DeepDiveCategory, string>>;
}

interface OracleContextValue {
  state: OracleState;
  setUserData: (data: UserData) => void;
  updateUserData: (partial: Partial<UserData>) => void;
  setImage: (key: keyof OracleState["images"], img: CapturedImage | undefined) => void;
  appendFreeReading: (text: string) => void;
  appendPaidReading: (text: string) => void;
  appendArchetype: (text: string) => void;
  appendChineseFaceReading: (text: string) => void;
  appendIridologyReading: (text: string) => void;
  setReadingComplete: (v: boolean) => void;
  setPaid: (v: boolean) => void;
  appendDeepDive: (category: DeepDiveCategory, text: string) => void;
  clearDeepDive: (category: DeepDiveCategory) => void;
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
  chineseFaceReading: "",
  iridologyReading: "",
  readingComplete: false,
  isPaid: false,
  deepDives: {},
};

const OracleContext = createContext<OracleContextValue | null>(null);

export function OracleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OracleState>(defaultState);

  const setUserData = (data: UserData) => {
    setState(prev => ({ ...prev, userData: data }));
  };

  const updateUserData = (partial: Partial<UserData>) => {
    setState(prev => ({ ...prev, userData: { ...prev.userData, ...partial } }));
  };

  const setImage = (key: keyof OracleState["images"], img: CapturedImage | undefined) => {
    setState(prev => {
      const updated = { ...prev.images, [key]: img };
      if (key === "face" && img && !prev.images.face_front) {
        updated.face_front = img;
      }
      if (key === "face_front" && img && !prev.images.face) {
        updated.face = img;
      }
      return { ...prev, images: updated };
    });
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

  const appendChineseFaceReading = (text: string) => {
    setState(prev => ({ ...prev, chineseFaceReading: prev.chineseFaceReading + text }));
  };

  const appendIridologyReading = (text: string) => {
    setState(prev => ({ ...prev, iridologyReading: prev.iridologyReading + text }));
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
      appendChineseFaceReading, appendIridologyReading,
      setReadingComplete, setPaid,
      appendDeepDive, clearDeepDive,
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
