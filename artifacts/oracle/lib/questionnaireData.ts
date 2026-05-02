import type { QuestionnaireAnswers } from "@/context/OracleContext";

export interface QuestionnaireOption {
  label: string;
  value: string;
  icon: string;
}

export interface QuestionnaireQuestion {
  field: keyof QuestionnaireAnswers;
  prompt: string;
  options: QuestionnaireOption[];
}

export const QUESTIONNAIRE_STORAGE_KEY = "oracle_questionnaire_answers";

export const QUESTIONNAIRE_QUESTIONS: QuestionnaireQuestion[] = [
  {
    field: "decisionStyle",
    prompt: "How do you usually make important decisions?",
    options: [
      { label: "Trust my gut, decide fast", value: "Trust my gut, decide fast", icon: "zap" },
      { label: "Research everything first", value: "Research everything first", icon: "search" },
      { label: "Talk it through with people I trust", value: "Talk it through with people I trust", icon: "message-circle" },
      { label: "Wait until the answer feels obvious", value: "Wait until the answer feels obvious", icon: "clock" },
    ],
  },
  {
    field: "pressureResponse",
    prompt: "How do you tend to respond under real pressure?",
    options: [
      { label: "Push through, harder", value: "Push through, harder", icon: "shield" },
      { label: "Step back and observe", value: "Step back and observe", icon: "eye" },
      { label: "Reach out for support", value: "Reach out for support", icon: "users" },
      { label: "Withdraw to recharge alone", value: "Withdraw to recharge alone", icon: "moon" },
    ],
  },
  {
    field: "relationshipPattern",
    prompt: "What is your usual pattern in close relationships?",
    options: [
      { label: "I fall in fast and deep", value: "I fall in fast and deep", icon: "heart" },
      { label: "I keep my walls up at first", value: "I keep my walls up at first", icon: "lock" },
      { label: "I love completely once I'm in", value: "I love completely once I'm in", icon: "user-plus" },
      { label: "I keep one foot out the door", value: "I keep one foot out the door", icon: "star" },
    ],
  },
  {
    field: "coreMotivation",
    prompt: "What drives you most?",
    options: [
      { label: "Creator — Creating something meaningful", value: "Creator — Creating something meaningful", icon: "feather" },
      { label: "Analyst — Understanding how things work", value: "Analyst — Understanding how things work", icon: "settings" },
      { label: "Connector — Connecting deeply with others", value: "Connector — Connecting deeply with others", icon: "link-2" },
      { label: "Explorer — Living freely on my own terms", value: "Explorer — Living freely on my own terms", icon: "wind" },
    ],
  },
  {
    field: "biggestChallenge",
    prompt: "What's your biggest internal challenge right now?",
    options: [
      { label: "Fixing what feels broken", value: "Fixing what feels broken", icon: "tool" },
      { label: "Quieting overthinking", value: "Quieting overthinking", icon: "rotate-cw" },
      { label: "Holding onto hope", value: "Holding onto hope", icon: "sun" },
      { label: "Finishing what I start", value: "Finishing what I start", icon: "circle" },
    ],
  },
  {
    field: "energyStyle",
    prompt: "How does your energy move through the day?",
    options: [
      { label: "Bursts — intense, then crash", value: "Bursts — intense, then crash", icon: "zap" },
      { label: "Steady current — even all day", value: "Steady current — even all day", icon: "trending-up" },
      { label: "Waves — peaks and troughs", value: "Waves — peaks and troughs", icon: "activity" },
      { label: "Slow build — warms up over time", value: "Slow build — warms up over time", icon: "thermometer" },
    ],
  },
  {
    field: "currentNeed",
    prompt: "What do you most need right now?",
    options: [
      { label: "Connection with the right people", value: "Connection with the right people", icon: "users" },
      { label: "Direction — to know which way", value: "Direction — to know which way", icon: "compass" },
      { label: "Peace — to settle inside", value: "Peace — to settle inside", icon: "sun" },
      { label: "Freedom — to break a pattern", value: "Freedom — to break a pattern", icon: "unlock" },
    ],
  },
  {
    field: "selfPerception",
    prompt: "How do others see you vs. how you see yourself?",
    options: [
      { label: "They see a mask I wear well", value: "They see a mask I wear well", icon: "user" },
      { label: "They see half of who I am", value: "They see half of who I am", icon: "minimize-2" },
      { label: "They see clearly through me", value: "They see clearly through me", icon: "eye" },
      { label: "I'm not sure who they see", value: "I'm not sure who they see", icon: "help-circle" },
    ],
  },
];
