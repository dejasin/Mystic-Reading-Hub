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

export interface OracleState {
  sessionId: string;
  userData: UserData;
  images: {
    right_palm?: CapturedImage;
    left_palm?: CapturedImage;
    right_iris?: CapturedImage;
    left_iris?: CapturedImage;
    face?: CapturedImage;
  };
  freeReading: string;
  paidReading: string;
  archetypeReading: string;
  readingComplete: boolean;
  isPaid: boolean;
}

interface OracleContextValue {
  state: OracleState;
  setUserData: (data: UserData) => void;
  setImage: (key: keyof OracleState["images"], img: CapturedImage | undefined) => void;
  appendFreeReading: (text: string) => void;
  appendPaidReading: (text: string) => void;
  appendArchetype: (text: string) => void;
  setReadingComplete: (v: boolean) => void;
  setPaid: (v: boolean) => void;
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
};

const OracleContext = createContext<OracleContextValue | null>(null);

export function OracleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OracleState>(defaultState);

  const setUserData = (data: UserData) => {
    setState(prev => ({ ...prev, userData: data }));
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

  const setReadingComplete = (v: boolean) => {
    setState(prev => ({ ...prev, readingComplete: v }));
  };

  const setPaid = (v: boolean) => {
    setState(prev => ({ ...prev, isPaid: v }));
  };

  const resetAll = () => {
    setState({
      ...defaultState,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  };

  return (
    <OracleContext.Provider value={{
      state, setUserData, setImage,
      appendFreeReading, appendPaidReading, appendArchetype,
      setReadingComplete, setPaid, resetAll,
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
