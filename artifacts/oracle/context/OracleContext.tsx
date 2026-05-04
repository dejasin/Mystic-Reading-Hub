import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export interface UserData {
  name: string;
  // Birth-related fields are no longer collected at intake (Task #65 —
  // removed to keep the first-screen experience aligned with the AI life
  // advisor repositioning). They remain optional on the type so existing
  // stored profiles and downstream code that still references them keep
  // compiling without changes.
  dob?: string;
  birthTime?: string;
  birthTimeUnknown?: boolean;
  birthCity?: string;
  birthCountry?: string;
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

// Task #60 — eight-question behavioral intake. Each field stores the
// human-readable label of the option the seeker tapped.
export interface QuestionnaireAnswers {
  decisionStyle: string;
  pressureResponse: string;
  relationshipPattern: string;
  coreMotivation: string;
  biggestChallenge: string;
  energyStyle: string;
  currentNeed: string;
  selfPerception: string;
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
  scoresFallback: boolean;
  questionnaireAnswers: QuestionnaireAnswers | null;
  // Task #65 — id of the OracleProfile this session is anchored to.
  // Set by the ritual when it auto-creates a profile, or by
  // profile-action when an existing profile starts a new session.
  // Replaces the old name+dob lookup used by reading.tsx /
  // deep-dive.tsx since intake no longer collects DOB.
  currentProfileId: string | null;
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
  setBehavioralScores: (scores: BehavioralScores | null, fallback?: boolean) => void;
  setQuestionnaireAnswers: (answers: QuestionnaireAnswers | null) => void;
  setCurrentProfileId: (id: string | null) => void;
  resetAll: () => void;
}

const defaultUserData: UserData = {
  name: "",
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
  scoresFallback: false,
  questionnaireAnswers: null,
  currentProfileId: null,
};

const BEHAVIORAL_SCORES_KEY = "oracle_behavioral_scores";
const QUESTIONNAIRE_KEY = "oracle_questionnaire_answers";

const OracleContext = createContext<OracleContextValue | null>(null);

export function OracleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OracleState>(defaultState);
  const hydratedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [scoresRaw, qaRaw] = await Promise.all([
          AsyncStorage.getItem(BEHAVIORAL_SCORES_KEY),
          AsyncStorage.getItem(QUESTIONNAIRE_KEY),
        ]);

        let nextScores: BehavioralScores | null = null;
        let nextScoresUpdatedAt: number | null = null;
        let nextScoresFallback = false;
        if (scoresRaw) {
          try {
            const parsed = JSON.parse(scoresRaw);
            if (parsed && parsed.scores && typeof parsed.scores.intuition === "number") {
              nextScores = parsed.scores;
              nextScoresUpdatedAt = parsed.updatedAt ?? null;
              nextScoresFallback = parsed.scoresFallback ?? false;
            }
          } catch {}
        }

        let nextQA: QuestionnaireAnswers | null = null;
        if (qaRaw) {
          try {
            const parsed = JSON.parse(qaRaw);
            if (
              parsed &&
              typeof parsed === "object" &&
              typeof parsed.coreMotivation === "string" &&
              parsed.coreMotivation.length > 0
            ) {
              nextQA = parsed as QuestionnaireAnswers;
            }
          } catch {}
        }

        setState(prev => ({
          ...prev,
          behavioralScores: nextScores,
          behavioralScoresUpdatedAt: nextScoresUpdatedAt,
          scoresFallback: nextScoresFallback,
          questionnaireAnswers: nextQA,
        }));
      } catch (e) {
        console.warn("Failed to hydrate Oracle context:", e);
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
      currentProfileId: null,
    }));
  };

  const setCurrentProfileId = (id: string | null) => {
    setState(prev => ({ ...prev, currentProfileId: id }));
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

  const setBehavioralScores = (scores: BehavioralScores | null, fallback?: boolean) => {
    const updatedAt = scores ? Date.now() : null;
    setState(prev => ({
      ...prev,
      behavioralScores: scores,
      behavioralScoresUpdatedAt: updatedAt,
      scoresFallback: fallback ?? false,
    }));
    (async () => {
      try {
        if (scores) {
          await AsyncStorage.setItem(
            BEHAVIORAL_SCORES_KEY,
            JSON.stringify({ scores, updatedAt, scoresFallback: fallback ?? false }),
          );
        } else {
          await AsyncStorage.removeItem(BEHAVIORAL_SCORES_KEY);
        }
      } catch (e) {
        console.warn("Failed to persist behavioral scores:", e);
      }
    })();
  };

  const setQuestionnaireAnswers = (answers: QuestionnaireAnswers | null) => {
    setState(prev => ({ ...prev, questionnaireAnswers: answers }));
    (async () => {
      try {
        if (answers) {
          await AsyncStorage.setItem(QUESTIONNAIRE_KEY, JSON.stringify(answers));
        } else {
          await AsyncStorage.removeItem(QUESTIONNAIRE_KEY);
        }
      } catch (e) {
        console.warn("Failed to persist questionnaire answers:", e);
      }
    })();
  };

  const resetAll = () => {
    setState({
      ...defaultState,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      questionnaireAnswers: state.questionnaireAnswers,
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
      setQuestionnaireAnswers,
      setCurrentProfileId,
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
